import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export const PLAN_TIERS = ["free", "plus", "pro"] as const;
export type PlanTier = (typeof PLAN_TIERS)[number];

export const PLAN_INTERVALS = ["month", "year"] as const;
export type BillingInterval = (typeof PLAN_INTERVALS)[number];

export const AI_PROVIDERS = ["auto", "kimi", "qwen", "openai"] as const;
export type AiProvider = (typeof AI_PROVIDERS)[number];
type PhysicalAiProvider = Exclude<AiProvider, "auto">;

export const AI_USAGE_RATES = [
  "auto",
  "0.5x",
  "1x",
  "2x",
  "3x",
  "4x",
  "5x",
  "6x",
] as const;
export type AiUsageRate = (typeof AI_USAGE_RATES)[number];

export const AI_TASKS = [
  "generic",
  "chat",
  "profile",
  "timeline",
  "video_script",
  "tree",
] as const;
export type AiTask = (typeof AI_TASKS)[number];

const BILLING_CYCLE_DAYS = 30;
const STRIPE_ENTITLED_STATUSES = ["active", "trialing", "past_due"] as const;

export interface PlanDefinition {
  id: PlanTier;
  label: string;
  monthlyPriceUsd: number;
  yearlyPriceUsd: number;
  monthlyAdvancedCredits: number | null;
  summary: string;
  highlights: string[];
}

export interface AiProviderDefinition {
  id: AiProvider;
  label: string;
  summary: string;
  defaultAdvancedModel: string;
  defaultStandardModel: string;
  available: boolean;
}

export interface AiUsageRateDefinition {
  id: AiUsageRate;
  label: string;
  multiplier: number;
  summary: string;
}

export const PLAN_DEFINITIONS: Record<PlanTier, PlanDefinition> = {
  free: {
    id: "free",
    label: "Free",
    monthlyPriceUsd: 0,
    yearlyPriceUsd: 0,
    monthlyAdvancedCredits: 20,
    summary: "Start building your brand with a small monthly advanced AI budget.",
    highlights: [
      "20 advanced AI credits / month",
      "Unlimited fallback to a lighter model after credits run out",
      "Portfolio publishing and sharing",
    ],
  },
  plus: {
    id: "plus",
    label: "Plus",
    monthlyPriceUsd: 5,
    yearlyPriceUsd: 50,
    monthlyAdvancedCredits: 150,
    summary: "More monthly credits for regular creation, editing, and agent work.",
    highlights: [
      "150 advanced AI credits / month",
      "Unlimited fallback to a lighter model",
      "Best for active builders and students",
    ],
  },
  pro: {
    id: "pro",
    label: "Pro",
    monthlyPriceUsd: 10,
    yearlyPriceUsd: 100,
    monthlyAdvancedCredits: null,
    summary: "Unlimited advanced AI usage for heavy portfolio and brand workflows.",
    highlights: [
      "Unlimited advanced AI usage",
      "No monthly advanced credit cap",
      "Best for agencies, creators, and frequent iteration",
    ],
  },
};

