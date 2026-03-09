import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  AchievementSchema,
  ExperienceSchema,
  ProfileJSONSchema,
  ProjectSchema,
  SkillSchema,
  type ProfileJSON,
} from "@/lib/schema";
import {
  PortfolioThemeConfigSchema,
  PortfolioThemeIdSchema,
  normalizePortfolioThemeId,
  parsePortfolioThemeConfig,
  type PortfolioThemeConfig,
  type PortfolioThemeId,
} from "@/lib/portfolio-themes";
import {
  ResumeModelConfigSchema,
  ResumeModelIdSchema,
  normalizeResumeModelId,
  parseResumeModelConfig,
  type ResumeModelConfig,
  type ResumeModelId,
} from "@/lib/resume-models";
import { type ProjectVideoState } from "@/lib/project-video-types";
import {
  getWorkflowSkill,
  type AgentMutationTarget,
  type WorkflowSkillDefinition,
} from "@/lib/agent-skills";
import type { PublicPageVisibility } from "@/lib/page-visibility";

export const AgentResumePatchSchema = z
  .object({
    summary: z.string().trim().min(1).max(1200).optional(),
    bullets: z.array(z.string().trim().min(1).max(240)).max(12).optional(),
  })
  .strict();

export const AgentProfilePatchSchema = z
  .object({
    headline: z.string().trim().min(1).max(180).optional(),
    about: z.string().trim().min(1).max(4000).optional(),
    skills: z.array(SkillSchema).max(24).optional(),
    projects: z.array(ProjectSchema).max(12).optional(),
    experiences: z.array(ExperienceSchema).max(12).optional(),
    achievements: z.array(AchievementSchema).max(12).optional(),
    resume: AgentResumePatchSchema.optional(),
  })
  .strict();

export const AgentPublicPagePatchSchema = z
  .object({
    mode: z.enum(["hiring", "admissions"]).optional(),
    visibility: z.enum(["public", "unlisted", "private"]).optional(),
    theme: PortfolioThemeIdSchema.optional(),
    themeConfig: PortfolioThemeConfigSchema.nullable().optional(),
    resumeModel: ResumeModelIdSchema.optional(),
    resumeModelConfig: ResumeModelConfigSchema.nullable().optional(),
  })
  .strict();

export const AgentPortfolioPatchSchema = z
  .object({
    profile: AgentProfilePatchSchema.optional(),
    publicPageSettings: AgentPublicPagePatchSchema.optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const hasProfile =
      value.profile &&
      Object.keys(value.profile).some((key) => {
        const nested = value.profile?.[key as keyof typeof value.profile];
        return nested !== undefined;
      });
    const hasSettings =
      value.publicPageSettings &&
      Object.keys(value.publicPageSettings).some((key) => {
        const nested =
          value.publicPageSettings?.[
            key as keyof typeof value.publicPageSettings
          ];
        return nested !== undefined;
      });

    if (!hasProfile && !hasSettings) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one mutation target is required.",
      });
    }
  });

export const AgentMutationSummarySchema = z.object({
  title: z.string().trim().min(1).max(120),
  summary: z.string().trim().min(1).max(500),
  changes: z.array(z.string().trim().min(1).max(220)).max(8).default([]),
  changedFields: z.array(z.string().trim().min(1).max(120)).max(12).default([]),
});

export type AgentPortfolioPatch = z.infer<typeof AgentPortfolioPatchSchema>;
export type AgentMutationSummary = z.infer<typeof AgentMutationSummarySchema>;

export interface AgentPublicPageState {
  visibility: PublicPageVisibility;
  mode: "hiring" | "admissions";
  theme: PortfolioThemeId;
  themeConfig: PortfolioThemeConfig | null;
  resumeModel: ResumeModelId;
  resumeModelConfig: ResumeModelConfig | null;
}

export interface AgentMutationApplicationResult {
  profile: ProfileJSON | null;
  settings: AgentPublicPageState;
  beforeSnapshot: AgentPortfolioPatch;
  afterSnapshot: AgentPortfolioPatch;
  revertPatch: AgentPortfolioPatch;
  changedFields: string[];
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function clonePatchShape(
  source: AgentPortfolioPatch,
  state: Record<string, unknown> | null | undefined
): AgentPortfolioPatch {
  const output: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(source)) {
    if (value === undefined) continue;
    const currentValue = state ? state[key] : undefined;
    if (isPlainObject(value)) {
      output[key] = clonePatchShape(
        value as AgentPortfolioPatch,
        isPlainObject(currentValue) ? currentValue : undefined
      );
      continue;
    }
    output[key] = currentValue ?? null;
  }

  return output as AgentPortfolioPatch;
}

function collectLeafPaths(
  input: Record<string, unknown>,
  prefix = ""
): string[] {
  const paths: string[] = [];

  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    const path = prefix ? `${prefix}.${key}` : key;
    if (isPlainObject(value) && Object.keys(value).length > 0) {
      paths.push(...collectLeafPaths(value, path));
      continue;
    }
    paths.push(path);
  }

  return paths;
}

