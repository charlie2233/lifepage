import OpenAI from "openai";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { buildArtifactMeta } from "@/lib/agent-mutations";
import { parseAgentArtifactMeta } from "@/lib/agent-artifacts";
import { reserveVideoGeneration } from "@/lib/billing";
import {
  ProjectMediaObjectSchema,
  normalizeProjectMedia,
  type ProjectMediaObject,
} from "@/lib/project-media";
import {
  ProjectVideoArtifactOutputSchema,
  ProjectVideoStateSchema,
  type ProjectVideoArtifactOutput,
  type ProjectVideoDuration,
  type ProjectVideoState,
  type ProjectVideoStyle,
} from "@/lib/project-video-types";
import { ProfileJSONSchema, type ProfileJSON } from "@/lib/schema";
import { storeProjectVideoAssets } from "@/lib/project-video-storage";

interface ProjectVideoEvidenceItem {
  screenshot?: string | null;
  title?: string | null;
  url?: string | null;
}

function getOpenAI(apiKey: string) {
  return new OpenAI({ apiKey });
}

function getProjectVideoSummary(state: ProjectVideoState) {
  if (state.status === "completed") {
    return `Generated an ${state.durationSeconds}s demo video for ${state.projectTitle}.`;
  }

  if (state.status === "failed") {
    return state.error
      ? `Video generation failed for ${state.projectTitle}: ${state.error}`
      : `Video generation failed for ${state.projectTitle}.`;
  }

  if (state.status === "in_progress") {
    return `Still rendering the ${state.projectTitle} demo video${typeof state.progress === "number" ? ` (${Math.round(state.progress)}%)` : ""}.`;
  }

  return `Queued an ${state.durationSeconds}s demo video for ${state.projectTitle}.`;
}

function toArtifactOutput(state: ProjectVideoState): ProjectVideoArtifactOutput {
  return ProjectVideoArtifactOutputSchema.parse({
    ...state,
    summary: getProjectVideoSummary(state),
  });
}

function normalizePromptText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function buildProjectVideoPrimaryRequest(args: {
  displayName?: string | null;
  headline?: string | null;
  project: ProfileJSON["projects"][number];
}) {
  const details = [
    args.project.problem,
    args.project.approach,
    args.project.impact,
  ]
    .map(normalizePromptText)
    .filter(Boolean)
    .join(" ");

  return [
    `${args.project.title} as a polished product demo for a public portfolio page`,
    args.displayName ? `showing the work of ${args.displayName}` : null,
    args.headline ? `who is positioned as ${args.headline}` : null,
    details ? `with the story grounded in: ${details}` : null,
  ]
    .filter(Boolean)
    .join(", ");
}

export function buildProjectVideoPrompt(args: {
  displayName?: string | null;
  headline?: string | null;
  mode: "hiring" | "admissions";
  project: ProfileJSON["projects"][number];
  style?: ProjectVideoStyle;
}) {
  const project = args.project;
  const safeTech =
    project.tech.length > 0
      ? `UI and product details can hint at ${project.tech.slice(0, 5).join(", ")}.`
      : "Keep the visuals product-oriented rather than generic abstract motion.";
  const portfolioAngle =
    args.mode === "admissions"
      ? "Frame it as a thoughtful portfolio proof piece that shows initiative, depth, and growth."
      : "Frame it as a strong proof-of-work case study that shows execution, clarity, and real product thinking.";

  return [
    "Use case: inline project demo on a personal portfolio page",
    `Primary request: ${buildProjectVideoPrimaryRequest(args)}`,
    "Scene/background: premium app/product environment, clean interface moments, subtle transitions, no people, no copyrighted brands, no music lyrics, no public figures.",
    `Subject: the project "${project.title}" expressed through interface states, workflow moments, product diagrams, browser/device frames, and detail shots.`,
    `Action: show the problem, the core product flow, and the resulting impact in one compact visual arc.${project.impact ? ` End with a clear visual beat suggesting: ${project.impact}` : ""}`,
    "Camera: clean product-demo camera language, slow push-ins, smooth pans, macro UI details, restrained motion.",
    "Lighting/mood: premium, crisp, optimistic, modern, product-led.",
    "Color palette: neutral graphite, warm white, accent cyan, muted silver.",
    "Style/format: high-end SaaS/product demo reel, not a cinematic trailer, no talking head, no narration.",
    "Timing/beats: beat 1 establish problem context, beat 2 show core workflow, beat 3 show outcome and credibility.",
    "Audio: no dialogue, no voiceover, subtle interface-forward ambient feel only.",
    `Constraints: ${portfolioAngle} ${safeTech} Keep the result under-18 safe. Do not include copyrighted logos or real-person likenesses.`,
    "Avoid: noisy montage cuts, flashy gaming aesthetics, shaky camera, unreadable UI text, fake testimonials, fake metrics overlays.",
  ].join("\n");
}