export const AI_PROVIDER_DEFINITIONS: Record<AiProvider, AiProviderDefinition> = {
  auto: {
    id: "auto",
    label: "Auto",
    summary:
      "Best-value router. Uses Qwen for fast cheap chat, and routes heavier generation to Kimi or Qwen depending on the task.",
    defaultAdvancedModel:
      "Auto (Kimi for deep generation, Qwen for structured tools)",
    defaultStandardModel: "Auto (Qwen fast route, Kimi/OpenAI fallback)",
    available: Boolean(
      process.env.KIMI_API_KEY ||
        process.env.QWEN_API_KEY ||
        process.env.DASHSCOPE_API_KEY ||
        process.env.OPENAI_API_KEY
    ),
  },
  kimi: {
    id: "kimi",
    label: "Kimi",
    summary: "Moonshot's OpenAI-compatible API. This is the default provider.",
    defaultAdvancedModel: process.env.KIMI_ADVANCED_MODEL ?? "moonshot-v1-32k",
    defaultStandardModel: process.env.KIMI_STANDARD_MODEL ?? "moonshot-v1-8k",
    available: Boolean(process.env.KIMI_API_KEY),
  },
  qwen: {
    id: "qwen",
    label: "Qwen",
    summary: "Alibaba Cloud DashScope's OpenAI-compatible Qwen API.",
    defaultAdvancedModel: process.env.QWEN_ADVANCED_MODEL ?? "qwen-plus",
    defaultStandardModel: process.env.QWEN_STANDARD_MODEL ?? "qwen-turbo",
    available: Boolean(process.env.QWEN_API_KEY ?? process.env.DASHSCOPE_API_KEY),
  },
  openai: {
    id: "openai",
    label: "OpenAI",
    summary:
      "Use OpenAI models directly, including GPT-5, GPT-5 mini, and GPT-5.1 family choices.",
    defaultAdvancedModel: process.env.OPENAI_ADVANCED_MODEL ?? "gpt-4.1",
    defaultStandardModel: process.env.OPENAI_STANDARD_MODEL ?? "gpt-4.1-mini",
    available: Boolean(process.env.OPENAI_API_KEY),
  },
};

export const AI_USAGE_RATE_DEFINITIONS: Record<
  AiUsageRate,
  AiUsageRateDefinition
> = {
  auto: {
    id: "auto",
    label: "Auto (1x)",
    multiplier: 1,
    summary: "Balanced output length. This is the default.",
  },
  "0.5x": {
    id: "0.5x",
    label: "0.5x",
    multiplier: 0.5,
    summary: "Shortest output length for cheaper generations.",
  },
  "1x": {
    id: "1x",
    label: "1x",
    multiplier: 1,
    summary: "Standard output length.",
  },
  "2x": {
    id: "2x",
    label: "2x",
    multiplier: 2,
    summary: "Double the default output length.",
  },
  "3x": {
    id: "3x",
    label: "3x",
    multiplier: 3,
    summary: "Higher output length for more detailed results.",
  },
  "4x": {
    id: "4x",
    label: "4x",
    multiplier: 4,
    summary: "Large output length for long-form generations.",
  },
  "5x": {
    id: "5x",
    label: "5x",
    multiplier: 5,
    summary: "Very large output length for extensive results.",
  },
  "6x": {
    id: "6x",
    label: "6x",
    multiplier: 6,
    summary: "Maximum output length.",
  },
};

type BillingDbClient = Pick<typeof prisma, "user">;

const BILLING_USER_SELECT = {
  planTier: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
  stripePriceId: true,
  stripeProductId: true,
  stripeSubscriptionStatus: true,
  billingInterval: true,
  subscriptionCurrentPeriodStart: true,
  subscriptionCurrentPeriodEnd: true,
  cancelAtPeriodEnd: true,
  billingSyncedAt: true,
  aiProvider: true,
  preferredAiModel: true,
  aiUsageRate: true,
  aiUsageCycleStartedAt: true,
  advancedAiCreditsUsed: true,
} satisfies Prisma.UserSelect;

type BillingUserRecord = Prisma.UserGetPayload<{
  select: typeof BILLING_USER_SELECT;
}>;

interface BillingState {
  planTier: PlanTier;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  stripeProductId: string | null;
  stripeSubscriptionStatus: string | null;
  billingInterval: BillingInterval | null;
  subscriptionCurrentPeriodStart: Date | null;
  subscriptionCurrentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  billingSyncedAt: Date | null;
  aiProvider: AiProvider;
  preferredAiModel: string | null;
  aiUsageRate: AiUsageRate;
  cycleStartedAt: Date;
  advancedCreditsUsed: number;
}

