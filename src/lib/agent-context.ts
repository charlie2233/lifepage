import type { ProfileJSON } from "@/lib/schema";
import type { AgentFocusSelection } from "@/lib/agent-focus";
import type { PortfolioThemeConfig, PortfolioThemeId } from "@/lib/portfolio-themes";
import {
  describePortfolioThemesForAgent,
  resolvePortfolioTheme,
} from "@/lib/portfolio-themes";
import type { ResumeModelConfig, ResumeModelId } from "@/lib/resume-models";
import {
  describeResumeModelsForAgent,
  resolveResumeModel,
} from "@/lib/resume-models";
import type { AiProvider } from "@/lib/billing";
import type { AgentPreferences } from "@/lib/agent-preferences";
import {
  getPersonaSkill,
  getWorkflowSkill,
} from "@/lib/agent-skills";

export interface AgentEvidenceContextItem {
  id: string;
  type: string;
  title: string | null;
  description: string | null;
  url: string | null;
  rawContent: string | null;
}

export interface ResolvedAgentFocus {
  label: string;
  context: string;
}

export interface AgentRuntimeContextInput {
  displayName?: string | null;
  username?: string | null;
  mode?: string | null;
  visibility?: string | null;
  customDomain?: string | null;
  evidenceCount: number;
  hasProfile: boolean;
  planLabel?: string | null;
  providerLabel?: string | null;
  providerId?: AiProvider | null;
  activeModel?: string | null;
  fallbackModel?: string | null;
  fallbackActive?: boolean;
  aiUsageRateLabel?: string | null;
  configuredProviders?: string[];
}

