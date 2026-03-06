export const AGENT_FOCUS_KINDS = [
  "headline",
  "about",
  "resume",
  "skills",
  "projects",
  "project",
  "experiences",
  "experience",
  "achievements",
  "achievement",
  "timeline",
  "evidence",
] as const;

export type AgentFocusKind = (typeof AGENT_FOCUS_KINDS)[number];

export interface AgentFocusSelection {
  kind: AgentFocusKind;
  index?: number;
  evidenceId?: string;
}

export function encodeAgentFocusValue(
  focus?: AgentFocusSelection | null
): string {
  if (!focus) return "all";

  switch (focus.kind) {
    case "project":
    case "experience":
    case "achievement":
      return focus.index === undefined ? "all" : `${focus.kind}:${focus.index}`;
    case "evidence":
      return focus.evidenceId ? `evidence:${focus.evidenceId}` : "all";
    default:
      return focus.kind;
  }
}

export function parseAgentFocusValue(
  value: string
): AgentFocusSelection | null {
  if (!value || value === "all") {
    return null;
  }

  if (
    value === "headline" ||
    value === "about" ||
    value === "resume" ||
    value === "skills" ||
    value === "projects" ||
    value === "experiences" ||
    value === "achievements" ||
    value === "timeline"
  ) {
    return { kind: value };
  }

  const indexedMatch = value.match(/^(project|experience|achievement):(\d+)$/);
  if (indexedMatch) {
    return {
      kind: indexedMatch[1] as AgentFocusKind,
      index: Number(indexedMatch[2]),
    };
  }

  if (value.startsWith("evidence:")) {
    const evidenceId = value.slice("evidence:".length).trim();
    return evidenceId ? { kind: "evidence", evidenceId } : null;
  }

  return null;
}
