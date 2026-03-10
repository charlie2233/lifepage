import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import {
  AI_PROVIDER_DEFINITIONS,
  getBillingSnapshot,
  reserveAiModel,
} from "@/lib/billing";
import { prisma } from "@/lib/db";
import {
  buildAgentContext,
  buildAgentPreferenceContext,
  buildAgentProductContext,
  buildAgentRuntimeContext,
  resolveAgentFocus,
} from "@/lib/agent-context";
import { AGENT_FOCUS_KINDS } from "@/lib/agent-focus";
import { parsePortfolioThemeConfig } from "@/lib/portfolio-themes";
import { parseResumeModelConfig } from "@/lib/resume-models";
import { generateProfileFromCrawl, generateProfileFromText } from "@/lib/ai";
import { crawlUrl, type CrawlResult } from "@/lib/crawler";
import {
  createMutationSummary,
  getCurrentPublicPageState,
  applyAgentPortfolioPatch,
  buildArtifactMeta,
} from "@/lib/agent-mutations";
import {
  getDefaultPersonaSkillForContext,
  getPersonaSkill,
  getWorkflowSkill,
  getWorkflowSkillForTool,
  PersonaSkillIdSchema,
  WorkflowSkillIdSchema,
} from "@/lib/agent-skills";
import { parseAgentPreferences } from "@/lib/agent-preferences";
import { parseAgentArtifactMeta } from "@/lib/agent-artifacts";
import {
  EXECUTABLE_AGENT_TOOLS,
  generateAgentMutationPlan,
  generateTimeline,
  normalizeAgentToolStyle,
  planAgentTurn,
  generateVideoScript,
  generateTree,
  setPortfolioTheme,
  setResumeModel,
  type AgentClarificationQuestion,
  type AgentTurnStrategy,
  type ExecutableAgentTool,
  type TimelineStyle,
  type VideoStyle,
  type TreeStyle,
  type PortfolioThemeOutput,
  type ResumeModelOutput,
} from "@/lib/agent-tools";
import { ProfileJSONSchema } from "@/lib/schema";
import { createProjectVideoArtifact } from "@/lib/project-videos";
import { z } from "zod";

const MAX_STORED_INPUT_LENGTH = 500;

class AgentClarificationError extends Error {
  reply: string;
  questions: AgentClarificationQuestion[];

  constructor(reply: string, questions: AgentClarificationQuestion[]) {
    super(reply);
    this.name = "AgentClarificationError";
    this.reply = reply;
    this.questions = questions;
  }
}

const RequestSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .default([]),
  // If provided, directly invoke a tool
  tool: z.enum(EXECUTABLE_AGENT_TOOLS).optional(),
  style: z.string().optional(),
  focus: z
    .object({
      kind: z.enum(AGENT_FOCUS_KINDS),
      index: z.number().int().min(0).optional(),
      evidenceId: z.string().min(1).optional(),
    })
    .optional(),
  personaSkillId: PersonaSkillIdSchema.optional(),
  workflowSkillId: WorkflowSkillIdSchema.optional(),
});

async function persistThemeResult(userId: string, output: unknown) {
  const theme = output as PortfolioThemeOutput;
  await prisma.publicPageSettings.upsert({
    where: { userId },
    create: {
      userId,
      theme: theme.themeId,
      themeConfig: theme.themeConfig
        ? (theme.themeConfig as Prisma.InputJsonValue)
        : Prisma.JsonNull,
    },
    update: {
      theme: theme.themeId,
      themeConfig: theme.themeConfig
        ? (theme.themeConfig as Prisma.InputJsonValue)
        : Prisma.JsonNull,
    },
  });
}

async function persistResumeModelResult(userId: string, output: unknown) {
  const resumeModel = output as ResumeModelOutput;
  await prisma.publicPageSettings.upsert({
    where: { userId },
    create: {
      userId,
      resumeModel: resumeModel.modelId,
      resumeModelConfig: resumeModel.modelConfig
        ? (resumeModel.modelConfig as Prisma.InputJsonValue)
        : Prisma.JsonNull,
    },
    update: {
      resumeModel: resumeModel.modelId,
      resumeModelConfig: resumeModel.modelConfig
        ? (resumeModel.modelConfig as Prisma.InputJsonValue)
        : Prisma.JsonNull,
    },
  });
}