export interface BillingSnapshot {
  planTier: PlanTier;
  plan: PlanDefinition;
  billingInterval: BillingInterval | null;
  subscriptionStatus: string | null;
  subscriptionCurrentPeriodStart: Date | null;
  subscriptionCurrentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  billingSyncedAt: Date | null;
  canManageSubscription: boolean;
  aiProvider: AiProvider;
  provider: AiProviderDefinition;
  preferredAiModel: string | null;
  aiUsageRate: AiUsageRate;
  effectiveAiUsageRate: Exclude<AiUsageRate, "auto">;
  tokenRateMultiplier: number;
  cycleStartedAt: Date;
  cycleEndsAt: Date;
  advancedCreditsUsed: number;
  advancedCreditsRemaining: number | null;
  unlimitedAdvanced: boolean;
  fallbackToStandard: boolean;
  advancedModel: string;
  standardModel: string;
}

export interface AiModelReservation {
  provider: PhysicalAiProvider;
  model: string;
  clientConfig: {
    apiKey: string;
    baseURL?: string;
  };
  aiUsageRate: AiUsageRate;
  effectiveAiUsageRate: Exclude<AiUsageRate, "auto">;
  tokenRateMultiplier: number;
  maxTokens: number;
  usedAdvancedModel: boolean;
  fellBackToStandard: boolean;
  snapshot: BillingSnapshot;
}

export interface VideoGenerationReservation {
  clientConfig: {
    apiKey: string;
  };
  snapshot: BillingSnapshot;
}