function chooseEvidenceScreenshot(
  project: ProfileJSON["projects"][number],
  evidenceItems: ProjectVideoEvidenceItem[]
) {
  const projectHosts = project.links
    .map((link) => {
      try {
        return new URL(link.url).hostname;
      } catch {
        return null;
      }
    })
    .filter((value): value is string => Boolean(value));

  if (projectHosts.length === 0) {
    return evidenceItems.find((item) => item.screenshot)?.screenshot ?? null;
  }

  return (
    evidenceItems.find((item) => {
      if (!item.url || !item.screenshot) return false;
      try {
        return projectHosts.includes(new URL(item.url).hostname);
      } catch {
        return false;
      }
    })?.screenshot ?? null
  );
}

async function buildReferenceUploadable(screenshotUrl?: string | null) {
  if (!screenshotUrl) {
    return undefined;
  }

  let absoluteUrl: URL;
  try {
    absoluteUrl = new URL(
      screenshotUrl,
      process.env.AUTH_URL ??
        process.env.NEXTAUTH_URL ??
        "http://localhost:3000"
    );
  } catch {
    return undefined;
  }

  const response = await fetch(absoluteUrl);
  if (!response.ok) {
    return undefined;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!/^image\/(png|jpeg|jpg|webp)$/i.test(contentType)) {
    return undefined;
  }

  const extension = contentType.includes("png")
    ? "png"
    : contentType.includes("webp")
      ? "webp"
      : "jpg";
  const buffer = Buffer.from(await response.arrayBuffer());

  return new File([buffer], `reference.${extension}`, {
    type: contentType,
  });
}

function getVideoDownloadVariantResponse(
  response: Awaited<ReturnType<OpenAI["videos"]["downloadContent"]>>
) {
  return response.arrayBuffer();
}

async function fetchActiveProfile(userId: string) {
  const profile = await prisma.generatedProfile.findFirst({
    where: { userId, isActive: true },
    orderBy: { createdAt: "desc" },
    select: {
      data: true,
    },
  });

  if (!profile) {
    throw new Error("Generate a profile first before creating project demo videos.");
  }

  const parsed = ProfileJSONSchema.safeParse(profile.data);
  if (!parsed.success) {
    throw new Error("The active profile is invalid and cannot be used for video generation.");
  }

  return {
    profile: parsed.data,
  };
}

function upsertProjectVideoMedia(
  profile: ProfileJSON,
  projectIndex: number,
  media: ProjectMediaObject
) {
  const nextProjects = profile.projects.map((project, index) => {
    if (index !== projectIndex) {
      return project;
    }

    const normalizedMedia = normalizeProjectMedia(project.media);
    const filteredMedia = normalizedMedia.filter(
      (item) =>
        item.sourceArtifactId !== media.sourceArtifactId &&
        !(
          item.type === "video" &&
          item.provider === media.provider &&
          item.title === media.title
        )
    );

    return {
      ...project,
      media: [...filteredMedia, media],
    };
  });

  return ProfileJSONSchema.parse({
    ...profile,
    projects: nextProjects,
  });
}