export function getMutationTargetPaths(patch: AgentPortfolioPatch) {
  return collectLeafPaths(patch as unknown as Record<string, unknown>) as AgentMutationTarget[];
}

function isAllowedTarget(
  path: string,
  allowedTargets: AgentMutationTarget[]
) {
  return allowedTargets.some(
    (target) => path === target || path.startsWith(`${target}.`)
  );
}

export function validateMutationTargets(
  patch: AgentPortfolioPatch,
  workflowSkill: WorkflowSkillDefinition
) {
  const touchedTargets = getMutationTargetPaths(patch);
  const disallowed = touchedTargets.filter(
    (path) => !isAllowedTarget(path, workflowSkill.allowedMutationTargets)
  );

  if (disallowed.length) {
    throw new Error(
      `The agent attempted to change out-of-scope fields: ${disallowed.join(", ")}.`
    );
  }

  return touchedTargets;
}

export function normalizeAgentPatch(
  patch: AgentPortfolioPatch,
  currentSettings: AgentPublicPageState
) {
  const normalized: AgentPortfolioPatch = JSON.parse(JSON.stringify(patch));
  const settings = normalized.publicPageSettings;

  if (settings) {
    if (settings.themeConfig !== undefined) {
      if (settings.themeConfig === null) {
        settings.theme = settings.theme ?? currentSettings.theme;
      } else {
        const finalTheme = settings.theme ?? currentSettings.theme;
        if (finalTheme !== "custom") {
          settings.themeConfig = null;
          settings.theme = finalTheme;
        } else {
          settings.theme = "custom";
        }
      }
    }

    if (settings.resumeModelConfig !== undefined) {
      if (settings.resumeModelConfig === null) {
        settings.resumeModel = settings.resumeModel ?? currentSettings.resumeModel;
      } else {
        const finalResumeModel =
          settings.resumeModel ?? currentSettings.resumeModel;
        if (finalResumeModel !== "custom") {
          settings.resumeModelConfig = null;
          settings.resumeModel = finalResumeModel;
        } else {
          settings.resumeModel = "custom";
        }
      }
    }
  }

  return AgentPortfolioPatchSchema.parse(normalized);
}

export function getCurrentPublicPageState(input?: {
  visibility?: string | null;
  mode?: string | null;
  theme?: string | null;
  themeConfig?: unknown;
  resumeModel?: string | null;
  resumeModelConfig?: unknown;
} | null): AgentPublicPageState {
  return {
    visibility:
      input?.visibility === "public" ||
      input?.visibility === "unlisted" ||
      input?.visibility === "private"
        ? input.visibility
        : "public",
    mode: input?.mode === "admissions" ? "admissions" : "hiring",
    theme: normalizePortfolioThemeId(input?.theme),
    themeConfig: parsePortfolioThemeConfig(input?.themeConfig),
    resumeModel: normalizeResumeModelId(input?.resumeModel),
    resumeModelConfig: parseResumeModelConfig(input?.resumeModelConfig),
  };
}

function mergeProfile(
  currentProfile: ProfileJSON,
  patch?: AgentPortfolioPatch["profile"]
) {
  if (!patch) return currentProfile;

  return ProfileJSONSchema.parse({
    ...currentProfile,
    ...(patch.headline !== undefined ? { headline: patch.headline } : {}),
    ...(patch.about !== undefined ? { about: patch.about } : {}),
    ...(patch.skills !== undefined ? { skills: patch.skills } : {}),
    ...(patch.projects !== undefined ? { projects: patch.projects } : {}),
    ...(patch.experiences !== undefined ? { experiences: patch.experiences } : {}),
    ...(patch.achievements !== undefined ? { achievements: patch.achievements } : {}),
    resume: {
      ...currentProfile.resume,
      ...(patch.resume?.summary !== undefined
        ? { summary: patch.resume.summary }
        : {}),
      ...(patch.resume?.bullets !== undefined
        ? { bullets: patch.resume.bullets }
        : {}),
    },
  });
}

function mergeSettings(
  currentSettings: AgentPublicPageState,
  patch?: AgentPortfolioPatch["publicPageSettings"]
): AgentPublicPageState {
  if (!patch) return currentSettings;

  return {
    visibility: patch.visibility ?? currentSettings.visibility,
    mode: patch.mode ?? currentSettings.mode,
    theme: normalizePortfolioThemeId(patch.theme ?? currentSettings.theme),
    themeConfig:
      patch.themeConfig === undefined
        ? currentSettings.themeConfig
        : patch.themeConfig === null
          ? null
          : parsePortfolioThemeConfig(patch.themeConfig),
    resumeModel: normalizeResumeModelId(
      patch.resumeModel ?? currentSettings.resumeModel
    ),
    resumeModelConfig:
      patch.resumeModelConfig === undefined
        ? currentSettings.resumeModelConfig
        : patch.resumeModelConfig === null
          ? null
          : parseResumeModelConfig(patch.resumeModelConfig),
  };
}