export interface StripeBillingSyncInput {
  planTier: PlanTier;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  stripeProductId: string | null;
  stripeSubscriptionStatus: string | null;
  billingInterval: BillingInterval | null;
  subscriptionCurrentPeriodStart: Date | null;
  subscriptionCurrentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

function normalizePlanTier(value?: string | null): PlanTier {
  return value === "plus" || value === "pro" ? value : "free";
}

function normalizeBillingInterval(value?: string | null): BillingInterval | null {
  return value === "month" || value === "year" ? value : null;
}

function normalizeAiProvider(value?: string | null): AiProvider {
  if (value === "auto" || value === "openai" || value === "qwen") {
    return value;
  }
  return "kimi";
}

function normalizeAiUsageRate(value?: string | null): AiUsageRate {
  return AI_USAGE_RATES.includes(value as AiUsageRate)
    ? (value as AiUsageRate)
    : "auto";
}

function getEffectiveAiUsageRate(
  rate: AiUsageRate
): Exclude<AiUsageRate, "auto"> {
  return rate === "auto" ? "1x" : rate;
}

function getAiUsageMultiplier(rate: AiUsageRate) {
  return AI_USAGE_RATE_DEFINITIONS[getEffectiveAiUsageRate(rate)].multiplier;
}

function addBillingCycle(start: Date) {
  return new Date(start.getTime() + BILLING_CYCLE_DAYS * 24 * 60 * 60 * 1000);
}

function resolveProvider(provider: AiProvider): AiProvider {
  if (provider === "auto") {
    return provider;
  }

  if (AI_PROVIDER_DEFINITIONS[provider].available) {
    return provider;
  }

  if (provider !== "qwen" && AI_PROVIDER_DEFINITIONS.qwen.available) {
    return "qwen";
  }

  if (provider !== "openai" && AI_PROVIDER_DEFINITIONS.openai.available) {
    return "openai";
  }

  if (provider !== "kimi" && AI_PROVIDER_DEFINITIONS.kimi.available) {
    return "kimi";
  }

  return provider;
}

function isProviderConfigured(provider: AiProvider) {
  return AI_PROVIDER_DEFINITIONS[provider].available;
}

function normalizePreferredAiModel(
  provider: AiProvider,
  preferredAiModel?: string | null
) {
  const normalized = preferredAiModel?.trim() || null;

  if (provider === "auto") {
    return "auto";
  }

  if (normalized === "auto") {
    return null;
  }

  return normalized;
}

function getConfiguredPhysicalProvider(
  order: PhysicalAiProvider[]
): PhysicalAiProvider {
  const provider = order.find((candidate) => isProviderConfigured(candidate));
  if (!provider) {
    throw new Error("No AI provider is configured.");
  }
  return provider;
}

function getAutoTaskOrder(
  task: AiTask,
  mode: "advanced" | "standard"
): PhysicalAiProvider[] {
  if (mode === "standard") {
    return ["qwen", "kimi", "openai"];
  }

  switch (task) {
    case "timeline":
    case "tree":
      return ["qwen", "kimi", "openai"];
    case "profile":
    case "video_script":
      return ["kimi", "qwen", "openai"];
    case "chat":
    case "generic":
    default:
      return ["qwen", "kimi", "openai"];
  }
}

function getTaskTokenBudget(task: AiTask, rate: AiUsageRate) {
  const multiplier = getAiUsageMultiplier(rate);
  const baseByTask: Record<AiTask, { base: number; min: number; max: number }> = {
    generic: { base: 800, min: 250, max: 3200 },
    chat: { base: 600, min: 200, max: 2400 },
    profile: { base: 1800, min: 900, max: 6000 },
    timeline: { base: 900, min: 450, max: 3600 },
    video_script: { base: 1200, min: 600, max: 4200 },
    tree: { base: 900, min: 450, max: 3200 },
  };
  const budget = baseByTask[task];

  return Math.max(
    budget.min,
    Math.min(budget.max, Math.round(budget.base * multiplier))
  );
}

function resolveRequestedMode(
  provider: AiProvider,
  task: AiTask,
  preference: "advanced" | "standard"
) {
  if (preference === "standard") {
    return "standard";
  }

  if (provider === "auto" && task === "chat") {
    return "standard";
  }

  return "advanced";
}

function resolveReservationTarget(
  state: BillingState,
  mode: "advanced" | "standard",
  task: AiTask
): {
  provider: PhysicalAiProvider;
  model: string;
} {
  if (state.aiProvider === "auto") {
    const provider = getConfiguredPhysicalProvider(getAutoTaskOrder(task, mode));
    const definition = AI_PROVIDER_DEFINITIONS[provider];
    return {
      provider,
      model:
        mode === "advanced"
          ? definition.defaultAdvancedModel
          : definition.defaultStandardModel,
    };
  }

  const provider = resolveProvider(state.aiProvider) as PhysicalAiProvider;
  const definition = AI_PROVIDER_DEFINITIONS[provider];
  return {
    provider,
    model:
      mode === "advanced"
        ? normalizePreferredAiModel(provider, state.preferredAiModel) ??
          definition.defaultAdvancedModel
        : definition.defaultStandardModel,
  };
}

function getClientConfig(provider: PhysicalAiProvider) {
  if (provider === "kimi") {
    const apiKey = process.env.KIMI_API_KEY;
    if (!apiKey) {
      throw new Error("KIMI_API_KEY is not configured.");
    }
    return {
      apiKey,
      baseURL: process.env.KIMI_BASE_URL ?? "https://api.moonshot.cn/v1",
    };
  }

  if (provider === "qwen") {
    const apiKey = process.env.QWEN_API_KEY ?? process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      throw new Error("QWEN_API_KEY or DASHSCOPE_API_KEY is not configured.");
    }
    return {
      apiKey,
      baseURL:
        process.env.QWEN_BASE_URL ??
        "https://dashscope.aliyuncs.com/compatible-mode/v1",
    };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }
  return { apiKey };
}