async function persistProjectVideoToProfile(args: {
  artifactId: string;
  durationSeconds: ProjectVideoDuration;
  posterUrl?: string | null;
  projectIndex: number;
  profile: ProfileJSON;
  projectTitle: string;
  storageKey?: string | null;
  userId: string;
  videoUrl: string;
}) {
  const mediaEntry = ProjectMediaObjectSchema.parse({
    type: "video",
    url: args.videoUrl,
    posterUrl: args.posterUrl ?? null,
    title: `${args.projectTitle} demo video`,
    provider: "openai-sora",
    status: "ready",
    durationSeconds: args.durationSeconds,
    storageKey: args.storageKey ?? null,
    sourceArtifactId: args.artifactId,
    error: null,
  });

  const updatedProfile = upsertProjectVideoMedia(
    args.profile,
    args.projectIndex,
    mediaEntry
  );

  await prisma.$transaction(async (tx) => {
    await tx.generatedProfile.updateMany({
      where: { userId: args.userId, isActive: true },
      data: { isActive: false },
    });

    await tx.generatedProfile.create({
      data: {
        userId: args.userId,
        data: updatedProfile as Prisma.InputJsonValue,
        isActive: true,
      },
    });
  });

  return updatedProfile;
}

export async function createProjectVideoArtifact(args: {
  durationSeconds?: ProjectVideoDuration;
  evidenceItems: ProjectVideoEvidenceItem[];
  executionMode?: "artifact" | "mutate";
  input?: string | null;
  mode: "hiring" | "admissions";
  projectIndex: number;
  profile: ProfileJSON;
  projectTitleOverride?: string | null;
  resolvedPersonaSkillId?: string | null;
  resolvedWorkflowSkillId?: string | null;
  strategy: Record<string, unknown>;
  userId: string;
  userName?: string | null;
}) {
  const project = args.profile.projects[args.projectIndex];
  if (!project) {
    throw new Error("The selected project could not be found.");
  }

  if (!normalizePromptText(project.problem) && !normalizePromptText(project.approach)) {
    throw new Error(
      "This project needs at least a problem or approach before a demo video can be generated."
    );
  }

  const reservation = await reserveVideoGeneration(args.userId);
  const prompt = buildProjectVideoPrompt({
    displayName: args.userName ?? null,
    headline: args.profile.headline,
    mode: args.mode,
    project,
    style: "polished-product-demo",
  });
  const screenshotUrl = chooseEvidenceScreenshot(project, args.evidenceItems);
  const inputReference = await buildReferenceUploadable(screenshotUrl);
  const video = await getOpenAI(reservation.clientConfig.apiKey).videos.create({
    model: process.env.OPENAI_SORA_MODEL ?? "sora-2",
    prompt,
    seconds: String(args.durationSeconds ?? 8) as "4" | "8" | "12",
    size: "1280x720",
    ...(inputReference ? { input_reference: inputReference } : {}),
  });

  const state = ProjectVideoStateSchema.parse({
    projectIndex: args.projectIndex,
    projectTitle: args.projectTitleOverride ?? project.title,
    style: "polished-product-demo",
    durationSeconds: args.durationSeconds ?? 8,
    provider: "openai-sora",
    prompt,
    status: video.status === "in_progress" ? "in_progress" : video.status,
    progress: typeof video.progress === "number" ? video.progress : null,
    soraVideoId: video.id,
    videoUrl: null,
    posterUrl: null,
    videoStorageKey: null,
    posterStorageKey: null,
    evidenceScreenshotUsed: Boolean(inputReference),
    error: video.error?.message ?? null,
  });

  const artifact = await prisma.agentArtifact.create({
    data: {
      userId: args.userId,
      tool: "generate_project_video",
      style: "polished-product-demo",
      input: args.input?.slice(0, 500) ?? null,
      output: toArtifactOutput(state) as Prisma.InputJsonValue,
      meta: buildArtifactMeta({
        executionMode: args.executionMode ?? "artifact",
        strategy: args.strategy,
        resolvedPersonaSkillId: args.resolvedPersonaSkillId ?? null,
        resolvedWorkflowSkillId: args.resolvedWorkflowSkillId ?? null,
        projectVideo: state,
        revertable: false,
      }) as Prisma.InputJsonValue,
    },
    select: {
      id: true,
    },
  });

  return {
    artifactId: artifact.id,
    billing: reservation.snapshot,
    output: toArtifactOutput(state),
    projectTitle: state.projectTitle,
  };
}