function collapseText(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function truncateText(value: string | null | undefined, max = 320) {
  const collapsed = collapseText(value);
  if (!collapsed) return "";
  return collapsed.length > max
    ? `${collapsed.slice(0, max).trimEnd()}…`
    : collapsed;
}

function joinNonEmpty(parts: Array<string | null | undefined>) {
  return parts.filter((part): part is string => Boolean(part && part.trim())).join("\n");
}

export function buildAgentProductContext() {
  return joinNonEmpty([
    "LIFEPAGE PRODUCT BRIEF",
    "Mission: help users build their personal brand and deploy it as a public portfolio site.",
    "Core audiences: personal brand builders, students applying to college, job applicants, and people documenting their life story.",
    "Existing product capabilities:",
    "- Crawl one or multiple URLs from the web to collect evidence.",
    "- Generate a public portfolio profile from evidence and user context.",
    "- Publish a public portfolio page plus a separate public resume page.",
    "- Apply portfolio themes and resume models.",
    "- Support public, unlisted, and private visibility.",
    "- Support custom domain publishing.",
    "- Export resume PDF.",
    "- Export HTML for Google Sites manual use.",
    "Important constraints:",
    "- Do not claim there is one-click publish to modern Google Sites.",
    "- Do not claim an integration exists unless it is explicitly described in the runtime context.",
    "- You can directly edit allowed portfolio content and presentation fields inside the app.",
    "- Allowed direct edits: profile copy, profile structure, resume summary/bullets, mode, visibility, theme, and resume model.",
    "- Not allowed: billing changes, auth/account credentials, evidence deletion, or custom-domain writes.",
  ]);
}

export function buildAgentRuntimeContext(input: AgentRuntimeContextInput) {
  return joinNonEmpty([
    "CURRENT APP + ACCOUNT STATE",
    input.displayName ? `User: ${input.displayName}` : null,
    input.username ? `Username: ${input.username}` : null,
    input.mode ? `Portfolio mode: ${input.mode}` : null,
    input.visibility ? `Visibility: ${input.visibility}` : null,
    input.customDomain ? `Custom domain: ${input.customDomain}` : "Custom domain: not set",
    `Evidence count: ${input.evidenceCount}`,
    `Generated profile: ${input.hasProfile ? "available" : "not generated yet"}`,
    input.planLabel ? `Plan: ${input.planLabel}` : null,
    input.providerLabel || input.activeModel
      ? `Active AI route: ${[input.providerLabel, input.activeModel]
          .filter(Boolean)
          .join(" · ")}`
      : null,
    input.providerId ? `Provider selection: ${input.providerId}` : null,
    input.aiUsageRateLabel ? `AI intensity: ${input.aiUsageRateLabel}` : null,
    input.fallbackModel ? `Fallback model: ${input.fallbackModel}` : null,
    input.fallbackActive
      ? "Fallback status: currently using the fallback model."
      : "Fallback status: advanced model currently active.",
    input.configuredProviders?.length
      ? `Configured providers in this runtime: ${input.configuredProviders.join(", ")}`
      : "Configured providers in this runtime: none",
  ]);
}

export function buildAgentPreferenceContext(preferences: AgentPreferences) {
  const personaSkill = getPersonaSkill(preferences.pinnedPersonaSkillId);
  const workflowSkill = getWorkflowSkill(preferences.pinnedWorkflowSkillId);

  return joinNonEmpty([
    "AGENT PREFERENCES",
    personaSkill
      ? `Pinned expert mode: ${personaSkill.label} (${personaSkill.id})`
      : "Pinned expert mode: auto",
    workflowSkill
      ? `Pinned workflow: ${workflowSkill.label} (${workflowSkill.id})`
      : "Pinned workflow: auto",
    preferences.brandVoiceInstruction
      ? `Brand / voice instruction: ${preferences.brandVoiceInstruction}`
      : "Brand / voice instruction: none",
  ]);
}

function formatProject(
  project: ProfileJSON["projects"][number],
  index: number
) {
  return joinNonEmpty([
    `${index + 1}. ${project.title}`,
    project.problem ? `Problem: ${project.problem}` : null,
    project.approach ? `Approach: ${project.approach}` : null,
    project.impact ? `Impact: ${project.impact}` : null,
    project.tech.length ? `Tech: ${project.tech.join(", ")}` : null,
  ]);
}

function formatExperience(
  experience: ProfileJSON["experiences"][number],
  index: number
) {
  return joinNonEmpty([
    `${index + 1}. ${experience.role} @ ${experience.org}`,
    `Dates: ${experience.startDate ?? "Unknown"} → ${experience.endDate ?? "Present"}`,
    experience.bullets.length
      ? `Highlights: ${experience.bullets.slice(0, 3).join(" | ")}`
      : null,
  ]);
}

function formatAchievement(
  achievement: ProfileJSON["achievements"][number],
  index: number
) {
  return joinNonEmpty([
    `${index + 1}. ${achievement.title}`,
    achievement.context ? `Context: ${achievement.context}` : null,
    achievement.date ? `Date: ${achievement.date}` : null,
    achievement.proof ? `Proof: ${achievement.proof}` : null,
  ]);
}

function formatEvidence(
  evidence: AgentEvidenceContextItem,
  index: number,
  excerptLength = 260
) {
  return joinNonEmpty([
    `${index + 1}. ${evidence.title ?? evidence.url ?? evidence.type}`,
    `Type: ${evidence.type}`,
    evidence.url ? `URL: ${evidence.url}` : null,
    evidence.description ? `Summary: ${truncateText(evidence.description, 180)}` : null,
    evidence.rawContent ? `Excerpt: ${truncateText(evidence.rawContent, excerptLength)}` : null,
  ]);
}

export function buildAgentContext(
  profile: ProfileJSON | null,
  evidenceItems: AgentEvidenceContextItem[],
  themeInput?: {
    themeId?: string | null;
    themeConfig?: PortfolioThemeConfig | null;
    resumeModelId?: string | null;
    resumeModelConfig?: ResumeModelConfig | null;
  } | null
) {
  const sections: string[] = [];

  if (profile) {
    sections.push(
      joinNonEmpty([
        "PROFILE OVERVIEW",
        `Headline: ${profile.headline}`,
        `About: ${truncateText(profile.about, 420)}`,
        `Resume summary: ${truncateText(profile.resume.summary, 320)}`,
        profile.skills.length
          ? `Skills: ${profile.skills
              .slice(0, 12)
              .map((skill) => `${skill.tag} (${skill.level})`)
              .join(", ")}`
          : null,
        profile.projects.length
          ? `Projects:\n${profile.projects
              .slice(0, 6)
              .map((project, index) => formatProject(project, index))
              .join("\n\n")}`
          : null,
        profile.experiences.length
          ? `Experiences:\n${profile.experiences
              .slice(0, 5)
              .map((experience, index) => formatExperience(experience, index))
              .join("\n\n")}`
          : null,
        profile.achievements.length
          ? `Achievements:\n${profile.achievements
              .slice(0, 5)
              .map((achievement, index) => formatAchievement(achievement, index))
              .join("\n\n")}`
          : null,
        profile.timeline.length
          ? `Timeline:\n${profile.timeline
              .slice(0, 8)
              .map((entry) => `${entry.year}: ${entry.milestones.join(", ")}`)
              .join("\n")}`
          : null,
      ])
    );
  }

  if (evidenceItems.length) {
    sections.push(
      `EVIDENCE SOURCES\n${evidenceItems
        .slice(0, 8)
        .map((item, index) => formatEvidence(item, index))
        .join("\n\n")}`
    );
  }

  if (themeInput) {
    const resolvedTheme = resolvePortfolioTheme(
      themeInput.themeId as PortfolioThemeId | undefined,
      themeInput.themeConfig
    );
    const resolvedResumeModel = resolveResumeModel(
      themeInput.resumeModelId as ResumeModelId | undefined,
      themeInput.resumeModelConfig
    );
    sections.push(
      joinNonEmpty([
        "PUBLIC THEME",
        `Current theme: ${resolvedTheme.label} (${resolvedTheme.id})`,
        `Description: ${resolvedTheme.description}`,
        `Variant: ${resolvedTheme.variant}`,
        `Display direction: ${resolvedTheme.display}`,
        themeInput.themeConfig?.baseThemeId
          ? `Custom base preset: ${themeInput.themeConfig.baseThemeId}`
          : null,
        "AVAILABLE PRESETS:",
          describePortfolioThemesForAgent(),
      ])
    );
    sections.push(
      joinNonEmpty([
        "PUBLIC RESUME MODEL",
        `Current resume model: ${resolvedResumeModel.label} (${resolvedResumeModel.id})`,
        `Description: ${resolvedResumeModel.description}`,
        `Header: ${resolvedResumeModel.headerLayout}`,
        `Aside: ${resolvedResumeModel.asideLayout}`,
        `Sections: ${resolvedResumeModel.sectionStyle}`,
        `Fonts: ${resolvedResumeModel.displayFont}/${resolvedResumeModel.bodyFont}`,
        themeInput.resumeModelConfig?.baseModelId
          ? `Custom base preset: ${themeInput.resumeModelConfig.baseModelId}`
          : null,
        "AVAILABLE PRESETS:",
        describeResumeModelsForAgent(),
      ])
    );
  }

  if (!sections.length) {
    return "No profile or evidence is available yet. Help the user plan what to build next.";
  }

  return sections.join("\n\n");
}

export function resolveAgentFocus(
  profile: ProfileJSON | null,
  evidenceItems: AgentEvidenceContextItem[],
  focus?: AgentFocusSelection | null,
  themeInput?: {
    themeId?: string | null;
    themeConfig?: PortfolioThemeConfig | null;
    resumeModelId?: string | null;
    resumeModelConfig?: ResumeModelConfig | null;
  } | null
): ResolvedAgentFocus | null {
  if (!focus) return null;

  switch (focus.kind) {
    case "theme": {
      const resolvedTheme = resolvePortfolioTheme(
        themeInput?.themeId as PortfolioThemeId | undefined,
        themeInput?.themeConfig
      );
      return {
        label: "Theme / UI",
        context: joinNonEmpty([
          `Current theme: ${resolvedTheme.label} (${resolvedTheme.id})`,
          `Description: ${resolvedTheme.description}`,
          `Variant: ${resolvedTheme.variant}`,
          `Display: ${resolvedTheme.display}`,
          themeInput?.themeConfig?.baseThemeId
            ? `Custom base preset: ${themeInput.themeConfig.baseThemeId}`
            : null,
          "Available presets:",
          describePortfolioThemesForAgent(),
        ]),
      };
    }
    case "headline":
      return profile ? { label: "Headline", context: `Headline: ${profile.headline}` } : null;
    case "about":
      return profile
        ? { label: "About", context: `About section:\n${profile.about}` }
        : null;
    case "resume":
      {
        const resolvedResumeModel = resolveResumeModel(
          themeInput?.resumeModelId as ResumeModelId | undefined,
          themeInput?.resumeModelConfig
        );
      return profile
        ? {
            label: "Resume summary",
            context: joinNonEmpty([
              `Summary: ${profile.resume.summary}`,
              profile.resume.bullets.length
                ? `Bullets: ${profile.resume.bullets.slice(0, 6).join(" | ")}`
                : null,
              `Current resume model: ${resolvedResumeModel.label} (${resolvedResumeModel.id})`,
              `Layout: ${resolvedResumeModel.headerLayout} header, ${resolvedResumeModel.asideLayout} aside, ${resolvedResumeModel.sectionStyle} sections`,
              `Fonts: ${resolvedResumeModel.displayFont}/${resolvedResumeModel.bodyFont}`,
            ]),
          }
        : null;
      }
    case "skills":
      return profile
        ? {
            label: "Skills",
            context: profile.skills.length
              ? profile.skills
                  .map((skill) => `${skill.tag} (${skill.level})`)
                  .join(", ")
              : "No skills listed yet.",
          }
        : null;
    case "projects":
      return profile
        ? {
            label: "Projects",
            context: profile.projects.length
              ? profile.projects
                  .map((project, index) => formatProject(project, index))
                  .join("\n\n")
              : "No projects listed yet.",
          }
        : null;
    case "project": {
      if (!profile || focus.index === undefined || !profile.projects[focus.index]) {
        return null;
      }
      const project = profile.projects[focus.index];
      return {
        label: `Project: ${project.title}`,
        context: formatProject(project, focus.index),
      };
    }
    case "experiences":
      return profile
        ? {
            label: "Experiences",
            context: profile.experiences.length
              ? profile.experiences
                  .map((experience, index) => formatExperience(experience, index))
                  .join("\n\n")
              : "No experiences listed yet.",
          }
        : null;
    case "experience": {
      if (
        !profile ||
        focus.index === undefined ||
        !profile.experiences[focus.index]
      ) {
        return null;
      }
      const experience = profile.experiences[focus.index];
      return {
        label: `Experience: ${experience.role} @ ${experience.org}`,
        context: formatExperience(experience, focus.index),
      };
    }
    case "achievements":
      return profile
        ? {
            label: "Achievements",
            context: profile.achievements.length
              ? profile.achievements
                  .map((achievement, index) => formatAchievement(achievement, index))
                  .join("\n\n")
              : "No achievements listed yet.",
          }
        : null;
    case "achievement": {
      if (
        !profile ||
        focus.index === undefined ||
        !profile.achievements[focus.index]
      ) {
        return null;
      }
      const achievement = profile.achievements[focus.index];
      return {
        label: `Achievement: ${achievement.title}`,
        context: formatAchievement(achievement, focus.index),
      };
    }
    case "timeline":
      return profile
        ? {
            label: "Timeline",
            context: profile.timeline.length
              ? profile.timeline
                  .map((entry) => `${entry.year}: ${entry.milestones.join(", ")}`)
                  .join("\n")
              : "No timeline milestones listed yet.",
          }
        : null;
    case "evidence": {
      if (!focus.evidenceId) return null;
      const evidence = evidenceItems.find((item) => item.id === focus.evidenceId);
      if (!evidence) return null;
      return {
        label: `Evidence: ${evidence.title ?? evidence.url ?? evidence.type}`,
        context: formatEvidence(evidence, 0, 700),
      };
    }
    default:
      return null;
  }
}