function extractUrlFromMessage(message: string) {
  const explicitUrl = message.match(/https?:\/\/[^\s)]+/i)?.[0];
  if (explicitUrl) {
    return explicitUrl.replace(/[.,!?]+$/, "");
  }

  const domainLike = message.match(
    /\b(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s)]*)?/i
  )?.[0];
  return domainLike ? `https://${domainLike.replace(/[.,!?]+$/, "")}` : null;
}

function normalizeComparableUrl(url: string | null | undefined) {
  if (!url) return null;

  try {
    const parsed = new URL(
      /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`
    );
    parsed.hash = "";
    const normalized = parsed.toString();
    return normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
  } catch {
    return null;
  }
}

function buildCrawlResultFromEvidence(item: {
  url: string | null;
  title: string | null;
  description: string | null;
  rawContent: string | null;
  screenshot: string | null;
  metadata?: Prisma.JsonValue | null;
}): CrawlResult {
  return {
    url: item.url ?? "",
    title: item.title ?? "",
    description: item.description ?? "",
    ogImage: null,
    headings: [],
    links: [],
    bodyText: item.rawContent ?? item.description ?? "",
    screenshot: item.screenshot ?? null,
    crawlStatus: item.screenshot ? "ready" : "partial",
    screenshotStatus: item.screenshot ? "ready" : "unavailable",
    screenshotError: null,
    metadata:
      item.metadata && typeof item.metadata === "object" && !Array.isArray(item.metadata)
        ? (item.metadata as Record<string, string>)
        : {},
  };
}

function resolveProjectIndexFromMessage(
  projects: Array<{ title: string }>,
  message: string
) {
  const loweredMessage = message.toLowerCase();
  const matchingIndexes = projects
    .map((project, index) => ({
      index,
      matches: loweredMessage.includes(project.title.toLowerCase()),
    }))
    .filter((entry) => entry.matches);

  if (matchingIndexes.length === 1) {
    return matchingIndexes[0].index;
  }

  if (projects.length === 1) {
    return 0;
  }

  return null;
}

function getToolReply(
  tool: ExecutableAgentTool,
  style: string,
  focusLabel?: string | null
) {
  const styleLabel = style ? ` in ${style} mode` : "";
  const focusSuffix = focusLabel ? ` for ${focusLabel}` : "";

  switch (tool) {
    case "generate_timeline":
      return `I built a fresh timeline${styleLabel}${focusSuffix}.`;
    case "generate_video_script":
      return `I generated a new video script${styleLabel}${focusSuffix}.`;
    case "generate_project_video":
      return `I queued a real project demo video${focusSuffix}.`;
    case "generate_tree":
      return `I mapped the portfolio into a structured tree${styleLabel}${focusSuffix}.`;
    case "set_portfolio_theme":
      return `I updated the public portfolio UI${styleLabel}${focusSuffix}.`;
    case "set_resume_model":
      return `I updated the public resume presentation${styleLabel}${focusSuffix}.`;
    case "regenerate_profile":
      return `I rebuilt the active AI profile${focusSuffix}.`;
    case "recrawl_url":
      return `I refreshed the selected source URL${focusSuffix}.`;
  }
}

function toSkillSummary(
  skill: ReturnType<typeof getPersonaSkill> | ReturnType<typeof getWorkflowSkill>
) {
  if (!skill) return null;

  return {
    id: skill.id,
    label: skill.label,
    category: skill.category,
    description: skill.description,
  };
}

function buildClarificationResponse(args: {
  reply: string;
  questions: AgentClarificationQuestion[];
  focusLabel?: string | null;
  strategy: AgentTurnStrategy;
  resolvedPersonaSkill: ReturnType<typeof getPersonaSkill> | null;
  resolvedWorkflowSkill: ReturnType<typeof getWorkflowSkill> | null;
  billing: Awaited<ReturnType<typeof getBillingSnapshot>>;
}) {
  return NextResponse.json({
    type: "clarification",
    reply: args.reply,
    focusLabel: args.focusLabel,
    executionMode: "clarify",
    clarificationQuestions: args.questions,
    resolvedPersonaSkill: toSkillSummary(args.resolvedPersonaSkill),
    resolvedWorkflowSkill: toSkillSummary(args.resolvedWorkflowSkill),
    mutationSummary: null,
    revertable: false,
    strategy: {
      ...args.strategy,
      mode: "clarify",
      clarificationQuestions: args.questions,
      personaSkillId: args.resolvedPersonaSkill?.id,
      workflowSkillId: args.resolvedWorkflowSkill?.id,
      tool: undefined,
      style: undefined,
    },
    billing: args.billing,
  });
}

async function executeAgentTool(args: {
  userId: string;
  userName?: string | null;
  tool: ExecutableAgentTool;
  style?: string;
  context: string;
  message: string;
  focusLabel?: string | null;
  focus?: z.infer<typeof RequestSchema>["focus"];
  evidenceItems: Array<{
    id: string;
    type: string;
    title: string | null;
    description: string | null;
    url: string | null;
    rawContent: string | null;
    screenshot: string | null;
    metadata: Prisma.JsonValue | null;
    visible: boolean;
  }>;
  userProfile: {
    bio: string | null;
    github: string | null;
    linkedin: string | null;
    youtube: string | null;
  } | null;
  currentProfile: ReturnType<typeof ProfileJSONSchema.parse> | null;
  mode: "hiring" | "admissions";
  strategy: AgentTurnStrategy;
  resolvedPersonaSkillId?: string | null;
  resolvedWorkflowSkillId?: string | null;
  promptOptions: {
    focusLabel?: string;
    focusContext?: string;
    userRequest?: string;
  };
}) {
  const {
    userId,
    userName,
    tool,
    context,
    message,
    focus,
    evidenceItems,
    userProfile,
    currentProfile,
    mode,
    strategy,
    promptOptions,
  } = args;
  let output: unknown;
  let artifactId: string | undefined;
  const style = normalizeAgentToolStyle(tool, args.style);

  if (tool === "generate_timeline") {
    const aiReservation = await reserveAiModel(userId, { task: "timeline" });
    output = await generateTimeline(
      context,
      aiReservation.model,
      style as TimelineStyle,
      promptOptions,
      aiReservation.clientConfig,
      aiReservation.maxTokens
    );
  } else if (tool === "generate_video_script") {
    const aiReservation = await reserveAiModel(userId, { task: "video_script" });
    output = await generateVideoScript(
      context,
      aiReservation.model,
      style as VideoStyle,
      promptOptions,
      aiReservation.clientConfig,
      aiReservation.maxTokens
    );
  } else if (tool === "generate_project_video") {
    if (!currentProfile) {
      throw new Error(
        "Generate a profile first before asking LifeAgent to create project demo videos."
      );
    }

    const projectIndex =
      focus?.kind === "project" && typeof focus.index === "number"
        ? focus.index
        : resolveProjectIndexFromMessage(currentProfile.projects, message);

    if (projectIndex === null || projectIndex === undefined) {
      throw new AgentClarificationError(
        "I can generate a project demo video, but I need to know which project to use.",
        [
          {
            id: "project_video_target",
            label: "Project",
            question: "Which project should I turn into a demo video?",
            helpText:
              "Pick one project so I can build the Sora prompt and queue the render.",
            options: currentProfile.projects.slice(0, 4).map((project) => ({
              label: project.title,
              answer: `Generate a demo video for ${project.title}.`,
            })),
          },
        ]
      );
    }

    const created = await createProjectVideoArtifact({
      userId,
      userName,
      mode,
      profile: currentProfile,
      projectIndex,
      evidenceItems,
      input: message,
      strategy: {
        ...strategy,
        personaSkillId: args.resolvedPersonaSkillId ?? undefined,
        workflowSkillId: args.resolvedWorkflowSkillId ?? undefined,
      },
      resolvedPersonaSkillId: args.resolvedPersonaSkillId ?? null,
      resolvedWorkflowSkillId: args.resolvedWorkflowSkillId ?? null,
    });

    output = created.output;
    artifactId = created.artifactId;
  } else if (tool === "generate_tree") {
    const aiReservation = await reserveAiModel(userId, { task: "tree" });
    output = await generateTree(
      context,
      aiReservation.model,
      style as TreeStyle,
      promptOptions,
      aiReservation.clientConfig,
      aiReservation.maxTokens
    );
  } else if (tool === "set_portfolio_theme") {
    if (style === "custom") {
      const aiReservation = await reserveAiModel(userId, { task: "chat" });
      output = await setPortfolioTheme(
        context,
        aiReservation.model,
        style,
        promptOptions,
        aiReservation.clientConfig,
        aiReservation.maxTokens
      );
    } else {
      output = await setPortfolioTheme(context, "", style, promptOptions);
    }
    await persistThemeResult(userId, output);
  } else if (tool === "set_resume_model") {
    if (style === "custom") {
      const aiReservation = await reserveAiModel(userId, { task: "chat" });
      output = await setResumeModel(
        context,
        aiReservation.model,
        style,
        promptOptions,
        aiReservation.clientConfig,
        aiReservation.maxTokens
      );
    } else {
      output = await setResumeModel(context, "", style, promptOptions);
    }
    await persistResumeModelResult(userId, output);
  } else if (tool === "regenerate_profile") {
    const visibleEvidence = evidenceItems.filter((item) => item.visible);
    const aiReservation = await reserveAiModel(userId, { task: "profile" });

    let profileData;
    if (visibleEvidence.length > 0) {
      profileData = await generateProfileFromCrawl(
        visibleEvidence.map(buildCrawlResultFromEvidence),
        {
          name: userName ?? undefined,
          githubUrl: userProfile?.github ?? undefined,
          linkedinUrl: userProfile?.linkedin ?? undefined,
        },
        aiReservation.model,
        aiReservation.clientConfig,
        aiReservation.maxTokens
      );
    } else if (userProfile?.bio) {
      profileData = await generateProfileFromText(
        userProfile.bio,
        { name: userName ?? undefined },
        aiReservation.model,
        aiReservation.clientConfig,
        aiReservation.maxTokens
      );
    } else {
      throw new Error(
        "Add visible evidence or a profile bio before regenerating the profile."
      );
    }

    await prisma.generatedProfile.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    await prisma.generatedProfile.create({
      data: {
        userId,
        data: profileData as Prisma.InputJsonValue,
        isActive: true,
      },
    });

    output = {
      summary:
        visibleEvidence.length > 0
          ? `Rebuilt the active profile from ${visibleEvidence.length} visible evidence source${visibleEvidence.length === 1 ? "" : "s"}.`
          : "Rebuilt the active profile from the saved bio because no visible evidence was available.",
      headline: profileData.headline,
      about: profileData.about,
      resumeSummary: profileData.resume.summary,
      stats: profileData.stats,
      confidence: profileData.confidence,
      refreshedFromEvidenceCount: visibleEvidence.length,
      profile: profileData,
    };
  } else if (tool === "recrawl_url") {
    const focusedEvidence =
      focus?.kind === "evidence" && focus.evidenceId
        ? evidenceItems.find((item) => item.id === focus.evidenceId)
        : null;
    const requestedUrl =
      extractUrlFromMessage(message) ??
      focusedEvidence?.url ??
      evidenceItems.find((item) => item.url)?.url;

    const comparableRequestedUrl = normalizeComparableUrl(requestedUrl);
    if (!requestedUrl || !comparableRequestedUrl) {
      throw new AgentClarificationError(
        "I can refresh a source for you, but I need to know which URL you want me to re-crawl.",
        [
          {
            id: "recrawl_url",
            label: "Source URL",
            question: "Which URL should I refresh?",
            helpText:
              "Paste one web page, repo, or portfolio link and I’ll re-crawl that source.",
            options: [],
          },
        ]
      );
    }

    const crawlResult = await crawlUrl(requestedUrl);
    const existingEvidence =
      focusedEvidence ??
      evidenceItems.find(
        (item) =>
          normalizeComparableUrl(item.url) === normalizeComparableUrl(crawlResult.url)
      ) ??
      null;

    const persistedEvidence = existingEvidence
      ? await prisma.evidenceItem.update({
          where: { id: existingEvidence.id },
          data: {
            type: existingEvidence.type || "url",
            url: crawlResult.url,
            title: crawlResult.title,
            description: crawlResult.description,
            screenshot: crawlResult.screenshot,
            rawContent: crawlResult.bodyText,
            metadata: crawlResult.metadata as Prisma.InputJsonValue,
          },
        })
      : await prisma.evidenceItem.create({
          data: {
            userId,
            type: "url",
            url: crawlResult.url,
            title: crawlResult.title,
            description: crawlResult.description,
            screenshot: crawlResult.screenshot,
            rawContent: crawlResult.bodyText,
            metadata: crawlResult.metadata as Prisma.InputJsonValue,
            visible: true,
          },
        });

    output = {
      summary: existingEvidence
        ? `Refreshed ${crawlResult.title || crawlResult.url} and replaced the stale evidence entry.`
        : `Crawled ${crawlResult.title || crawlResult.url} and added it as a new evidence source.`,
      title: crawlResult.title,
      url: crawlResult.url,
      description: crawlResult.description,
      headings: crawlResult.headings.slice(0, 6),
      bodyPreview: crawlResult.bodyText.slice(0, 320),
      screenshot: crawlResult.screenshot,
      usedExistingItem: Boolean(existingEvidence),
      screenshotCaptured: Boolean(crawlResult.screenshot),
      itemId: persistedEvidence.id,
    };
  }

  return {
    output,
    style,
    reply: getToolReply(tool, style, args.focusLabel),
    artifactId,
  };
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as unknown;
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const {
    message,
    history,
    tool,
    style,
    focus,
    personaSkillId,
    workflowSkillId,
  } = parsed.data;

  // Load user context
  const [profile, evidenceItems, settings, currentBilling, userProfile, userRecord] = await Promise.all([
    prisma.generatedProfile.findFirst({
      where: { userId: session.user.id, isActive: true },
      orderBy: { createdAt: "desc" },
      select: { data: true },
    }),
    prisma.evidenceItem.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        url: true,
        rawContent: true,
        screenshot: true,
        metadata: true,
        visible: true,
      },
    }),
    prisma.publicPageSettings.findUnique({
      where: { userId: session.user.id },
      select: {
        visibility: true,
        mode: true,
        customDomain: true,
        theme: true,
        themeConfig: true,
        resumeModel: true,
        resumeModelConfig: true,
      },
    }),
    getBillingSnapshot(session.user.id),
    prisma.userProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        bio: true,
        github: true,
        linkedin: true,
        youtube: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        username: true,
        agentPreferences: true,
      },
    }),
  ]);

  const agentPreferences = parseAgentPreferences(userRecord?.agentPreferences);
  const parsedProfile = profile?.data
    ? ProfileJSONSchema.safeParse(profile.data)
    : null;
  const profileData = parsedProfile?.success ? parsedProfile.data : null;
  const themeContext = {
    themeId: settings?.theme,
    themeConfig: parsePortfolioThemeConfig(settings?.themeConfig),
    resumeModelId: settings?.resumeModel,
    resumeModelConfig: parseResumeModelConfig(settings?.resumeModelConfig),
  };
  const configuredProviders = Object.values(AI_PROVIDER_DEFINITIONS)
    .filter((provider) => provider.available)
    .map((provider) => provider.label);
  const runtimeContext = buildAgentRuntimeContext({
    displayName: userRecord?.name ?? session.user.name,
    username: userRecord?.username ?? session.user.username,
    mode: settings?.mode,
    visibility: settings?.visibility,
    customDomain: settings?.customDomain,
    evidenceCount: evidenceItems.length,
    hasProfile: Boolean(profileData),
    planLabel: currentBilling.plan.label,
    providerLabel: currentBilling.provider.label,
    providerId: currentBilling.aiProvider,
    activeModel: currentBilling.fallbackToStandard
      ? currentBilling.standardModel
      : currentBilling.advancedModel,
    fallbackModel: currentBilling.standardModel,
    fallbackActive: currentBilling.fallbackToStandard,
    aiUsageRateLabel:
      currentBilling.aiUsageRate === "auto"
        ? "Auto (1x)"
        : currentBilling.aiUsageRate,
    configuredProviders,
  });
  const context = [
    buildAgentProductContext(),
    runtimeContext,
    buildAgentPreferenceContext(agentPreferences),
    buildAgentContext(profileData, evidenceItems, themeContext),
  ]
    .filter(Boolean)
    .join("\n\n");
  const resolvedFocus = resolveAgentFocus(profileData, evidenceItems, focus, themeContext);
  const currentSettings = getCurrentPublicPageState(settings);
  const preferredPersonaSkillId = personaSkillId ?? agentPreferences.pinnedPersonaSkillId;
  const preferredWorkflowSkillId = workflowSkillId ?? agentPreferences.pinnedWorkflowSkillId;

  if (focus && !resolvedFocus) {
    return NextResponse.json(
      { error: "Invalid focus target." },
      { status: 400 }
    );
  }

  const storedInput = [
    resolvedFocus ? `Focus: ${resolvedFocus.label}` : null,
    message,
  ]
    .filter((part): part is string => Boolean(part))
    .join("\n")
    .slice(0, MAX_STORED_INPUT_LENGTH);

  const promptOptions = {
    focusLabel: resolvedFocus?.label,
    focusContext: resolvedFocus?.context,
    userRequest: message,
  };

  try {
    const strategy: AgentTurnStrategy = tool
      ? {
          intent: `Run ${tool.replace(/_/g, " ")}`,
          mode: "artifact",
          personaSkillId:
            preferredPersonaSkillId ??
            getDefaultPersonaSkillForContext({
              workflowSkillId:
                preferredWorkflowSkillId ??
                getWorkflowSkillForTool(tool)?.id ??
                null,
              focusKind: focus?.kind ?? null,
            })?.id,
          workflowSkillId:
            preferredWorkflowSkillId ?? getWorkflowSkillForTool(tool)?.id,
          tool,
          style: normalizeAgentToolStyle(tool, style),
          reply: getToolReply(
            tool,
            normalizeAgentToolStyle(tool, style),
            resolvedFocus?.label
          ),
          rationale: "The user explicitly selected this tool in the dashboard.",
          nextSteps: [],
          missingContext: [],
        }
      : await (async () => {
          const chatReservation = await reserveAiModel(session.user.id, {
            task: "chat",
          });
          return planAgentTurn(
            message,
            context,
            history,
            chatReservation.model,
            {
              focusLabel: resolvedFocus?.label,
              focusContext: resolvedFocus?.context,
              forcedPersonaSkillId: preferredPersonaSkillId ?? undefined,
              forcedWorkflowSkillId: preferredWorkflowSkillId ?? undefined,
            },
            chatReservation.clientConfig,
            chatReservation.maxTokens
          );
        })();

    const resolvedWorkflowSkill =
      getWorkflowSkill(strategy.workflowSkillId) ??
      getWorkflowSkill(preferredWorkflowSkillId) ??
      getWorkflowSkillForTool(strategy.tool) ??
      null;
    const resolvedPersonaSkill =
      getPersonaSkill(strategy.personaSkillId) ??
      getPersonaSkill(preferredPersonaSkillId) ??
      getDefaultPersonaSkillForContext({
        workflowSkillId: resolvedWorkflowSkill?.id ?? null,
        focusKind: focus?.kind ?? null,
      });

    if (strategy.mode === "clarify") {
      const billing = await getBillingSnapshot(session.user.id);
      return buildClarificationResponse({
        reply:
          strategy.reply ||
          "I need one quick clarification before I make the right change.",
        questions: strategy.clarificationQuestions ?? [],
        focusLabel: resolvedFocus?.label,
        strategy,
        resolvedPersonaSkill,
        resolvedWorkflowSkill,
        billing,
      });
    }

    if (strategy.mode === "artifact" && strategy.tool) {
      const executed = await executeAgentTool({
        userId: session.user.id,
        userName: userRecord?.name ?? session.user.name,
        tool: strategy.tool,
        style: strategy.style,
        context,
        message,
        focusLabel: resolvedFocus?.label,
        focus,
        evidenceItems,
        userProfile,
        currentProfile: profileData,
        mode: settings?.mode === "admissions" ? "admissions" : "hiring",
        strategy,
        resolvedPersonaSkillId: resolvedPersonaSkill?.id,
        resolvedWorkflowSkillId: resolvedWorkflowSkill?.id,
        promptOptions,
      });

      const artifact =
        executed.artifactId
          ? { id: executed.artifactId }
          : await prisma.agentArtifact.create({
              data: {
                userId: session.user.id,
                tool: strategy.tool,
                style: executed.style || null,
                input: storedInput,
                output: executed.output as Prisma.InputJsonValue,
                meta: buildArtifactMeta({
                  executionMode: "artifact",
                  strategy: {
                    ...strategy,
                    personaSkillId: resolvedPersonaSkill?.id,
                    workflowSkillId: resolvedWorkflowSkill?.id,
                  },
                  resolvedPersonaSkillId: resolvedPersonaSkill?.id,
                  resolvedWorkflowSkillId: resolvedWorkflowSkill?.id,
                  revertable: false,
                }) as Prisma.InputJsonValue,
              },
            });

      const billing = await getBillingSnapshot(session.user.id);

      return NextResponse.json({
        type: "tool_result",
        reply: strategy.reply || executed.reply,
        tool: strategy.tool,
        style: executed.style,
        output: executed.output,
        artifactId: artifact.id,
        focusLabel: resolvedFocus?.label,
        executionMode: "artifact",
        clarificationQuestions: [],
        resolvedPersonaSkill: toSkillSummary(resolvedPersonaSkill),
        resolvedWorkflowSkill: toSkillSummary(resolvedWorkflowSkill),
        mutationSummary: null,
        revertable: false,
        strategy: {
          ...strategy,
          mode: "artifact",
          personaSkillId: resolvedPersonaSkill?.id,
          workflowSkillId: resolvedWorkflowSkill?.id,
          style: executed.style || undefined,
        },
        billing,
      });
    }

    if (strategy.mode === "mutate") {
      if (!resolvedWorkflowSkill) {
        return NextResponse.json(
          { error: "The agent could not resolve a workflow for this live edit." },
          { status: 400 }
        );
      }

      const mutationReservation = await reserveAiModel(session.user.id, {
        task: "profile",
      });
      const mutationPlan = await generateAgentMutationPlan({
        message,
        context,
        model: mutationReservation.model,
        personaSkillId: resolvedPersonaSkill?.id,
        workflowSkillId: resolvedWorkflowSkill.id,
        focusLabel: resolvedFocus?.label,
        focusContext: resolvedFocus?.context,
        clientConfig: mutationReservation.clientConfig,
        maxTokens: mutationReservation.maxTokens,
      });
      const appliedMutation = await applyAgentPortfolioPatch({
        userId: session.user.id,
        currentProfile: profileData,
        currentSettings,
        patch: mutationPlan.patch,
        workflowSkillId: resolvedWorkflowSkill.id,
      });
      const mutationSummary = createMutationSummary({
        ...mutationPlan.mutationSummary,
        changedFields:
          appliedMutation.changedFields.length > 0
            ? appliedMutation.changedFields
            : mutationPlan.mutationSummary.changedFields,
      });

      const artifact = await prisma.agentArtifact.create({
        data: {
          userId: session.user.id,
          tool: "mutate_portfolio",
          style: null,
          input: storedInput,
          output: mutationSummary as Prisma.InputJsonValue,
          meta: buildArtifactMeta({
            executionMode: "mutate",
            strategy: {
              ...strategy,
              personaSkillId: resolvedPersonaSkill?.id,
              workflowSkillId: resolvedWorkflowSkill.id,
            },
            resolvedPersonaSkillId: resolvedPersonaSkill?.id,
            resolvedWorkflowSkillId: resolvedWorkflowSkill.id,
            mutationSummary,
            beforeSnapshot: appliedMutation.beforeSnapshot,
            afterSnapshot: appliedMutation.afterSnapshot,
            revertPatch: appliedMutation.revertPatch,
            revertable: true,
          }) as Prisma.InputJsonValue,
        },
      });

      const billing = await getBillingSnapshot(session.user.id);

      return NextResponse.json({
        type: "mutation_result",
        reply: mutationPlan.reply || strategy.reply,
        tool: "mutate_portfolio",
        output: mutationSummary,
        artifactId: artifact.id,
        focusLabel: resolvedFocus?.label,
        executionMode: "mutate",
        clarificationQuestions: [],
        resolvedPersonaSkill: toSkillSummary(resolvedPersonaSkill),
        resolvedWorkflowSkill: toSkillSummary(resolvedWorkflowSkill),
        mutationSummary,
        revertable: true,
        profile: appliedMutation.profile,
        settings: appliedMutation.settings,
        strategy: {
          ...strategy,
          mode: "mutate",
          personaSkillId: resolvedPersonaSkill?.id,
          workflowSkillId: resolvedWorkflowSkill.id,
        },
        billing,
      });
    }

    const billing = await getBillingSnapshot(session.user.id);

    return NextResponse.json({
      type: "chat",
      reply: strategy.reply,
      focusLabel: resolvedFocus?.label,
      executionMode: "reply",
      clarificationQuestions: [],
      resolvedPersonaSkill: toSkillSummary(resolvedPersonaSkill),
      resolvedWorkflowSkill: toSkillSummary(resolvedWorkflowSkill),
      mutationSummary: null,
      revertable: false,
      strategy: {
        ...strategy,
        mode: "reply",
        personaSkillId: resolvedPersonaSkill?.id,
        workflowSkillId: resolvedWorkflowSkill?.id,
      },
      billing,
    });
  } catch (err) {
    if (err instanceof AgentClarificationError) {
      const billing = await getBillingSnapshot(session.user.id);
      const fallbackStrategy: AgentTurnStrategy = {
        intent: "Clarify the request",
        mode: "clarify",
        reply: err.reply,
        rationale:
          "The requested action is blocked until the user provides one missing detail.",
        nextSteps: [],
        missingContext: err.questions.map((question) => question.question),
        clarificationQuestions: err.questions,
      };

      return buildClarificationResponse({
        reply: err.reply,
        questions: err.questions,
        strategy: fallbackStrategy,
        resolvedPersonaSkill: null,
        resolvedWorkflowSkill: null,
        billing,
      });
    }

    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// List saved artifacts
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const artifacts = await prisma.agentArtifact.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      tool: true,
      style: true,
      createdAt: true,
      output: true,
      meta: true,
    },
  });

  const normalizedArtifacts = artifacts.map((artifact) => ({
    ...artifact,
    meta: parseAgentArtifactMeta(artifact.meta),
  }));

  const recentRuns = normalizedArtifacts.map((artifact) => {
    const meta = artifact.meta;
    return {
      id: artifact.id,
      tool: artifact.tool,
      createdAt: artifact.createdAt,
      executionMode: meta?.executionMode ?? "artifact",
      resolvedPersonaSkill: toSkillSummary(
        getPersonaSkill(meta?.resolvedPersonaSkillId)
      ),
      resolvedWorkflowSkill: toSkillSummary(
        getWorkflowSkill(meta?.resolvedWorkflowSkillId)
      ),
      mutationSummary: meta?.mutationSummary ?? null,
      revertable:
        Boolean(meta?.revertable) && !meta?.revertedAt && Boolean(meta?.revertPatch),
      revertedAt: meta?.revertedAt ?? null,
    };
  });

  return NextResponse.json({ artifacts: normalizedArtifacts, recentRuns });
}