export async function refreshProjectVideoArtifact(args: {
  artifactId: string;
  userId: string;
}) {
  const artifact = await prisma.agentArtifact.findFirst({
    where: {
      id: args.artifactId,
      userId: args.userId,
      tool: "generate_project_video",
    },
    select: {
      id: true,
      output: true,
      meta: true,
    },
  });

  if (!artifact) {
    throw new Error("Project video job not found.");
  }

  const parsedMeta = parseAgentArtifactMeta(artifact.meta);
  const rawState =
    (artifact.output &&
      typeof artifact.output === "object" &&
      !Array.isArray(artifact.output)
      ? ProjectVideoArtifactOutputSchema.safeParse(artifact.output)
      : null) ?? null;
  const state =
    ProjectVideoStateSchema.safeParse(parsedMeta?.projectVideo).success
      ? ProjectVideoStateSchema.parse(parsedMeta?.projectVideo)
      : rawState?.success
        ? ProjectVideoStateSchema.parse(rawState.data)
        : null;

  if (!state || !state.soraVideoId) {
    throw new Error("This project video job is missing its Sora video id.");
  }
  const soraVideoId = state.soraVideoId;

  if (state.status === "completed" && state.videoUrl) {
    const activeProfile = await fetchActiveProfile(args.userId);
    return {
      artifactId: artifact.id,
      output: toArtifactOutput(state),
      profile: activeProfile.profile,
    };
  }

  const openai = getOpenAI(process.env.OPENAI_API_KEY!);
  const latest = await openai.videos.retrieve(soraVideoId);
  const nextState = {
    ...state,
    status: latest.status === "in_progress" ? "in_progress" : latest.status,
    progress: typeof latest.progress === "number" ? latest.progress : state.progress ?? null,
    error: latest.error?.message ?? null,
  } satisfies ProjectVideoState;

  let completedProfile: ProfileJSON | null = null;

  if (nextState.status === "completed" && !nextState.videoUrl) {
    const [videoResponse, posterResponse, activeProfile] = await Promise.all([
      openai.videos.downloadContent(soraVideoId, { variant: "video" }),
      openai.videos.downloadContent(soraVideoId, {
        variant: "thumbnail",
      }),
      fetchActiveProfile(args.userId),
    ]);

    const [videoBuffer, posterBuffer] = await Promise.all([
      getVideoDownloadVariantResponse(videoResponse).then((data) =>
        Buffer.from(data)
      ),
      getVideoDownloadVariantResponse(posterResponse).then((data) =>
        Buffer.from(data)
      ),
    ]);

    const storedAssets = await storeProjectVideoAssets({
      artifactId: artifact.id,
      projectTitle: nextState.projectTitle,
      videoBuffer,
      posterBuffer,
    });

    completedProfile = await persistProjectVideoToProfile({
      artifactId: artifact.id,
      durationSeconds: nextState.durationSeconds,
      posterUrl: storedAssets.posterUrl,
      projectIndex: nextState.projectIndex,
      profile: activeProfile.profile,
      projectTitle: nextState.projectTitle,
      storageKey: storedAssets.videoStorageKey,
      userId: args.userId,
      videoUrl: storedAssets.videoUrl,
    });

    nextState.videoUrl = storedAssets.videoUrl;
    nextState.posterUrl = storedAssets.posterUrl;
    nextState.videoStorageKey = storedAssets.videoStorageKey;
    nextState.posterStorageKey = storedAssets.posterStorageKey;
    nextState.progress = 100;
  }

  await prisma.agentArtifact.update({
    where: { id: artifact.id },
    data: {
      output: toArtifactOutput(nextState) as Prisma.InputJsonValue,
      meta: {
        ...(parsedMeta ?? {}),
        projectVideo: nextState,
      } as Prisma.InputJsonValue,
    },
  });

  return {
    artifactId: artifact.id,
    output: toArtifactOutput(nextState),
    profile: completedProfile,
  };
}