function toBillingState(user: BillingUserRecord): BillingState {
  return {
    planTier: normalizePlanTier(user.planTier),
    stripeCustomerId: user.stripeCustomerId,
    stripeSubscriptionId: user.stripeSubscriptionId,
    stripePriceId: user.stripePriceId,
    stripeProductId: user.stripeProductId,
    stripeSubscriptionStatus: user.stripeSubscriptionStatus,
    billingInterval: normalizeBillingInterval(user.billingInterval),
    subscriptionCurrentPeriodStart: user.subscriptionCurrentPeriodStart,
    subscriptionCurrentPeriodEnd: user.subscriptionCurrentPeriodEnd,
    cancelAtPeriodEnd: user.cancelAtPeriodEnd,
    billingSyncedAt: user.billingSyncedAt,
    aiProvider: normalizeAiProvider(user.aiProvider),
    preferredAiModel: user.preferredAiModel,
    aiUsageRate: normalizeAiUsageRate(user.aiUsageRate),
    cycleStartedAt: user.aiUsageCycleStartedAt,
    advancedCreditsUsed: user.advancedAiCreditsUsed,
  };
}

function getCycleEndsAt(state: BillingState) {
  if (
    state.planTier !== "free" &&
    state.billingInterval === "month" &&
    state.subscriptionCurrentPeriodEnd
  ) {
    return state.subscriptionCurrentPeriodEnd;
  }

  if (
    state.planTier !== "free" &&
    state.billingInterval === "year" &&
    state.subscriptionCurrentPeriodEnd
  ) {
    const cycleEnd = addBillingCycle(state.cycleStartedAt);
    return cycleEnd < state.subscriptionCurrentPeriodEnd
      ? cycleEnd
      : state.subscriptionCurrentPeriodEnd;
  }

  return addBillingCycle(state.cycleStartedAt);
}

function getBillingCycleReset(state: BillingState, now: Date) {
  if (
    state.planTier !== "free" &&
    state.billingInterval === "month" &&
    state.subscriptionCurrentPeriodStart
  ) {
    if (
      state.cycleStartedAt.getTime() !==
      state.subscriptionCurrentPeriodStart.getTime()
    ) {
      return {
        aiUsageCycleStartedAt: state.subscriptionCurrentPeriodStart,
        advancedAiCreditsUsed: 0,
      };
    }

    return null;
  }

  if (
    state.planTier !== "free" &&
    state.billingInterval === "year" &&
    state.subscriptionCurrentPeriodStart &&
    state.subscriptionCurrentPeriodEnd
  ) {
    if (
      state.cycleStartedAt < state.subscriptionCurrentPeriodStart ||
      state.cycleStartedAt >= state.subscriptionCurrentPeriodEnd
    ) {
      return {
        aiUsageCycleStartedAt: state.subscriptionCurrentPeriodStart,
        advancedAiCreditsUsed: 0,
      };
    }

    let nextCycleStart = state.cycleStartedAt;
    let shouldReset = false;

    while (
      addBillingCycle(nextCycleStart) <= now &&
      addBillingCycle(nextCycleStart) < state.subscriptionCurrentPeriodEnd
    ) {
      nextCycleStart = addBillingCycle(nextCycleStart);
      shouldReset = true;
    }

    if (shouldReset) {
      return {
        aiUsageCycleStartedAt: nextCycleStart,
        advancedAiCreditsUsed: 0,
      };
    }

    return null;
  }

  if (addBillingCycle(state.cycleStartedAt) <= now) {
    return {
      aiUsageCycleStartedAt: now,
      advancedAiCreditsUsed: 0,
    };
  }

  return null;
}

