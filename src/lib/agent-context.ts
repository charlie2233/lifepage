import type { ProfileJSON } from "@/lib/schema";
import type { AgentFocusSelection } from "@/lib/agent-focus";

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
  evidenceItems: AgentEvidenceContextItem[]
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

  if (!sections.length) {
    return "No profile or evidence is available yet. Help the user plan what to build next.";
  }

  return sections.join("\n\n");
}

export function resolveAgentFocus(
  profile: ProfileJSON | null,
  evidenceItems: AgentEvidenceContextItem[],
  focus?: AgentFocusSelection | null
): ResolvedAgentFocus | null {
  if (!focus) return null;

  switch (focus.kind) {
    case "headline":
      return profile ? { label: "Headline", context: `Headline: ${profile.headline}` } : null;
    case "about":
      return profile
        ? { label: "About", context: `About section:\n${profile.about}` }
        : null;
    case "resume":
      return profile
        ? {
            label: "Resume summary",
            context: joinNonEmpty([
              `Summary: ${profile.resume.summary}`,
              profile.resume.bullets.length
                ? `Bullets: ${profile.resume.bullets.slice(0, 6).join(" | ")}`
                : null,
            ]),
          }
        : null;
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
