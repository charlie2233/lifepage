import type { AgentMutationTarget } from "@/lib/agent-skills";
import type { AgentPortfolioPatch } from "@/lib/agent-mutations";

const EXPLICIT_HEADLINE_PATTERNS = [
  /(?:set|change|update|rewrite|replace)\s+(?:my\s+|the\s+)?headline\s+(?:to|as|with)\s+["“”']?(.+?)["“”']?\s*[.!?]*$/i,
  /\bheadline\s*:\s*["“”']?(.+?)["“”']?\s*[.!?]*$/i,
] as const;

const AMBIGUOUS_LITERAL_PREFIXES = [
  /^be\s+/i,
  /^sound\s+/i,
  /^feel\s+/i,
  /^look\s+/i,
  /^make\s+it\s+/i,
  /^more\s+/i,
  /^less\s+/i,
  /^better\s+/i,
  /^stronger\s+/i,
  /^shorter\s+/i,
  /^longer\s+/i,
  /^something\s+/i,
] as const;

function normalizeLiteralCandidate(value: string) {
  return value
    .trim()
    .replace(/^["“”']+/, "")
    .replace(/["“”']+$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractExplicitHeadlineOverride(message: string) {
  for (const pattern of EXPLICIT_HEADLINE_PATTERNS) {
    const matched = message.match(pattern);
    if (!matched?.[1]) continue;

    const normalized = normalizeLiteralCandidate(matched[1]);
    if (!normalized) continue;
    if (AMBIGUOUS_LITERAL_PREFIXES.some((pattern) => pattern.test(normalized))) {
      return null;
    }

    return normalized;
  }

  return null;
}

export function applyExplicitMutationOverrides(args: {
  allowedTargets: AgentMutationTarget[];
  message: string;
  patch: AgentPortfolioPatch;
}) {
  const canSetHeadline = args.allowedTargets.includes("profile.headline");
  const explicitHeadline = canSetHeadline
    ? extractExplicitHeadlineOverride(args.message)
    : null;

  if (!explicitHeadline) {
    return {
      exactHeadline: null,
      patch: args.patch,
    };
  }

  return {
    exactHeadline: explicitHeadline,
    patch: {
      ...args.patch,
      profile: {
        ...(args.patch.profile ?? {}),
        headline: explicitHeadline,
      },
    } satisfies AgentPortfolioPatch,
  };
}