function buildSnapshot(state: BillingState): BillingSnapshot {
  const plan = PLAN_DEFINITIONS[state.planTier];
  const providerId = resolveProvider(state.aiProvider);
  const provider = AI_PROVIDER_DEFINITIONS[providerId];
  const effectiveAiUsageRate = getEffectiveAiUsageRate(state.aiUsageRate);
  const cycleEndsAt = getCycleEndsAt(state);
  const advancedCreditsRemaining =
    plan.monthlyAdvancedCredits === null
      ? null
      : Math.max(0, plan.monthlyAdvancedCredits - state.advancedCreditsUsed);

  return {
    planTier: state.planTier,
    plan,
    billingInterval: state.billingInterval,
    subscriptionStatus: state.stripeSubscriptionStatus,
    subscriptionCurrentPeriodStart: state.subscriptionCurrentPeriodStart,
    subscriptionCurrentPeriodEnd: state.subscriptionCurrentPeriodEnd,
    cancelAtPeriodEnd: state.cancelAtPeriodEnd,
    billingSyncedAt: state.billingSyncedAt,
    canManageSubscription: Boolean(state.stripeCustomerId),
    aiProvider: providerId,
    provider,
    preferredAiModel: state.preferredAiModel,
    aiUsageRate: state.aiUsageRate,
    effectiveAiUsageRate,
    tokenRateMultiplier: AI_USAGE_RATE_DEFINITIONS[effectiveAiUsageRate].multiplier,
    cycleStartedAt: state.cycleStartedAt,
    cycleEndsAt,
    advancedCreditsUsed: state.advancedCreditsUsed,
    advancedCreditsRemaining,
    unlimitedAdvanced: plan.monthlyAdvancedCredits === null,
    fallbackToStandard:
      plan.monthlyAdvancedCredits !== null && advancedCreditsRemaining === 0,
    advancedModel:
      providerId === "auto"
        ? provider.defaultAdvancedModel
        : normalizePreferredAiModel(providerId, state.preferredAiModel) ??
          provider.defaultAdvancedModel,
    standardModel: provider.defaultStandardModel,
  };
}

async function getFreshBillingState(
  db: BillingDbClient,
  userId: string
): Promise<BillingState> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: BILLING_USER_SELECT,
  });

  if (!user) {
    throw new Error("User not found.");
  }

  const state = toBillingState(user);
  const reset = getBillingCycleReset(state, new Date());

  if (reset) {
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: reset,
      select: BILLING_USER_SELECT,
    });

    return toBillingState(updatedUser);
  }

  return state;
}

export async function getBillingSnapshot(userId: string): Promise<BillingSnapshot> {
  const state = await getFreshBillingState(prisma, userId);
  return buildSnapshot(state);
}

export async function updateUserBillingPreferences(
  userId: string,
  patch: {
    aiProvider?: AiProvider;
    preferredAiModel?: string | null;
    aiUsageRate?: AiUsageRate;
  }
): Promise<BillingSnapshot> {
  const shouldReadCurrentState =
    patch.aiProvider === undefined ||
    Object.prototype.hasOwnProperty.call(patch, "preferredAiModel");
  const currentState = shouldReadCurrentState
    ? await getFreshBillingState(prisma, userId)
    : null;
  const nextProvider = patch.aiProvider ?? currentState?.aiProvider ?? "kimi";

  if (!isProviderConfigured(nextProvider)) {
    throw new Error(
      `${AI_PROVIDER_DEFINITIONS[nextProvider].label} is not configured.`
    );
  }

  const hasPreferredAiModel =
    Object.prototype.hasOwnProperty.call(patch, "preferredAiModel");

  if (
    nextProvider === "auto" &&
    hasPreferredAiModel &&
    patch.preferredAiModel &&
    patch.preferredAiModel.trim().toLowerCase() !== "auto"
  ) {
    throw new Error('The "auto" provider only supports the "auto" model.');
  }

  const updateData: Prisma.UserUpdateInput = {};

  if (patch.aiProvider) {
    updateData.aiProvider = patch.aiProvider;
    if (!hasPreferredAiModel) {
      updateData.preferredAiModel = patch.aiProvider === "auto" ? "auto" : null;
    }
  }

  if (hasPreferredAiModel) {
    updateData.preferredAiModel = normalizePreferredAiModel(
      nextProvider,
      patch.preferredAiModel
    );
  }

  if (patch.aiUsageRate) {
    updateData.aiUsageRate = patch.aiUsageRate;
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: BILLING_USER_SELECT,
  });

  return buildSnapshot(toBillingState(updatedUser));
}