function createCurrentStateSnapshot(
  profile: ProfileJSON | null,
  settings: AgentPublicPageState
) {
  return {
    profile,
    publicPageSettings: settings,
  } satisfies Record<string, unknown>;
}

function buildRevertPatch(beforeSnapshot: AgentPortfolioPatch) {
  return AgentPortfolioPatchSchema.parse(beforeSnapshot);
}

export async function applyAgentPortfolioPatch(args: {
  userId: string;
  currentProfile: ProfileJSON | null;
  currentSettings: AgentPublicPageState;
  patch: AgentPortfolioPatch;
  workflowSkillId: string;
}) {
  const workflowSkill = getWorkflowSkill(args.workflowSkillId);
  if (!workflowSkill) {
    throw new Error("Unknown workflow skill.");
  }

  const normalizedPatch = normalizeAgentPatch(args.patch, args.currentSettings);
  const changedFields = validateMutationTargets(normalizedPatch, workflowSkill);
  const beforeSnapshot = clonePatchShape(
    normalizedPatch,
    createCurrentStateSnapshot(args.currentProfile, args.currentSettings)
  );

  const nextProfile = normalizedPatch.profile
    ? args.currentProfile
      ? mergeProfile(args.currentProfile, normalizedPatch.profile)
      : (() => {
          throw new Error(
            "Generate a profile first before asking the agent to edit profile content."
          );
        })()
    : args.currentProfile;
  const nextSettings = mergeSettings(args.currentSettings, normalizedPatch.publicPageSettings);
  const afterSnapshot = clonePatchShape(
    normalizedPatch,
    createCurrentStateSnapshot(nextProfile, nextSettings)
  );
  const revertPatch = buildRevertPatch(beforeSnapshot);

  await prisma.$transaction(async (tx) => {
    if (normalizedPatch.profile) {
      await tx.generatedProfile.updateMany({
        where: { userId: args.userId, isActive: true },
        data: { isActive: false },
      });

      await tx.generatedProfile.create({
        data: {
          userId: args.userId,
          data: nextProfile as Prisma.InputJsonValue,
          isActive: true,
        },
      });
    }

    if (normalizedPatch.publicPageSettings) {
      await tx.publicPageSettings.upsert({
        where: { userId: args.userId },
        create: {
          userId: args.userId,
          visibility: nextSettings.visibility,
          isPublic: nextSettings.visibility === "public",
          mode: nextSettings.mode,
          theme: nextSettings.theme,
          themeConfig: nextSettings.themeConfig
            ? (nextSettings.themeConfig as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          resumeModel: nextSettings.resumeModel,
          resumeModelConfig: nextSettings.resumeModelConfig
            ? (nextSettings.resumeModelConfig as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        },
        update: {
          visibility: nextSettings.visibility,
          isPublic: nextSettings.visibility === "public",
          mode: nextSettings.mode,
          theme: nextSettings.theme,
          themeConfig: nextSettings.themeConfig
            ? (nextSettings.themeConfig as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          resumeModel: nextSettings.resumeModel,
          resumeModelConfig: nextSettings.resumeModelConfig
            ? (nextSettings.resumeModelConfig as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        },
      });
    }
  });

  return {
    profile: nextProfile,
    settings: nextSettings,
    beforeSnapshot,
    afterSnapshot,
    revertPatch,
    changedFields,
  } satisfies AgentMutationApplicationResult;
}

export function createMutationSummary(input: {
  title: string;
  summary: string;
  changes: string[];
  changedFields: string[];
}) {
  return AgentMutationSummarySchema.parse(input);
}

export function buildArtifactMeta(input: {
  executionMode: "artifact" | "mutate";
  strategy: Record<string, unknown>;
  resolvedPersonaSkillId?: string | null;
  resolvedWorkflowSkillId?: string | null;
  projectVideo?: ProjectVideoState | null;
  mutationSummary?: AgentMutationSummary | null;
  beforeSnapshot?: AgentPortfolioPatch | null;
  afterSnapshot?: AgentPortfolioPatch | null;
  revertPatch?: AgentPortfolioPatch | null;
  revertable?: boolean;
  revertedAt?: string | null;
  revertedByArtifactId?: string | null;
}) {
  return {
    executionMode: input.executionMode,
    strategy: input.strategy,
    resolvedPersonaSkillId: input.resolvedPersonaSkillId ?? null,
    resolvedWorkflowSkillId: input.resolvedWorkflowSkillId ?? null,
    projectVideo: input.projectVideo ?? null,
    mutationSummary: input.mutationSummary ?? null,
    beforeSnapshot: input.beforeSnapshot ?? null,
    afterSnapshot: input.afterSnapshot ?? null,
    revertPatch: input.revertPatch ?? null,
    revertable: input.revertable ?? false,
    revertedAt: input.revertedAt ?? null,
    revertedByArtifactId: input.revertedByArtifactId ?? null,
  };
}