export async function syncStripeBillingState(
  userId: string,
  input: StripeBillingSyncInput
): Promise<BillingSnapshot> {
  return prisma.$transaction(async (tx) => {
    const existingUser = await tx.user.findUnique({
      where: { id: userId },
      select: BILLING_USER_SELECT,
    });

    if (!existingUser) {
      throw new Error("User not found.");
    }

    const currentState = toBillingState(existingUser);
    const nextCycleAnchor =
      input.planTier === "free"
        ? new Date()
        : input.subscriptionCurrentPeriodStart ?? new Date();
    const shouldResetCredits =
      input.planTier === "free"
        ? currentState.planTier !== "free"
        : currentState.planTier !== input.planTier ||
          currentState.billingInterval !== input.billingInterval ||
          currentState.stripeSubscriptionId !== input.stripeSubscriptionId ||
          currentState.subscriptionCurrentPeriodStart?.getTime() !==
            input.subscriptionCurrentPeriodStart?.getTime() ||
          currentState.subscriptionCurrentPeriodEnd?.getTime() !==
            input.subscriptionCurrentPeriodEnd?.getTime();

    const updateData: Prisma.UserUpdateInput = {
      planTier: input.planTier,
      stripeCustomerId: input.stripeCustomerId,
      stripeSubscriptionId: input.stripeSubscriptionId,
      stripePriceId: input.stripePriceId,
      stripeProductId: input.stripeProductId,
      stripeSubscriptionStatus: input.stripeSubscriptionStatus,
      billingInterval: input.billingInterval,
      subscriptionCurrentPeriodStart: input.subscriptionCurrentPeriodStart,
      subscriptionCurrentPeriodEnd: input.subscriptionCurrentPeriodEnd,
      cancelAtPeriodEnd: input.cancelAtPeriodEnd,
      billingSyncedAt: new Date(),
    };

    if (shouldResetCredits) {
      updateData.aiUsageCycleStartedAt = nextCycleAnchor;
      updateData.advancedAiCreditsUsed = 0;
    } else if (
      input.planTier !== "free" &&
      input.subscriptionCurrentPeriodStart &&
      currentState.cycleStartedAt < input.subscriptionCurrentPeriodStart
    ) {
      updateData.aiUsageCycleStartedAt = input.subscriptionCurrentPeriodStart;
      updateData.advancedAiCreditsUsed = 0;
    }

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: updateData,
      select: BILLING_USER_SELECT,
    });

    return buildSnapshot(toBillingState(updatedUser));
  });
}

export async function reserveAiModel(
  userId: string,
  options?: {
    preference?: "advanced" | "standard";
    task?: AiTask;
  }
): Promise<AiModelReservation> {
  const preference = options?.preference ?? "advanced";
  const task = options?.task ?? "generic";

  if (preference === "standard") {
    const state = await getFreshBillingState(prisma, userId);
    const snapshot = buildSnapshot(state);
    const target = resolveReservationTarget(state, "standard", task);
    return {
      provider: target.provider,
      model: target.model,
      clientConfig: getClientConfig(target.provider),
      aiUsageRate: snapshot.aiUsageRate,
      effectiveAiUsageRate: snapshot.effectiveAiUsageRate,
      tokenRateMultiplier: snapshot.tokenRateMultiplier,
      maxTokens: getTaskTokenBudget(task, state.aiUsageRate),
      usedAdvancedModel: false,
      fellBackToStandard: false,
      snapshot,
    };
  }

  return prisma.$transaction(async (tx) => {
    const state = await getFreshBillingState(tx, userId);
    const plan = PLAN_DEFINITIONS[state.planTier];
    const requestedMode = resolveRequestedMode(state.aiProvider, task, preference);

    if (requestedMode === "standard") {
      const snapshot = buildSnapshot(state);
      const target = resolveReservationTarget(state, "standard", task);
      return {
        provider: target.provider,
        model: target.model,
        clientConfig: getClientConfig(target.provider),
        aiUsageRate: snapshot.aiUsageRate,
        effectiveAiUsageRate: snapshot.effectiveAiUsageRate,
        tokenRateMultiplier: snapshot.tokenRateMultiplier,
        maxTokens: getTaskTokenBudget(task, state.aiUsageRate),
        usedAdvancedModel: false,
        fellBackToStandard: false,
        snapshot,
      };
    }

    if (plan.monthlyAdvancedCredits === null) {
      const snapshot = buildSnapshot(state);
      const target = resolveReservationTarget(state, "advanced", task);
      return {
        provider: target.provider,
        model: target.model,
        clientConfig: getClientConfig(target.provider),
        aiUsageRate: snapshot.aiUsageRate,
        effectiveAiUsageRate: snapshot.effectiveAiUsageRate,
        tokenRateMultiplier: snapshot.tokenRateMultiplier,
        maxTokens: getTaskTokenBudget(task, state.aiUsageRate),
        usedAdvancedModel: true,
        fellBackToStandard: false,
        snapshot,
      };
    }

    if (state.advancedCreditsUsed < plan.monthlyAdvancedCredits) {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          advancedAiCreditsUsed: { increment: 1 },
        },
        select: BILLING_USER_SELECT,
      });

      const updatedState = toBillingState(updatedUser);
      const snapshot = buildSnapshot(updatedState);
      const target = resolveReservationTarget(updatedState, "advanced", task);

      return {
        provider: target.provider,
        model: target.model,
        clientConfig: getClientConfig(target.provider),
        aiUsageRate: snapshot.aiUsageRate,
        effectiveAiUsageRate: snapshot.effectiveAiUsageRate,
        tokenRateMultiplier: snapshot.tokenRateMultiplier,
        maxTokens: getTaskTokenBudget(task, updatedState.aiUsageRate),
        usedAdvancedModel: true,
        fellBackToStandard: false,
        snapshot,
      };
    }

    const snapshot = buildSnapshot(state);
    const target = resolveReservationTarget(state, "standard", task);
    return {
      provider: target.provider,
      model: target.model,
      clientConfig: getClientConfig(target.provider),
      aiUsageRate: snapshot.aiUsageRate,
      effectiveAiUsageRate: snapshot.effectiveAiUsageRate,
      tokenRateMultiplier: snapshot.tokenRateMultiplier,
      maxTokens: getTaskTokenBudget(task, state.aiUsageRate),
      usedAdvancedModel: false,
      fellBackToStandard: true,
      snapshot,
    };
  });
}

export async function reserveVideoGeneration(
  userId: string
): Promise<VideoGenerationReservation> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  return prisma.$transaction(async (tx) => {
    const state = await getFreshBillingState(tx, userId);
    const plan = PLAN_DEFINITIONS[state.planTier];

    if (plan.monthlyAdvancedCredits === null) {
      return {
        clientConfig: { apiKey: process.env.OPENAI_API_KEY! },
        snapshot: buildSnapshot(state),
      };
    }

    if (state.advancedCreditsUsed < plan.monthlyAdvancedCredits) {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          advancedAiCreditsUsed: { increment: 1 },
        },
        select: BILLING_USER_SELECT,
      });

      return {
        clientConfig: { apiKey: process.env.OPENAI_API_KEY! },
        snapshot: buildSnapshot(toBillingState(updatedUser)),
      };
    }

    throw new Error(
      "You have used all advanced AI credits for this cycle. Upgrade to Plus or Pro to generate more demo videos."
    );
  });
}

export function isEntitledStripeStatus(status?: string | null) {
  return STRIPE_ENTITLED_STATUSES.includes(
    status as (typeof STRIPE_ENTITLED_STATUSES)[number]
  );
}
