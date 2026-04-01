"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { TrackPageView } from "@/components/track-page-view";
import {
  encodeAgentFocusValue,
  parseAgentFocusValue,
  type AgentFocusSelection,
} from "@/lib/agent-focus";
import { trackProductEvent } from "@/lib/analytics-client";
import type { PublicPageVisibility } from "@/lib/page-visibility";
import { normalizeVisibility } from "@/lib/page-visibility";
import {
  PORTFOLIO_THEME_PRESETS,
  normalizePortfolioThemeId,
  type PortfolioThemeConfig,
  type PortfolioThemeId,
} from "@/lib/portfolio-themes";
import {
  RESUME_MODEL_PRESETS,
  normalizeResumeModelId,
  type ResumeModelConfig,
  type ResumeModelId,
} from "@/lib/resume-models";
import {
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Bot,
  BriefcaseBusiness,
  ChartColumn,
  CheckCircle2,
  Clapperboard,
  Clock3,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  FolderOpen,
  GitBranch,
  Globe,
  GraduationCap,
  Link2,
  LoaderCircle,
  Lock,
  MessageSquare,
  Palette,
  Plus,
  RefreshCcw,
  Search,
  Settings,
  Sparkles,
  Trash2,
  TriangleAlert,
  User,
  WandSparkles,
} from "lucide-react";

interface EvidenceItem {
  id: string;
  type: string;
  url?: string | null;
  canonicalUrl?: string | null;
  title?: string | null;
  description?: string | null;
  screenshot?: string | null;
  crawlStatus?: "ready" | "partial" | "failed" | null;
  screenshotStatus?: "ready" | "pending" | "failed" | "unavailable" | null;
  screenshotError?: string | null;
  visible: boolean;
  createdAt: string;
}

interface GeneratedProfile {
  id: string;
  data: {
    headline: string;
    about: string;
    skills: Array<{ tag: string; level: string }>;
    experiences: Array<{
      role: string;
      org: string;
      startDate?: string | null;
      endDate?: string | null;
      bullets: string[];
    }>;
    projects: Array<{
      title: string;
      problem?: string | null;
      approach?: string | null;
      impact?: string | null;
      tech: string[];
      media?: Array<
        | string
        | {
            type: "video" | "image" | "link";
            url: string;
            posterUrl?: string | null;
            title?: string | null;
            provider?: string | null;
            status?: "processing" | "ready" | "failed";
            durationSeconds?: number | null;
            sourceArtifactId?: string | null;
            error?: string | null;
          }
      >;
    }>;
    achievements: Array<{ title: string; date?: string | null }>;
    timeline: Array<{ year: string; milestones: string[] }>;
    resume: {
      summary: string;
      bullets: string[];
    };
    stats: {
      projectsShipped: number;
      yearsBuilding: number;
      competitions: number;
    };
    confidence: number;
  };
  createdAt: string;
}

interface Automation {
  id: string;
  name: string;
  description?: string | null;
  action: string;
  config: Record<string, unknown>;
  schedule: string;
  scheduleTime: string;
  scheduleTimezone: string;
  enabled: boolean;
  lockedAt?: string | null;
  lastAttemptAt?: string | null;
  lastRun?: string | null;
  nextRun?: string | null;
  lastStatus?: string | null;
  lastError?: string | null;
  retryCount: number;
  runCount: number;
}

interface AgentArtifact {
  id: string;
  tool: string;
  style?: string | null;
  output: unknown;
  createdAt: string;
  meta?: {
    executionMode?: "artifact" | "mutate";
    resolvedPersonaSkillId?: string | null;
    resolvedWorkflowSkillId?: string | null;
    projectVideo?: ProjectVideoArtifactOutput | null;
    mutationSummary?: AgentMutationSummary | null;
    revertable?: boolean;
    revertedAt?: string | null;
  } | null;
}

interface AgentStrategy {
  intent: string;
  mode: "reply" | "artifact" | "mutate";
  personaSkillId?: string;
  workflowSkillId?: string;
  tool?: string;
  style?: string;
  rationale: string;
  nextSteps: string[];
  missingContext: string[];
}

interface AgentSkillSummary {
  id: string;
  label: string;
  category: "persona" | "workflow";
  description: string;
}

interface AgentMutationSummary {
  title: string;
  summary: string;
  changes: string[];
  changedFields: string[];
}

interface AgentClarificationOption {
  label: string;
  answer: string;
}

interface AgentClarificationQuestion {
  id: string;
  label: string;
  question: string;
  helpText?: string | null;
  options: AgentClarificationOption[];
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  tool?: string;
  style?: string;
  output?: unknown;
  artifactId?: string;
  focusLabel?: string;
  strategy?: AgentStrategy;
  executionMode?: "reply" | "artifact" | "mutate" | "clarify";
  resolvedPersonaSkill?: AgentSkillSummary | null;
  resolvedWorkflowSkill?: AgentSkillSummary | null;
  mutationSummary?: AgentMutationSummary | null;
  revertable?: boolean;
  clarificationQuestions?: AgentClarificationQuestion[];
}

interface ApiEvidenceResponse { items?: EvidenceItem[] }
interface ApiProfileResponse { profile?: GeneratedProfile | null }
interface ApiCrawlResponse {
  item?: EvidenceItem;
  items?: EvidenceItem[];
  results?: Array<{
    inputUrl: string;
    url?: string;
    item?: EvidenceItem;
    error?: string;
  }>;
  error?: string;
}
interface ApiGenerateResponse {
  profile?: GeneratedProfile;
  billing?: BillingSnapshot;
  error?: string;
}
interface BillingPlan {
  id: "free" | "plus" | "pro";
  label: string;
  monthlyPriceUsd: number;
  yearlyPriceUsd: number;
  monthlyAdvancedCredits: number | null;
  summary: string;
  highlights: string[];
}
type BillingInterval = "month" | "year";
interface BillingProvider {
  id: "auto" | "kimi" | "qwen" | "openai";
  label: string;
  summary: string;
  defaultAdvancedModel: string;
  defaultStandardModel: string;
  available: boolean;
}
interface BillingUsageRate {
  id: "auto" | "0.5x" | "1x" | "2x" | "3x" | "4x" | "5x" | "6x";
  label: string;
  multiplier: number;
  summary: string;
}
interface BillingSnapshot {
  planTier: "free" | "plus" | "pro";
  plan: BillingPlan;
  billingInterval: BillingInterval | null;
  subscriptionStatus: string | null;
  subscriptionCurrentPeriodStart: string | null;
  subscriptionCurrentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  billingSyncedAt?: string | null;
  canManageSubscription: boolean;
  aiProvider: BillingProvider["id"];
  provider: BillingProvider;
  preferredAiModel: string | null;
  aiUsageRate: BillingUsageRate["id"];
  effectiveAiUsageRate: Exclude<BillingUsageRate["id"], "auto">;
  tokenRateMultiplier: number;
  cycleStartedAt: string;
  cycleEndsAt: string;
  advancedCreditsUsed: number;
  advancedCreditsRemaining: number | null;
  unlimitedAdvanced: boolean;
  fallbackToStandard: boolean;
  advancedModel: string;
  standardModel: string;
}
interface ApiAgentResponse {
  type?: "chat" | "tool_result" | "mutation_result" | "clarification";
  reply?: string;
  tool?: string;
  style?: string;
  output?: unknown;
  artifactId?: string;
  focusLabel?: string;
  strategy?: AgentStrategy;
  executionMode?: "reply" | "artifact" | "mutate" | "clarify";
  resolvedPersonaSkill?: AgentSkillSummary | null;
  resolvedWorkflowSkill?: AgentSkillSummary | null;
  mutationSummary?: AgentMutationSummary | null;
  revertable?: boolean;
  clarificationQuestions?: AgentClarificationQuestion[];
  profile?: GeneratedProfile["data"] | null;
  settings?: {
    visibility: PublicPageVisibility;
    mode: "hiring" | "admissions";
    theme: PortfolioThemeId;
    themeConfig?: PortfolioThemeConfig | null;
    resumeModel: ResumeModelId;
    resumeModelConfig?: ResumeModelConfig | null;
  } | null;
  billing?: BillingSnapshot;
  error?: string;
  artifacts?: AgentArtifact[];
  recentRuns?: Array<{
    id: string;
    tool: string;
    createdAt: string;
    executionMode: "artifact" | "mutate";
    resolvedPersonaSkill?: AgentSkillSummary | null;
    resolvedWorkflowSkill?: AgentSkillSummary | null;
    mutationSummary?: AgentMutationSummary | null;
    revertable: boolean;
    revertedAt?: string | null;
  }>;
}
interface ThemeArtifactOutput {
  themeId: PortfolioThemeId;
  themeConfig?: PortfolioThemeConfig | null;
  themeLabel: string;
  summary: string;
  rationale: string;
  changes: string[];
}
interface ResumeModelArtifactOutput {
  modelId: ResumeModelId;
  modelConfig?: ResumeModelConfig | null;
  modelLabel: string;
  summary: string;
  rationale: string;
  changes: string[];
}
interface RegeneratedProfileArtifactOutput {
  summary: string;
  headline: string;
  about: string;
  resumeSummary: string;
  confidence: number;
  refreshedFromEvidenceCount: number;
  stats: {
    projectsShipped: number;
    yearsBuilding: number;
    competitions: number;
  };
  profile?: GeneratedProfile["data"];
}
interface RecrawlArtifactOutput {
  summary: string;
  title: string;
  url: string;
  description: string;
  headings: string[];
  bodyPreview: string;
  usedExistingItem: boolean;
  screenshotCaptured: boolean;
  itemId: string;
}
interface ProjectVideoArtifactOutput {
  status: "queued" | "in_progress" | "completed" | "failed";
  summary: string;
  projectIndex: number;
  projectTitle: string;
  style: "polished-product-demo";
  durationSeconds: 4 | 8 | 12;
  prompt: string;
  progress?: number | null;
  soraVideoId?: string | null;
  videoUrl?: string | null;
  posterUrl?: string | null;
  error?: string | null;
}
interface ApiBillingResponse {
  billing?: BillingSnapshot;
  plans?: BillingPlan[];
  intervals?: BillingInterval[];
  providers?: BillingProvider[];
  usageRates?: BillingUsageRate[];
  stripeConfigured?: boolean;
  error?: string;
}
type CustomDomainStatus =
  | "none"
  | "configuration_required"
  | "pending_verification"
  | "verified"
  | "active"
  | "error";
type CustomDomainDnsStatus =
  | "not_started"
  | "configuration_required"
  | "pending"
  | "verified"
  | "error";
interface CustomDomainDiagnosticsSnapshot {
  launchScope?: "subdomain_only";
  requestedHostname?: string;
  providerConfigured?: boolean;
  lifecycleStatus?: CustomDomainStatus;
  dnsStatus?: CustomDomainDnsStatus;
  verification?: {
    type?: "CNAME";
    name?: string;
    value?: string | null;
  } | null;
  dns?: {
    checkedAt?: string | null;
    observedValues?: string[];
  } | null;
  provider?: {
    id?: string | null;
    status?: string | null;
    error?: string | null;
  } | null;
  ssl?: {
    status?: string | null;
  } | null;
  nextAction?: string;
}
interface DashboardSettingsSnapshot {
  isPublic: boolean;
  visibility?: PublicPageVisibility | null;
  theme: PortfolioThemeId;
  themeConfig?: PortfolioThemeConfig | null;
  resumeModel?: ResumeModelId;
  resumeModelConfig?: ResumeModelConfig | null;
  mode: string;
  customDomain?: string | null;
  customDomainStatus?: CustomDomainStatus | null;
  customDomainDnsStatus?: CustomDomainDnsStatus | null;
  customDomainVerificationName?: string | null;
  customDomainVerificationValue?: string | null;
  customDomainProviderId?: string | null;
  customDomainProviderStatus?: string | null;
  customDomainSslStatus?: string | null;
  customDomainProviderError?: string | null;
  customDomainLastCheckedAt?: string | null;
  customDomainError?: string | null;
  customDomainDiagnostics?: CustomDomainDiagnosticsSnapshot | null;
}
interface ApiSettingsResponse {
  settings?: DashboardSettingsSnapshot | null;
  verified?: boolean;
  cloudflareSaasConfigured?: boolean;
  cloudflareSaasCnameTarget?: string | null;
  warning?: string | null;
  error?: string | null;
}
interface ApiProjectVideoResponse {
  artifactId?: string;
  output?: ProjectVideoArtifactOutput;
  profile?: GeneratedProfile["data"] | null;
  billing?: BillingSnapshot;
  error?: string;
}
interface AccountSettings {
  name: string | null;
  username: string | null;
  email: string;
  createdAt: string;
  profile?: {
    location: string | null;
    website: string | null;
    github: string | null;
    linkedin: string | null;
    youtube: string | null;
    contactEmail: string | null;
    phone: string | null;
    contactNote: string | null;
  };
  agentPreferences?: {
    pinnedPersonaSkillId: string | null;
    pinnedWorkflowSkillId: string | null;
    brandVoiceInstruction: string | null;
  };
}
interface ApiAccountResponse {
  account?: AccountSettings;
  error?: string;
}
interface ApiAutomationResponse {
  automations?: Automation[];
  automation?: Automation;
  error?: string;
}

interface AgentFocusOption {
  value: string;
  label: string;
  hint: string;
}

interface AgentSkillOption {
  id: string;
  label: string;
  category: "persona" | "workflow";
  description: string;
}

interface ApiAgentSkillsResponse {
  personaSkills?: AgentSkillOption[];
  workflowSkills?: AgentSkillOption[];
  error?: string;
}

interface ProviderModelOption {
  value: string;
  label: string;
  note?: string;
}

const PROVIDER_MODEL_OPTIONS: Record<
  Exclude<BillingProvider["id"], "auto">,
  ProviderModelOption[]
> = {
  openai: [
    { value: "gpt-5", label: "GPT-5" },
    { value: "gpt-5-mini", label: "GPT-5 mini" },
    { value: "gpt-5-nano", label: "GPT-5 nano" },
    { value: "gpt-5.1", label: "GPT-5.1", note: "Recommended by OpenAI" },
    { value: "gpt-5.1-mini", label: "GPT-5.1 mini" },
    { value: "gpt-4.1", label: "GPT-4.1" },
    { value: "gpt-4.1-mini", label: "GPT-4.1 mini" },
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-4o-mini", label: "GPT-4o mini" },
  ],
  kimi: [
    { value: "moonshot-v1-32k", label: "Moonshot v1 32k" },
    { value: "moonshot-v1-8k", label: "Moonshot v1 8k" },
  ],
  qwen: [
    { value: "qwen-plus", label: "Qwen Plus" },
    { value: "qwen-turbo", label: "Qwen Turbo" },
  ],
};

function getProviderModelOptions(
  provider: BillingProvider["id"]
): ProviderModelOption[] {
  if (provider === "auto") {
    return [];
  }
  return PROVIDER_MODEL_OPTIONS[provider] ?? [];
}

function splitCrawlInput(value: string) {
  return value
    .split(/[\n,]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

const CRAWL_EXAMPLE_GROUPS = [
  {
    label: "Student / admissions",
    urls: [
      "https://your-site.com",
      "https://github.com/yourname",
      "https://drive.google.com/...",
    ],
  },
  {
    label: "Builder / job search",
    urls: [
      "https://portfolio.example.com",
      "https://github.com/yourname",
      "https://www.youtube.com/@yourname",
    ],
  },
  {
    label: "Creator / founder",
    urls: [
      "https://yourname.com",
      "https://docs.example.com/case-study",
      "https://youtube.com/@yourbrand",
    ],
  },
] as const;

function formatUiError(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return fallback;
}

function normalizeOptionalFormValue(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function formatBillingIntervalLabel(interval?: BillingInterval | null) {
  if (interval === "year") return "Yearly";
  if (interval === "month") return "Monthly";
  return "Not subscribed";
}

function formatSubscriptionStatus(status?: string | null) {
  if (!status) return "No active subscription";
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatPlanPrice(plan: BillingPlan, interval: BillingInterval) {
  const amount =
    interval === "year" ? plan.yearlyPriceUsd : plan.monthlyPriceUsd;
  return amount === 0 ? "$0" : `$${amount}`;
}

function formatPlanIntervalSuffix(interval: BillingInterval) {
  return interval === "year" ? "/yr" : "/mo";
}

function getPlanSavingsCopy(plan: BillingPlan, interval: BillingInterval) {
  if (
    interval !== "year" ||
    plan.monthlyPriceUsd === 0 ||
    plan.yearlyPriceUsd === 0
  ) {
    return null;
  }

  const savedAmount = plan.monthlyPriceUsd * 12 - plan.yearlyPriceUsd;
  if (savedAmount <= 0) {
    return null;
  }

  return `Save $${savedAmount} a year`;
}

function formatCustomDomainStatus(status: CustomDomainStatus) {
  switch (status) {
    case "configuration_required":
      return "Provider setup required";
    case "pending_verification":
      return "Pending verification";
    case "verified":
      return "Verified";
    case "active":
      return "Active";
    case "error":
      return "Needs attention";
    default:
      return "Not configured";
  }
}

function getCustomDomainStatusCopy(status: CustomDomainStatus) {
  switch (status) {
    case "configuration_required":
      return "The hostname is saved, but LifePage cannot provision or verify it from this environment until the Cloudflare SaaS provider setup is completed.";
    case "pending_verification":
      return "Cloudflare has the hostname provisioned, but DNS is not pointing at the required CNAME target yet.";
    case "verified":
      return "DNS matches and Cloudflare is finishing validation and certificate issuance.";
    case "active":
      return "The hostname and certificate are both active, so public requests can resolve through it.";
    case "error":
      return "The latest Cloudflare sync found a provider or DNS error. Review the details below and verify again.";
    default:
      return "Add a hostname to start the managed domain flow.";
  }
}

function formatCustomDomainDnsStatus(status: CustomDomainDnsStatus) {
  switch (status) {
    case "configuration_required":
      return "Provider setup required";
    case "pending":
      return "Waiting on DNS";
    case "verified":
      return "DNS verified";
    case "error":
      return "DNS needs attention";
    default:
      return "Not checked";
  }
}

function getDomainStatusTone(status: CustomDomainStatus | CustomDomainDnsStatus) {
  if (status === "active" || status === "verified") {
    return "border-green-500/30 bg-green-500/10 text-green-300";
  }
  if (status === "configuration_required") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  }
  if (status === "error") {
    return "border-red-500/30 bg-red-500/10 text-red-300";
  }
  return "border-white/10 bg-white/5 text-gray-300";
}

function getCustomDomainTroubleshootingItems(args: {
  cloudflareSaasConfigured: boolean;
  customDomain: string;
  customDomainTargetHost: string;
  customDomainStatus: CustomDomainStatus;
  customDomainDnsStatus: CustomDomainDnsStatus;
  customDomainProviderStatus?: string | null;
  customDomainSslStatus?: string | null;
  customDomainError?: string | null;
  diagnostics?: CustomDomainDiagnosticsSnapshot | null;
}) {
  const items: string[] = [];

  if (!args.cloudflareSaasConfigured) {
    items.push(
      "LifePage is missing part of its Cloudflare SaaS setup in this environment. The hostname is stored locally, but provisioning and verification are paused."
    );
    if (!args.customDomainTargetHost) {
      items.push(
        "Do not change customer DNS yet. Wait until the dashboard shows a required CNAME target."
      );
    }
  }

  if (args.customDomain) {
    items.push(
      "Launch scope is subdomain-only. Use a hostname like portfolio.example.com. Root/apex domains like example.com are queued for a future milestone."
    );
  }

  if (
    args.customDomainTargetHost &&
    (args.customDomainDnsStatus === "pending" ||
      args.customDomainDnsStatus === "error" ||
      args.customDomainStatus === "pending_verification")
  ) {
    items.push(
      `Create exactly one CNAME for ${args.customDomain} pointing to ${args.customDomainTargetHost}, and remove conflicting A, AAAA, or old CNAME records.`
    );
  }

  const observedValues = args.diagnostics?.dns?.observedValues ?? [];
  if (observedValues.length > 0 && !observedValues.includes(args.customDomainTargetHost)) {
    items.push(
      `DNS currently resolves to ${observedValues.join(", ")} instead of ${args.customDomainTargetHost}. Update the DNS record before verifying again.`
    );
  }

  if (args.customDomainDnsStatus === "verified" && args.customDomainSslStatus !== "active") {
    items.push(
      "DNS is correct. Cloudflare is still issuing or validating the certificate. Leave the CNAME in place and retry verification later if it does not update."
    );
  }

  if (args.customDomainProviderStatus && args.customDomainProviderStatus !== "active") {
    items.push(
      `Cloudflare reports the hostname status as ${formatExternalStatusLabel(args.customDomainProviderStatus)}. Keep the DNS record in place and re-run verification after propagation.`
    );
  }

  if (args.customDomainError) {
    items.push(args.customDomainError);
  }

  if (args.diagnostics?.nextAction) {
    items.push(args.diagnostics.nextAction);
  }

  return Array.from(new Set(items)).filter(Boolean);
}

function formatExternalStatusLabel(status?: string | null) {
  if (!status) return "Unknown";
  return status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatEvidenceStatusLabel(status?: EvidenceItem["crawlStatus"] | EvidenceItem["screenshotStatus"]) {
  if (!status) return "Unknown";
  return status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

const EMPTY_PUBLIC_CONTACT_INPUT = {
  location: "",
  website: "",
  github: "",
  linkedin: "",
  youtube: "",
  contactEmail: "",
  phone: "",
  contactNote: "",
};

function humanizeAgentToolName(tool: string) {
  if (tool === "set_portfolio_theme") {
    return "portfolio theme";
  }
  if (tool === "set_resume_model") {
    return "resume model";
  }
  if (tool === "recrawl_url") {
    return "re-crawl URL";
  }
  if (tool === "regenerate_profile") {
    return "regenerate profile";
  }
  if (tool === "generate_project_video") {
    return "project demo video";
  }
  if (tool === "mutate_portfolio") {
    return "live portfolio edit";
  }
  if (tool === "revert_agent_mutation") {
    return "reverted agent change";
  }
  return tool.replace(/^generate_/, "").replace(/_/g, " ");
}

function formatAgentActionLabel(tool: string, style?: string) {
  const action = tool.startsWith("set_")
    ? `Apply ${humanizeAgentToolName(tool)}`
    : tool.startsWith("generate_")
      ? `Generate ${humanizeAgentToolName(tool)}`
      : humanizeAgentToolName(tool);

  return style ? `${action} (${style})` : action;
}

function formatExecutionModeLabel(
  mode?: "reply" | "artifact" | "mutate" | "clarify"
) {
  if (mode === "artifact") return "Artifact";
  if (mode === "mutate") return "Live edit";
  if (mode === "clarify") return "Clarify";
  return "Reply";
}

function isRevertableArtifact(artifact?: AgentArtifact | null) {
  return Boolean(
    artifact?.meta?.executionMode === "mutate" &&
      artifact.meta?.revertable &&
      !artifact.meta?.revertedAt
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardPageFallback />}>
      <DashboardPageContent />
    </Suspense>
  );
}

function getProjectVideoOutput(artifact?: AgentArtifact | null) {
  if (!artifact || artifact.tool !== "generate_project_video") {
    return null;
  }

  const output = artifact.output as ProjectVideoArtifactOutput | undefined;
  if (output?.projectTitle) {
    return output;
  }

  const projectVideo = artifact.meta?.projectVideo;
  if (!projectVideo) {
    return null;
  }

  return {
    ...projectVideo,
    summary:
      projectVideo.status === "completed"
        ? `Generated an ${projectVideo.durationSeconds}s demo video for ${projectVideo.projectTitle}.`
        : projectVideo.status === "failed"
          ? `Video generation failed for ${projectVideo.projectTitle}.`
          : `Queued an ${projectVideo.durationSeconds}s demo video for ${projectVideo.projectTitle}.`,
  };
}

function buildAgentFocusOptions(
  profile: GeneratedProfile | null,
  evidence: EvidenceItem[]
): AgentFocusOption[] {
  const options: AgentFocusOption[] = [
    {
      value: "all",
      label: "Whole brand",
      hint: "Use the full portfolio, profile, and evidence context.",
    },
    {
      value: "theme",
      label: "Theme / UI",
      hint: "Change the public portfolio look, mood, and presentation system.",
    },
  ];

  if (profile) {
    options.push(
      {
        value: "headline",
        label: "Headline",
        hint: "Refine positioning and first-impression copy.",
      },
      {
        value: "about",
        label: "About",
        hint: "Work on the main story and narrative summary.",
      },
      {
        value: "resume",
        label: "Resume summary",
        hint: "Improve concise, recruiter-facing summary and bullets.",
      },
      {
        value: "skills",
        label: "Skills",
        hint: "Tighten how strengths and expertise are framed.",
      },
      {
        value: "projects",
        label: "Projects overview",
        hint: "Improve overall proof-of-work framing across projects.",
      },
      {
        value: "experiences",
        label: "Experience overview",
        hint: "Tighten work history, roles, and accomplishments.",
      },
      {
        value: "achievements",
        label: "Achievements",
        hint: "Sharpen awards, wins, and external proof.",
      },
      {
        value: "timeline",
        label: "Timeline",
        hint: "Work on sequencing and growth narrative.",
      }
    );

    profile.data.projects.forEach((project, index) => {
      options.push({
        value: encodeAgentFocusValue({ kind: "project", index }),
        label: `Project: ${project.title}`,
        hint: "Focus the agent on this specific project.",
      });
    });

    profile.data.experiences.forEach((experience, index) => {
      options.push({
        value: encodeAgentFocusValue({ kind: "experience", index }),
        label: `Experience: ${experience.role} @ ${experience.org}`,
        hint: "Focus the agent on this role and its outcomes.",
      });
    });

    profile.data.achievements.forEach((achievement, index) => {
      options.push({
        value: encodeAgentFocusValue({ kind: "achievement", index }),
        label: `Achievement: ${achievement.title}`,
        hint: "Focus the agent on this achievement and how to present it.",
      });
    });
  }

  evidence.slice(0, 12).forEach((item) => {
    options.push({
      value: encodeAgentFocusValue({ kind: "evidence", evidenceId: item.id }),
      label: `Evidence: ${item.title ?? item.url ?? item.type}`,
      hint: "Use this specific source as the primary evidence base.",
    });
  });

  return options;
}

// ── Timeline renderer ────────────────────────────────────────────────────────

interface TimelineEvent {
  year: string;
  title: string;
  description: string;
  category: string;
  icon?: string;
  highlight?: boolean;
}
interface TimelineOutput {
  title: string;
  subtitle?: string | null;
  events: TimelineEvent[];
  style: string;
}

function TimelineArtifact({ output }: { output: unknown }) {
  const tl = output as TimelineOutput;
  return (
    <div className="mt-3 bg-white/5 border border-white/10 rounded-xl p-4">
      <p className="font-semibold text-sm mb-0.5">{tl.title}</p>
      {tl.subtitle && <p className="text-xs text-gray-400 mb-3">{tl.subtitle}</p>}
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-white/10" />
        <div className="space-y-4">
          {tl.events?.map((ev, i) => (
            <div key={i} className="flex gap-4 pl-10 relative">
              <div className={`absolute left-1.5 top-1 w-5 h-5 rounded-full flex items-center justify-center text-xs border ${ev.highlight ? "border-[#00f5ff] bg-[#00f5ff]/20" : "border-white/20 bg-[#0d0d0d]"}`}>
                {ev.icon ?? "•"}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-mono text-[#00f5ff]">{ev.year}</span>
                  <span className="text-xs bg-white/8 px-1.5 py-0.5 rounded text-gray-400 capitalize">{ev.category}</span>
                  {ev.highlight && <Sparkles className="h-3 w-3 text-[#00f5ff]" />}
                </div>
                <p className="text-sm font-medium">{ev.title}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{ev.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Video script renderer ────────────────────────────────────────────────────

interface VideoScene {
  sceneNumber: number;
  duration: string;
  visualDirection: string;
  narration: string;
  bRoll?: string;
  textOverlay?: string;
  musicMood?: string;
}
interface VideoScriptOutput {
  title: string;
  style: string;
  totalDuration: string;
  hook: string;
  scenes: VideoScene[];
  callToAction: string;
  productionNotes?: string;
}

function VideoScriptArtifact({ output }: { output: unknown }) {
  const vs = output as VideoScriptOutput;
  return (
    <div className="mt-3 bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">{vs.title}</p>
        <span className="text-xs text-gray-500">{vs.totalDuration} · {vs.style}</span>
      </div>
      <div className="bg-[#00f5ff]/10 border border-[#00f5ff]/20 rounded-lg p-3">
        <p className="text-xs text-[#00f5ff] font-mono mb-1">HOOK (0:00-0:08)</p>
        <p className="text-sm italic">&ldquo;{vs.hook}&rdquo;</p>
      </div>
      {vs.scenes?.map((scene) => (
        <div key={scene.sceneNumber} className="border border-white/8 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-500">Scene {scene.sceneNumber}</span>
            <span className="text-xs text-gray-600">{scene.duration}</span>
            {scene.musicMood && <span className="text-xs text-purple-400">{scene.musicMood}</span>}
          </div>
          <p className="text-xs text-gray-400"><b className="text-gray-300">Visual:</b> {scene.visualDirection}</p>
          <p className="text-xs text-white leading-relaxed"><b className="text-[#00f5ff]">Narration:</b> {scene.narration}</p>
          {scene.textOverlay && <p className="text-xs text-yellow-400"><b>Overlay:</b> {scene.textOverlay}</p>}
        </div>
      ))}
      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
        <p className="text-xs text-green-400 font-mono mb-1">CALL TO ACTION</p>
        <p className="text-sm">{vs.callToAction}</p>
      </div>
      {vs.productionNotes && (
        <p className="text-xs text-gray-500 italic">{vs.productionNotes}</p>
      )}
    </div>
  );
}

// ── Tree renderer ────────────────────────────────────────────────────────────

interface TreeNode {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  level: number;
  color?: string;
  children: TreeNode[];
}
interface TreeOutput {
  title: string;
  style: string;
  root: TreeNode;
}

function TreeNodeComponent({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  return (
    <div className={depth > 0 ? "ml-5 border-l border-white/8 pl-3" : ""}>
      <button
        onClick={() => hasChildren && setOpen(!open)}
        className={`flex items-center gap-2 py-1.5 text-left w-full group ${hasChildren ? "cursor-pointer" : "cursor-default"}`}
      >
        {node.icon && <span className="text-sm flex-shrink-0">{node.icon}</span>}
        <span
          className={`text-sm font-medium px-2 py-0.5 rounded-md ${depth === 0 ? "text-base font-bold" : ""}`}
          style={node.color ? { color: node.color } : undefined}
        >
          {node.label}
        </span>
        {node.description && (
          <span className="text-xs text-gray-500 truncate hidden group-hover:inline">{node.description}</span>
        )}
        {hasChildren && (
          <span className="text-gray-600 text-xs ml-auto">{open ? "▾" : "▸"}</span>
        )}
      </button>
      {open && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeNodeComponent key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function TreeArtifact({ output }: { output: unknown }) {
  const tree = output as TreeOutput;
  return (
    <div className="mt-3 bg-white/5 border border-white/10 rounded-xl p-4">
      <p className="font-semibold text-sm mb-3">{tree.title} <span className="text-xs text-gray-500 font-normal capitalize">({tree.style})</span></p>
      {tree.root && <TreeNodeComponent node={tree.root} />}
    </div>
  );
}

function ThemeArtifact({ output }: { output: unknown }) {
  const theme = output as ThemeArtifactOutput;
  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{theme.themeLabel}</p>
          <p className="mt-1 text-xs text-gray-400">{theme.summary}</p>
        </div>
        <span className="rounded-full border border-[#00f5ff]/25 bg-[#00f5ff]/10 px-3 py-1 text-xs text-[#7ef4ff]">
          {theme.themeId}
        </span>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-gray-300">{theme.rationale}</p>
      {theme.changes?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {theme.changes.map((change) => (
            <span
              key={change}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300"
            >
              {change}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ResumeModelArtifact({ output }: { output: unknown }) {
  const resumeModel = output as ResumeModelArtifactOutput;
  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{resumeModel.modelLabel}</p>
          <p className="mt-1 text-xs text-gray-400">{resumeModel.summary}</p>
        </div>
        <span className="rounded-full border border-[#00f5ff]/25 bg-[#00f5ff]/10 px-3 py-1 text-xs text-[#7ef4ff]">
          {resumeModel.modelId}
        </span>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-gray-300">
        {resumeModel.rationale}
      </p>
      {resumeModel.changes?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {resumeModel.changes.map((change) => (
            <span
              key={change}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300"
            >
              {change}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function RegeneratedProfileArtifact({ output }: { output: unknown }) {
  const profileRefresh = output as RegeneratedProfileArtifactOutput;
  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{profileRefresh.headline}</p>
          <p className="mt-1 text-xs text-gray-400">{profileRefresh.summary}</p>
        </div>
        <span className="rounded-full border border-[#00f5ff]/25 bg-[#00f5ff]/10 px-3 py-1 text-xs text-[#7ef4ff]">
          {(profileRefresh.confidence * 100).toFixed(0)}% confidence
        </span>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-gray-300">
        {profileRefresh.resumeSummary}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
          {profileRefresh.refreshedFromEvidenceCount} evidence sources
        </span>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
          {profileRefresh.stats.projectsShipped} projects shipped
        </span>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
          {profileRefresh.stats.yearsBuilding} years building
        </span>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
          {profileRefresh.stats.competitions} competitions
        </span>
      </div>
    </div>
  );
}

function ProjectVideoArtifact({ output }: { output: unknown }) {
  const video = output as ProjectVideoArtifactOutput;
  const isFinished = video.status === "completed" && Boolean(video.videoUrl);
  const isRunning =
    video.status === "queued" || video.status === "in_progress";

  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{video.projectTitle}</p>
          <p className="mt-1 text-xs text-gray-400">{video.summary}</p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs ${
            video.status === "completed"
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
              : video.status === "failed"
                ? "border-red-400/20 bg-red-400/10 text-red-300"
                : "border-[#00f5ff]/25 bg-[#00f5ff]/10 text-[#7ef4ff]"
          }`}
        >
          {video.status.replace("_", " ")}
        </span>
      </div>

      {typeof video.progress === "number" && isRunning ? (
        <div className="mt-3">
          <div className="h-2 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-[#00f5ff]"
              style={{ width: `${Math.max(6, Math.min(100, video.progress))}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-gray-500">
            Render progress: {Math.round(video.progress)}%
          </p>
        </div>
      ) : null}

      {isFinished ? (
        <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/25">
          <video
            controls
            playsInline
            preload="metadata"
            poster={video.posterUrl ?? undefined}
            className="aspect-video w-full bg-black"
            src={video.videoUrl ?? undefined}
          />
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
          {video.durationSeconds}s
        </span>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
          {video.style}
        </span>
        {video.posterUrl ? (
          <a
            href={video.posterUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300 hover:text-white"
          >
            Poster
          </a>
        ) : null}
      </div>

      {video.error ? (
        <p className="mt-3 text-[11px] text-red-300">{video.error}</p>
      ) : null}
    </div>
  );
}

function RecrawlArtifact({ output }: { output: unknown }) {
  const recrawl = output as RecrawlArtifactOutput;
  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">
            {recrawl.title || recrawl.url}
          </p>
          <a
            href={recrawl.url}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-xs text-[#7ef4ff] hover:text-white"
          >
            {recrawl.url}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <span className="rounded-full border border-[#00f5ff]/25 bg-[#00f5ff]/10 px-3 py-1 text-xs text-[#7ef4ff]">
          {recrawl.usedExistingItem ? "updated" : "new source"}
        </span>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-gray-300">
        {recrawl.description || recrawl.summary}
      </p>
      {recrawl.headings?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {recrawl.headings.slice(0, 4).map((heading) => (
            <span
              key={heading}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300"
            >
              {heading}
            </span>
          ))}
        </div>
      ) : null}
      <p className="mt-3 text-[11px] text-gray-500">
        Screenshot {recrawl.screenshotCaptured ? "captured" : "not available"}.
      </p>
    </div>
  );
}

function MutationArtifact({
  output,
  revertable,
  onRevert,
}: {
  output: unknown;
  revertable?: boolean;
  onRevert?: (() => void) | null;
}) {
  const mutation = output as AgentMutationSummary;

  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{mutation.title}</p>
          <p className="mt-1 text-xs text-gray-400">{mutation.summary}</p>
        </div>
        {revertable && onRevert ? (
          <button
            onClick={onRevert}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-300 hover:border-[#00f5ff]/30 hover:text-white"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Revert
          </button>
        ) : null}
      </div>
      {mutation.changes?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {mutation.changes.map((change) => (
            <span
              key={change}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300"
            >
              {change}
            </span>
          ))}
        </div>
      ) : null}
      {mutation.changedFields?.length ? (
        <p className="mt-3 text-[11px] text-gray-500">
          Changed: {mutation.changedFields.join(" · ")}
        </p>
      ) : null}
    </div>
  );
}

function AgentSkillBadges({
  personaSkill,
  workflowSkill,
  executionMode,
}: {
  personaSkill?: AgentSkillSummary | null;
  workflowSkill?: AgentSkillSummary | null;
  executionMode?: "reply" | "artifact" | "mutate" | "clarify";
}) {
  if (!personaSkill && !workflowSkill && !executionMode) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {executionMode ? (
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-gray-300">
          {formatExecutionModeLabel(executionMode)}
        </span>
      ) : null}
      {personaSkill ? (
        <span className="rounded-full border border-[#00f5ff]/20 bg-[#00f5ff]/10 px-3 py-1 text-[11px] text-[#7ef4ff]">
          Expert: {personaSkill.label}
        </span>
      ) : null}
      {workflowSkill ? (
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-gray-300">
          Workflow: {workflowSkill.label}
        </span>
      ) : null}
    </div>
  );
}

function AgentStrategyCard({ strategy }: { strategy: AgentStrategy }) {
  const modeLabel = formatExecutionModeLabel(strategy.mode);
  return (
    <div className="mt-2 rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-[#00f5ff]/20 bg-[#00f5ff]/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-[#7ef4ff]">
          {modeLabel}
        </span>
        <span className="text-xs font-medium text-white">{strategy.intent}</span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-gray-400">
        {strategy.rationale}
      </p>
      {strategy.nextSteps?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {strategy.nextSteps.map((step) => (
            <span
              key={step}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-gray-300"
            >
              {step}
            </span>
          ))}
        </div>
      ) : null}
      {strategy.missingContext?.length ? (
        <p className="mt-3 text-[11px] text-yellow-300">
          Missing: {strategy.missingContext.join(" · ")}
        </p>
      ) : null}
    </div>
  );
}

function AgentClarificationCard({
  questions,
  onOptionSelect,
}: {
  questions?: AgentClarificationQuestion[];
  onOptionSelect: (answer: string) => void;
}) {
  if (!questions?.length) {
    return null;
  }

  return (
    <div className="mt-2 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-yellow-300">
        Clarification needed
      </p>
      <div className="mt-3 space-y-3">
        {questions.map((question) => (
          <div key={question.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
            <p className="text-xs font-medium text-white">
              {question.label}: {question.question}
            </p>
            {question.helpText ? (
              <p className="mt-1 text-[11px] leading-relaxed text-gray-400">
                {question.helpText}
              </p>
            ) : null}
            {question.options.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {question.options.map((option) => (
                  <button
                    key={`${question.id}-${option.label}`}
                    onClick={() => onOptionSelect(option.answer)}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-gray-200 transition-colors hover:border-[#00f5ff]/30 hover:text-[#7ef4ff]"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Artifact renderer dispatcher ─────────────────────────────────────────────

function ArtifactRenderer({
  tool,
  output,
  revertable,
  onRevert,
}: {
  tool: string;
  output: unknown;
  revertable?: boolean;
  onRevert?: (() => void) | null;
}) {
  if (tool === "generate_timeline") return <TimelineArtifact output={output} />;
  if (tool === "generate_video_script") return <VideoScriptArtifact output={output} />;
  if (tool === "generate_project_video") return <ProjectVideoArtifact output={output} />;
  if (tool === "generate_tree") return <TreeArtifact output={output} />;
  if (tool === "set_portfolio_theme") return <ThemeArtifact output={output} />;
  if (tool === "set_resume_model") return <ResumeModelArtifact output={output} />;
  if (tool === "regenerate_profile") return <RegeneratedProfileArtifact output={output} />;
  if (tool === "recrawl_url") return <RecrawlArtifact output={output} />;
  if (tool === "mutate_portfolio" || tool === "revert_agent_mutation") {
    return (
      <MutationArtifact
        output={output}
        revertable={revertable}
        onRevert={onRevert}
      />
    );
  }
  return (
    <pre className="mt-2 text-xs bg-white/5 rounded p-3 overflow-auto max-h-48">
      {JSON.stringify(output, null, 2)}
    </pre>
  );
}

// ── Action labels ─────────────────────────────────────────────────────────────

type DashboardTab =
  | "crawl"
  | "profile"
  | "usage"
  | "agent"
  | "automations"
  | "settings";

const TAB_META: Record<DashboardTab, { icon: LucideIcon; label: string }> = {
  crawl: { icon: Search, label: "Crawl" },
  profile: { icon: Sparkles, label: "Profile" },
  usage: { icon: ChartColumn, label: "Usage" },
  agent: { icon: Bot, label: "Agent" },
  automations: { icon: Clock3, label: "Automations" },
  settings: { icon: Settings, label: "Settings" },
};

const TAB_COPY: Record<
  DashboardTab,
  { eyebrow: string; title: string; summary: string }
> = {
  crawl: {
    eyebrow: "Import",
    title: "Bring proof in from the web",
    summary:
      "Collect URLs, screenshots, and source material so LifePage has real evidence to work from.",
  },
  profile: {
    eyebrow: "Profile",
    title: "Shape the public story",
    summary:
      "Review the generated headline, about section, proof, and public positioning before you publish.",
  },
  usage: {
    eyebrow: "Usage",
    title: "Track credits and model behavior",
    summary:
      "Monitor advanced credit usage, fallback behavior, and the current cycle for your account.",
  },
  agent: {
    eyebrow: "Agent",
    title: "Direct the AI like a real operator",
    summary:
      "Chat, scope the work to a specific section, and generate structured artifacts without losing context.",
  },
  automations: {
    eyebrow: "Automations",
    title: "Keep the portfolio fresh automatically",
    summary:
      "Schedule recurring crawls and regenerations so your public site stays current without manual cleanup.",
  },
  settings: {
    eyebrow: "Settings",
    title: "Tune the brand, deployment, and AI",
    summary:
      "Manage identity, billing, AI preferences, visibility, theme direction, resume models, and custom domains.",
  },
};

const ACTION_META: Record<string, { icon: LucideIcon; label: string; desc: string }> = {
  recrawl_url:           { icon: Search,       label: "Re-crawl URL",        desc: "Visits a URL and refreshes its content + screenshot" },
  regenerate_profile:    { icon: WandSparkles, label: "Regenerate Profile",  desc: "Rebuilds your full AI profile from current evidence" },
  refresh_timeline:      { icon: ChartColumn,  label: "Refresh Timeline",    desc: "Generates a fresh timeline tree from your profile" },
  refresh_video_script:  { icon: Clapperboard, label: "Refresh Video Script", desc: "Creates a new video script from your profile" },
};

const SCHEDULE_LABELS: Record<string, string> = {
  daily: "Every day",
  weekly: "Every week",
  monthly: "Every month",
};

const AGENT_TOOL_META: Array<{
  tool: string;
  icon: LucideIcon;
  label: string;
  styles: string[];
  desc: string;
}> = [
  {
    tool: "generate_timeline",
    icon: ChartColumn,
    label: "Timeline",
    styles: ["vertical", "horizontal", "documentary", "minimal"],
    desc: "Visual journey timeline",
  },
  {
    tool: "generate_video_script",
    icon: Clapperboard,
    label: "Video Script",
    styles: ["documentary", "pitch", "cinematic", "tutorial", "story"],
    desc: "Scene-by-scene script",
  },
  {
    tool: "generate_project_video",
    icon: Clapperboard,
    label: "Project Demo",
    styles: ["polished-product-demo"],
    desc: "Queue a real short demo clip for one focused project",
  },
  {
    tool: "generate_tree",
    icon: GitBranch,
    label: "Tree / Map",
    styles: ["skills", "projects", "career", "goals"],
    desc: "Interactive skill/project tree",
  },
  {
    tool: "set_portfolio_theme",
    icon: Palette,
    label: "Theme / UI",
    styles: ["custom", ...PORTFOLIO_THEME_PRESETS.map((theme) => theme.id)],
    desc: "Apply 30 portfolio models or generate a custom portfolio look",
  },
  {
    tool: "set_resume_model",
    icon: FileText,
    label: "Resume Model",
    styles: ["custom", ...RESUME_MODEL_PRESETS.map((model) => model.id)],
    desc: "Apply a structured resume model or generate a custom resume direction",
  },
  {
    tool: "regenerate_profile",
    icon: WandSparkles,
    label: "Regenerate Profile",
    styles: [],
    desc: "Rebuild the active AI profile from current visible evidence",
  },
  {
    tool: "recrawl_url",
    icon: RefreshCcw,
    label: "Re-crawl URL",
    styles: [],
    desc: "Refresh one URL source and replace stale evidence with fresh content",
  },
];

const DEFAULT_PERSONA_SKILL_OPTIONS: AgentSkillOption[] = [
  {
    id: "auto",
    label: "Auto",
    category: "persona",
    description: "Let LifeAgent choose the expert mode.",
  },
];

const DEFAULT_WORKFLOW_SKILL_OPTIONS: AgentSkillOption[] = [
  {
    id: "auto",
    label: "Auto",
    category: "workflow",
    description: "Let LifeAgent choose the workflow.",
  },
];

// ── Main dashboard ────────────────────────────────────────────────────────────

function DashboardPageFallback() {
  return (
    <div className="min-h-screen bg-[#080d10] flex items-center justify-center">
      <div className="inline-flex items-center gap-3 text-white/80">
        <LoaderCircle className="h-5 w-5 animate-spin text-[#00f5ff]" />
        <span className="animate-pulse">Loading dashboard...</span>
      </div>
    </div>
  );
}

function DashboardPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [urlInput, setUrlInput] = useState("");
  const [crawling, setCrawling] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [profile, setProfile] = useState<GeneratedProfile | null>(null);
  const [links, setLinks] = useState({
    github: "",
    linkedin: "",
    youtube: "",
    drive: "",
  });
  const [userInfo, setUserInfo] = useState({ name: "", bio: "", tags: "" });
  const [mode, setMode] = useState<"hiring" | "admissions">("hiring");
  const [visibility, setVisibility] = useState<PublicPageVisibility>("public");
  const [theme, setTheme] = useState<PortfolioThemeId>("obsidian");
  const [themeConfig, setThemeConfig] = useState<PortfolioThemeConfig | null>(null);
  const [resumeModel, setResumeModel] = useState<ResumeModelId>("executive");
  const [resumeModelConfig, setResumeModelConfig] = useState<ResumeModelConfig | null>(null);
  const [customDomain, setCustomDomain] = useState("");
  const [customDomainInput, setCustomDomainInput] = useState("");
  const [customDomainStatus, setCustomDomainStatus] =
    useState<CustomDomainStatus>("none");
  const [customDomainDnsStatus, setCustomDomainDnsStatus] =
    useState<CustomDomainDnsStatus>("not_started");
  const [customDomainVerificationName, setCustomDomainVerificationName] =
    useState("");
  const [customDomainVerificationValue, setCustomDomainVerificationValue] =
    useState("");
  const [customDomainProviderId, setCustomDomainProviderId] = useState("");
  const [customDomainProviderStatus, setCustomDomainProviderStatus] =
    useState<string | null>(null);
  const [customDomainSslStatus, setCustomDomainSslStatus] =
    useState<string | null>(null);
  const [customDomainProviderError, setCustomDomainProviderError] =
    useState<string | null>(null);
  const [customDomainLastCheckedAt, setCustomDomainLastCheckedAt] =
    useState<string | null>(null);
  const [customDomainError, setCustomDomainError] = useState<string | null>(null);
  const [customDomainDiagnostics, setCustomDomainDiagnostics] =
    useState<CustomDomainDiagnosticsSnapshot | null>(null);
  const [cloudflareSaasConfigured, setCloudflareSaasConfigured] =
    useState(true);
  const [cloudflareSaasCnameTarget, setCloudflareSaasCnameTarget] =
    useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [account, setAccount] = useState<AccountSettings | null>(null);
  const [accountNameInput, setAccountNameInput] = useState("");
  const [accountUsernameInput, setAccountUsernameInput] = useState("");
  const [publicContactInput, setPublicContactInput] = useState(
    EMPTY_PUBLIC_CONTACT_INPUT
  );
  const [savingAccount, setSavingAccount] = useState(false);
  const [billing, setBilling] = useState<BillingSnapshot | null>(null);
  const [availablePlans, setAvailablePlans] = useState<BillingPlan[]>([]);
  const [availableIntervals, setAvailableIntervals] = useState<BillingInterval[]>([
    "month",
    "year",
  ]);
  const [availableProviders, setAvailableProviders] = useState<BillingProvider[]>([]);
  const [availableUsageRates, setAvailableUsageRates] = useState<BillingUsageRate[]>([]);
  const [selectedBillingInterval, setSelectedBillingInterval] =
    useState<BillingInterval>("month");
  const [selectedAiProvider, setSelectedAiProvider] = useState<BillingProvider["id"]>("kimi");
  const [selectedAiUsageRate, setSelectedAiUsageRate] = useState<BillingUsageRate["id"]>("auto");
  const [preferredAiModelInput, setPreferredAiModelInput] = useState("");
  const [stripeConfigured, setStripeConfigured] = useState(false);
  const [updatingPlan, setUpdatingPlan] = useState(false);
  const [verifyingDomain, setVerifyingDomain] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>("crawl");
  const [message, setMessage] = useState<{
    type: "success" | "error" | "warning";
    text: string;
  } | null>(null);

  // ── Agent state ────────────────────────────────────────────────────────────
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [agentLoading, setAgentLoading] = useState(false);
  const [savedArtifacts, setSavedArtifacts] = useState<AgentArtifact[]>([]);
  const [personaSkillOptions, setPersonaSkillOptions] = useState<AgentSkillOption[]>(
    DEFAULT_PERSONA_SKILL_OPTIONS
  );
  const [workflowSkillOptions, setWorkflowSkillOptions] = useState<AgentSkillOption[]>(
    DEFAULT_WORKFLOW_SKILL_OPTIONS
  );
  const [selectedPersonaSkillId, setSelectedPersonaSkillId] = useState("auto");
  const [selectedWorkflowSkillId, setSelectedWorkflowSkillId] = useState("auto");
  const [defaultPersonaSkillId, setDefaultPersonaSkillId] = useState("auto");
  const [defaultWorkflowSkillId, setDefaultWorkflowSkillId] = useState("auto");
  const [brandVoiceInstructionInput, setBrandVoiceInstructionInput] = useState("");
  const [selectedTool, setSelectedTool] = useState<string>("");
  const [selectedStyle, setSelectedStyle] = useState<string>("");
  const [selectedFocusValue, setSelectedFocusValue] = useState("all");
  const [savingAgentPreferences, setSavingAgentPreferences] = useState(false);

  // ── Automation state ───────────────────────────────────────────────────────
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [newAutomation, setNewAutomation] = useState({
    name: "",
    action: "regenerate_profile",
    schedule: "weekly",
    scheduleTime: "09:00",
    scheduleTimezone: "UTC",
    config: {} as Record<string, unknown>,
  });
  const [showNewAutomation, setShowNewAutomation] = useState(false);
  const [runningAutomation, setRunningAutomation] = useState<string | null>(null);

  const agentFocusOptions = buildAgentFocusOptions(profile, evidence);
  const activeFocusValue = agentFocusOptions.some(
    (option) => option.value === selectedFocusValue
  )
    ? selectedFocusValue
    : "all";
  const activeFocusOption =
    agentFocusOptions.find((option) => option.value === activeFocusValue) ??
    agentFocusOptions[0];
  const activeAgentFocus = parseAgentFocusValue(
    activeFocusValue
  ) as AgentFocusSelection | null;
  const activeProjectVideoArtifacts = savedArtifacts.filter((artifact) => {
    const output = getProjectVideoOutput(artifact);
    return Boolean(
      output &&
        (output.status === "queued" || output.status === "in_progress")
    );
  });
  const activeProjectVideoPollKey = activeProjectVideoArtifacts
    .map((artifact) => {
      const output = getProjectVideoOutput(artifact);
      return `${artifact.id}:${output?.status ?? "unknown"}`;
    })
    .join("|");

  const applySettingsSnapshot = useCallback(
    (settings?: DashboardSettingsSnapshot | null) => {
      if (!settings) {
        return;
      }

      setVisibility(normalizeVisibility(settings));
      setTheme(normalizePortfolioThemeId(settings.theme));
      setThemeConfig(settings.themeConfig ?? null);
      setResumeModel(normalizeResumeModelId(settings.resumeModel));
      setResumeModelConfig(settings.resumeModelConfig ?? null);
      setMode((settings.mode as "hiring" | "admissions") ?? "hiring");
      setCustomDomain(settings.customDomain ?? "");
      setCustomDomainInput(settings.customDomain ?? "");
      setCustomDomainStatus(settings.customDomainStatus ?? "none");
      setCustomDomainDnsStatus(settings.customDomainDnsStatus ?? "not_started");
      setCustomDomainVerificationName(
        settings.customDomainVerificationName ?? ""
      );
      setCustomDomainVerificationValue(
        settings.customDomainVerificationValue ?? ""
      );
      setCustomDomainProviderId(settings.customDomainProviderId ?? "");
      setCustomDomainProviderStatus(settings.customDomainProviderStatus ?? null);
      setCustomDomainSslStatus(settings.customDomainSslStatus ?? null);
      setCustomDomainProviderError(settings.customDomainProviderError ?? null);
      setCustomDomainLastCheckedAt(settings.customDomainLastCheckedAt ?? null);
      setCustomDomainError(settings.customDomainError ?? null);
      setCustomDomainDiagnostics(settings.customDomainDiagnostics ?? null);
    },
    []
  );

  const fetchData = useCallback(async () => {
    const [ev, pr, st, arts, billingRes, accountRes, autos, agentSkillsRes] = await Promise.all([
      fetch("/api/evidence").then((r) => r.json() as Promise<ApiEvidenceResponse>),
      fetch("/api/profile").then((r) => r.json() as Promise<ApiProfileResponse>),
      fetch("/api/settings").then((r) => r.json() as Promise<ApiSettingsResponse>),
      fetch("/api/agent").then((r) => r.json() as Promise<ApiAgentResponse>),
      fetch("/api/billing").then((r) => r.json() as Promise<ApiBillingResponse>),
      fetch("/api/account").then((r) => r.json() as Promise<ApiAccountResponse>),
      fetch("/api/automations").then((r) => r.json() as Promise<ApiAutomationResponse>),
      fetch("/api/agent/skills").then((r) => r.json() as Promise<ApiAgentSkillsResponse>),
    ]);
    setEvidence(ev.items ?? []);
    if (pr.profile) setProfile(pr.profile);
    applySettingsSnapshot(st.settings);
    setCloudflareSaasConfigured(st.cloudflareSaasConfigured !== false);
    setCloudflareSaasCnameTarget(st.cloudflareSaasCnameTarget ?? null);
    setSavedArtifacts(arts.artifacts ?? []);
    setBilling(billingRes.billing ?? null);
    setAvailablePlans(billingRes.plans ?? []);
    setAvailableIntervals(billingRes.intervals ?? ["month", "year"]);
    setAvailableProviders(billingRes.providers ?? []);
    setAvailableUsageRates(billingRes.usageRates ?? []);
    setStripeConfigured(Boolean(billingRes.stripeConfigured));
    setSelectedBillingInterval(billingRes.billing?.billingInterval ?? "month");
    setSelectedAiProvider(billingRes.billing?.aiProvider ?? "kimi");
    setSelectedAiUsageRate(billingRes.billing?.aiUsageRate ?? "auto");
    setPreferredAiModelInput(billingRes.billing?.preferredAiModel ?? "");
    setAccount(accountRes.account ?? null);
    setAccountNameInput(accountRes.account?.name ?? "");
    setAccountUsernameInput(accountRes.account?.username ?? "");
    setPublicContactInput({
      location: accountRes.account?.profile?.location ?? "",
      website: accountRes.account?.profile?.website ?? "",
      github: accountRes.account?.profile?.github ?? "",
      linkedin: accountRes.account?.profile?.linkedin ?? "",
      youtube: accountRes.account?.profile?.youtube ?? "",
      contactEmail: accountRes.account?.profile?.contactEmail ?? "",
      phone: accountRes.account?.profile?.phone ?? "",
      contactNote: accountRes.account?.profile?.contactNote ?? "",
    });
    setLinks((current) => ({
      ...current,
      github: accountRes.account?.profile?.github ?? "",
      linkedin: accountRes.account?.profile?.linkedin ?? "",
      youtube: accountRes.account?.profile?.youtube ?? "",
    }));
    setUserInfo((current) => ({
      ...current,
      name: accountRes.account?.name ?? current.name,
    }));
    const savedPersona = accountRes.account?.agentPreferences?.pinnedPersonaSkillId ?? "auto";
    const savedWorkflow = accountRes.account?.agentPreferences?.pinnedWorkflowSkillId ?? "auto";
    setDefaultPersonaSkillId(savedPersona);
    setDefaultWorkflowSkillId(savedWorkflow);
    setSelectedPersonaSkillId(savedPersona);
    setSelectedWorkflowSkillId(savedWorkflow);
    setBrandVoiceInstructionInput(
      accountRes.account?.agentPreferences?.brandVoiceInstruction ?? ""
    );
    setAutomations(autos.automations ?? []);
    setPersonaSkillOptions(
      agentSkillsRes.personaSkills ?? DEFAULT_PERSONA_SKILL_OPTIONS
    );
    setWorkflowSkillOptions(
      agentSkillsRes.workflowSkills ?? DEFAULT_WORKFLOW_SKILL_OPTIONS
    );
  }, [applySettingsSnapshot]);

  const saveSettings = async (patch: {
    visibility?: PublicPageVisibility;
    theme?: PortfolioThemeId;
    themeConfig?: PortfolioThemeConfig | null;
    resumeModel?: ResumeModelId;
    resumeModelConfig?: ResumeModelConfig | null;
    mode?: string;
    customDomain?: string | null;
  }) => {
    setSavingSettings(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = (await res.json()) as ApiSettingsResponse;
      setCloudflareSaasConfigured(data.cloudflareSaasConfigured !== false);
      setCloudflareSaasCnameTarget(data.cloudflareSaasCnameTarget ?? null);
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to save settings.");
      }
      applySettingsSnapshot(data.settings);
      setMessage({
        type: data.warning ? "warning" : "success",
        text: data.warning ?? "Settings saved.",
      });
      return data;
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to save settings.",
      });
      return null;
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSetVisibility = (value: PublicPageVisibility) => {
    setVisibility(value);
    saveSettings({ visibility: value }).catch(() => {
      // Error already handled and shown via setMessage inside saveSettings
    });
  };

  const handleSetTheme = (value: PortfolioThemeId) => {
    setTheme(value);
    setThemeConfig(null);
    saveSettings({ theme: value, themeConfig: null }).catch(() => {
      // Error already handled and shown via setMessage inside saveSettings
    });
  };

  const handleSetResumeModel = (value: ResumeModelId) => {
    setResumeModel(value);
    setResumeModelConfig(null);
    saveSettings({ resumeModel: value, resumeModelConfig: null }).catch(() => {
      // Error already handled and shown via setMessage inside saveSettings
    });
  };

  const handleSetMode = (value: "hiring" | "admissions") => {
    setMode(value);
    saveSettings({ mode: value }).catch(() => {
      // Error already handled and shown via setMessage inside saveSettings
    });
  };

  const handleStartCheckout = async (
    planTier: Exclude<BillingPlan["id"], "free">,
    interval: BillingInterval
  ) => {
    setUpdatingPlan(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planTier, interval }),
      });
      const data = (await res.json()) as {
        url?: string;
        checkoutUrl?: string;
        error?: string;
      };
      const checkoutUrl = data.checkoutUrl ?? data.url;
      if (!res.ok || !checkoutUrl) {
        throw new Error(data.error ?? "Failed to start checkout.");
      }
      window.location.href = checkoutUrl;
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "Failed to start checkout.",
      });
    } finally {
      setUpdatingPlan(false);
    }
  };

  const handleOpenBillingPortal = async () => {
    setUpdatingPlan(true);
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
      });
      const data = (await res.json()) as {
        url?: string;
        portalUrl?: string;
        error?: string;
      };
      const portalUrl = data.portalUrl ?? data.url;
      if (!res.ok || !portalUrl) {
        throw new Error(data.error ?? "Failed to open billing portal.");
      }
      window.location.href = portalUrl;
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to open billing portal.",
      });
    } finally {
      setUpdatingPlan(false);
    }
  };

  const handleSaveAiPreferences = async () => {
    const normalizedPreferredModel =
      selectedAiProvider === "auto"
        ? "auto"
        : preferredAiModelInput.trim() || null;

    setUpdatingPlan(true);
    try {
      const res = await fetch("/api/billing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aiProvider: selectedAiProvider,
          preferredAiModel: normalizedPreferredModel,
          aiUsageRate: selectedAiUsageRate,
        }),
      });
      const data = (await res.json()) as ApiBillingResponse;
      if (!res.ok || !data.billing) {
        throw new Error(data.error ?? "Failed to save AI preferences.");
      }
      setBilling(data.billing);
      setAvailablePlans(data.plans ?? availablePlans);
      setAvailableIntervals(data.intervals ?? availableIntervals);
      setAvailableProviders(data.providers ?? availableProviders);
      setAvailableUsageRates(data.usageRates ?? availableUsageRates);
      setStripeConfigured(
        data.stripeConfigured !== undefined ? data.stripeConfigured : stripeConfigured
      );
      setSelectedAiProvider(data.billing.aiProvider);
      setSelectedAiUsageRate(data.billing.aiUsageRate);
      setPreferredAiModelInput(data.billing.preferredAiModel ?? "");
      setMessage({
        type: "success",
        text: "AI provider settings saved.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to save AI preferences.",
      });
    } finally {
      setUpdatingPlan(false);
    }
  };

  const handleSaveCustomDomain = async () => {
    const result = await saveSettings({
      customDomain: customDomainInput.trim() || null,
    });

    if (result?.settings?.customDomain && !result.warning) {
      setMessage({
        type: "success",
        text:
          "Custom domain saved and provisioned in Cloudflare. Point DNS to the CNAME target below, then verify to refresh status.",
      });
    }
  };

  const handleClearCustomDomain = async () => {
    await saveSettings({ customDomain: null });
  };

  const handleVerifyCustomDomain = async () => {
    setVerifyingDomain(true);
    try {
      const res = await fetch("/api/settings/domain/verify", {
        method: "POST",
      });
      const data = (await res.json()) as ApiSettingsResponse;
      setCloudflareSaasConfigured(data.cloudflareSaasConfigured !== false);
      setCloudflareSaasCnameTarget(data.cloudflareSaasCnameTarget ?? null);
      if (!res.ok || !data.settings) {
        throw new Error(data.error ?? "Failed to verify the custom domain.");
      }
      applySettingsSnapshot(data.settings);
      setMessage({
        type: data.verified ? "success" : data.warning ? "warning" : "error",
        text: data.verified
          ? data.settings.customDomainStatus === "active"
            ? "DNS and Cloudflare certificate validation are complete. The domain is active."
            : "DNS looks correct. Cloudflare validation was refreshed and the domain is waiting on certificate activation."
          : data.warning ?? data.error ?? "DNS does not match the required target yet.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to verify the custom domain.",
      });
    } finally {
      setVerifyingDomain(false);
    }
  };

  const handleSaveAccount = async () => {
    const normalizedName = accountNameInput.trim();
    const normalizedUsername = accountUsernameInput.trim().toLowerCase();
    const payload: {
      name?: string | null;
      username?: string;
      profile?: {
        location?: string | null;
        website?: string | null;
        github?: string | null;
        linkedin?: string | null;
        youtube?: string | null;
        contactEmail?: string | null;
        phone?: string | null;
        contactNote?: string | null;
      };
    } = {};

    if (normalizedName !== (account?.name ?? "")) {
      payload.name = normalizedName || null;
    }
    if (normalizedUsername !== (account?.username ?? "")) {
      if (!normalizedUsername) {
        setMessage({ type: "error", text: "Username is required." });
        return;
      }
      payload.username = normalizedUsername;
    }

    const normalizedProfile = {
      location: normalizeOptionalFormValue(publicContactInput.location),
      website: normalizeOptionalFormValue(publicContactInput.website),
      github: normalizeOptionalFormValue(publicContactInput.github),
      linkedin: normalizeOptionalFormValue(publicContactInput.linkedin),
      youtube: normalizeOptionalFormValue(publicContactInput.youtube),
      contactEmail: normalizeOptionalFormValue(publicContactInput.contactEmail),
      phone: normalizeOptionalFormValue(publicContactInput.phone),
      contactNote: normalizeOptionalFormValue(publicContactInput.contactNote),
    };
    const currentProfile = {
      location: account?.profile?.location ?? null,
      website: account?.profile?.website ?? null,
      github: account?.profile?.github ?? null,
      linkedin: account?.profile?.linkedin ?? null,
      youtube: account?.profile?.youtube ?? null,
      contactEmail: account?.profile?.contactEmail ?? null,
      phone: account?.profile?.phone ?? null,
      contactNote: account?.profile?.contactNote ?? null,
    };
    const profilePatch = Object.fromEntries(
      Object.entries(normalizedProfile).filter(([key, value]) => {
        return currentProfile[key as keyof typeof currentProfile] !== value;
      })
    ) as NonNullable<typeof payload.profile>;
    if (Object.keys(profilePatch).length > 0) {
      payload.profile = profilePatch;
    }

    if (Object.keys(payload).length === 0) {
      return;
    }

    setSavingAccount(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as ApiAccountResponse;
      if (!res.ok || !data.account) {
        throw new Error(data.error ?? "Failed to save personal info.");
      }

      setAccount(data.account);
      setAccountNameInput(data.account.name ?? "");
      setAccountUsernameInput(data.account.username ?? "");
      setPublicContactInput({
        location: data.account.profile?.location ?? "",
        website: data.account.profile?.website ?? "",
        github: data.account.profile?.github ?? "",
        linkedin: data.account.profile?.linkedin ?? "",
        youtube: data.account.profile?.youtube ?? "",
        contactEmail: data.account.profile?.contactEmail ?? "",
        phone: data.account.profile?.phone ?? "",
        contactNote: data.account.profile?.contactNote ?? "",
      });
      setLinks((current) => ({
        ...current,
        github: data.account?.profile?.github ?? "",
        linkedin: data.account?.profile?.linkedin ?? "",
        youtube: data.account?.profile?.youtube ?? "",
      }));
      setMessage({ type: "success", text: "Personal info saved." });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to save personal info.",
      });
    } finally {
      setSavingAccount(false);
    }
  };

  const handleSaveAgentPreferences = async () => {
    setSavingAgentPreferences(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentPreferences: {
            pinnedPersonaSkillId:
              defaultPersonaSkillId === "auto" ? null : defaultPersonaSkillId,
            pinnedWorkflowSkillId:
              defaultWorkflowSkillId === "auto" ? null : defaultWorkflowSkillId,
            brandVoiceInstruction:
              brandVoiceInstructionInput.trim() || null,
          },
        }),
      });
      const data = (await res.json()) as ApiAccountResponse;
      if (!res.ok || !data.account) {
        throw new Error(data.error ?? "Failed to save agent defaults.");
      }

      setAccount(data.account);
      setDefaultPersonaSkillId(
        data.account.agentPreferences?.pinnedPersonaSkillId ?? "auto"
      );
      setDefaultWorkflowSkillId(
        data.account.agentPreferences?.pinnedWorkflowSkillId ?? "auto"
      );
      setBrandVoiceInstructionInput(
        data.account.agentPreferences?.brandVoiceInstruction ?? ""
      );
      setMessage({ type: "success", text: "Agent defaults saved." });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to save agent defaults.",
      });
    } finally {
      setSavingAgentPreferences(false);
    }
  };

  const handleRevertAgentArtifact = async (artifactId: string) => {
    setAgentLoading(true);
    try {
      const res = await fetch("/api/agent/revert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artifactId }),
      });
      const data = (await res.json()) as ApiAgentResponse & {
        reply?: string;
        profile?: GeneratedProfile["data"] | null;
        settings?: ApiAgentResponse["settings"];
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to revert agent change.");
      }

      if (data.billing) setBilling(data.billing);
      if (data.profile) {
        setProfile((current) =>
          current
            ? { ...current, data: data.profile! }
            : {
                id: crypto.randomUUID(),
                data: data.profile!,
                createdAt: new Date().toISOString(),
              }
        );
      }
      if (data.settings) {
        setVisibility(data.settings.visibility);
        setMode(data.settings.mode);
        setTheme(normalizePortfolioThemeId(data.settings.theme));
        setThemeConfig(data.settings.themeConfig ?? null);
        setResumeModel(normalizeResumeModelId(data.settings.resumeModel));
        setResumeModelConfig(data.settings.resumeModelConfig ?? null);
      }

      setChatHistory((current) => [
        ...current,
        {
          role: "assistant",
          content: data.reply ?? "Reverted the selected agent change.",
          tool: "revert_agent_mutation",
          output: data.mutationSummary,
          executionMode: "mutate",
          mutationSummary: data.mutationSummary ?? null,
          revertable: false,
        },
      ]);

      const arts = await fetch("/api/agent").then((r) => r.json() as Promise<ApiAgentResponse>);
      setSavedArtifacts(arts.artifacts ?? []);
      setMessage({ type: "success", text: data.reply ?? "Agent change reverted." });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to revert agent change.",
      });
    } finally {
      setAgentLoading(false);
    }
  };

  const openSettingsSection = (sectionId: string) => {
    setActiveTab("settings");
    window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  };

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      fetchData();
    }
  }, [status, router, fetchData]);

  useEffect(() => {
    const billingState = searchParams.get("billing");
    if (!billingState) {
      return;
    }

    setActiveTab("settings");
    if (billingState === "success") {
      setMessage({
        type: "success",
        text: "Payment completed. Stripe will update your plan as soon as the webhook sync finishes.",
      });
    } else if (billingState === "canceled") {
      setMessage({
        type: "error",
        text: "Checkout was canceled. Your plan has not changed.",
      });
    }

    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.delete("billing");
    window.history.replaceState({}, "", nextUrl.toString());
  }, [searchParams]);

  useEffect(() => {
    const browserTimeZone =
      Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    setNewAutomation((current) =>
      current.scheduleTimezone === "UTC"
        ? { ...current, scheduleTimezone: browserTimeZone }
        : current
    );
  }, []);

  useEffect(() => {
    if (!activeProjectVideoArtifacts.length) {
      return;
    }

    const poll = async () => {
      const results = await Promise.all(
        activeProjectVideoArtifacts.map((artifact) =>
          fetch(`/api/project-videos/${artifact.id}`)
            .then((r) => r.json() as Promise<ApiProjectVideoResponse>)
            .then((data) => ({ artifactId: artifact.id, data }))
            .catch(() => null)
        )
      );

      let shouldRefreshArtifacts = false;
      for (const result of results) {
        if (!result?.data?.output) continue;
        shouldRefreshArtifacts = true;
        if (result.data.billing) {
          setBilling(result.data.billing);
        }
        if (result.data.profile) {
          setProfile((current) =>
            current
              ? { ...current, data: result.data.profile! }
              : {
                  id: crypto.randomUUID(),
                  data: result.data.profile!,
                  createdAt: new Date().toISOString(),
                }
          );
        }
      }

      if (shouldRefreshArtifacts) {
        const arts = await fetch("/api/agent").then(
          (r) => r.json() as Promise<ApiAgentResponse>
        );
        setSavedArtifacts(arts.artifacts ?? []);
      }
    };

    const intervalId = window.setInterval(poll, 8000);
    void poll();
    return () => window.clearInterval(intervalId);
  }, [activeProjectVideoArtifacts, activeProjectVideoPollKey]);

  // ── Agent handlers ──────────────────────────────────────────────────────────

  const sendAgentMessage = async (messageOverride?: string) => {
    if (!messageOverride?.trim() && !chatInput.trim() && !selectedTool) return;
    const focusLabel =
      activeFocusValue === "all" ? undefined : activeFocusOption?.label;
    const userMsg =
      messageOverride?.trim() ||
      chatInput.trim() ||
      `${formatAgentActionLabel(selectedTool, selectedStyle)}${
        focusLabel ? ` for ${focusLabel}` : ""
      }`;
    let shouldResetSelectedTool = true;
    setAgentLoading(true);
    setChatInput("");

    const newHistory: ChatMessage[] = [
      ...chatHistory,
      {
        role: "user",
        content: userMsg,
        focusLabel,
        resolvedPersonaSkill:
          selectedPersonaSkillId === "auto" ? null : selectedPersonaSkill,
        resolvedWorkflowSkill:
          selectedWorkflowSkillId === "auto" ? null : selectedWorkflowSkill,
      },
    ];
    setChatHistory(newHistory);

    try {
      const body: Record<string, unknown> = {
        message: userMsg,
        history: chatHistory.map(({ role, content }) => ({ role, content })),
      };
      if (activeAgentFocus) {
        body.focus = activeAgentFocus;
      }
      if (selectedTool) {
        body.tool = selectedTool;
        body.style = selectedStyle;
      }
      if (selectedPersonaSkillId !== "auto") {
        body.personaSkillId = selectedPersonaSkillId;
      }
      if (selectedWorkflowSkillId !== "auto") {
        body.workflowSkillId = selectedWorkflowSkillId;
      }

      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as ApiAgentResponse;
      if (!res.ok) throw new Error(data.error ?? "Agent error");
      if (data.billing) setBilling(data.billing);
      if (data.executionMode === "clarify") {
        shouldResetSelectedTool = false;
      }
      if (data.tool === "set_portfolio_theme" && data.output) {
        const themeOutput = data.output as ThemeArtifactOutput;
        setTheme(themeOutput.themeId);
        setThemeConfig(themeOutput.themeConfig ?? null);
      } else if (data.tool === "set_resume_model" && data.output) {
        const resumeModelOutput = data.output as ResumeModelArtifactOutput;
        setResumeModel(normalizeResumeModelId(resumeModelOutput.modelId));
        setResumeModelConfig(resumeModelOutput.modelConfig ?? null);
      } else if (data.tool === "regenerate_profile" && data.output) {
        const refreshed = data.output as RegeneratedProfileArtifactOutput;
        if (refreshed.profile) {
          setProfile((current) =>
            current
              ? { ...current, data: refreshed.profile! }
              : {
                  id: crypto.randomUUID(),
                  data: refreshed.profile!,
                  createdAt: new Date().toISOString(),
                }
          );
        }
      }

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content:
          data.reply ??
          (data.type === "tool_result"
            ? `${formatAgentActionLabel(data.tool ?? "", data.style)}${
                data.focusLabel ? ` for ${data.focusLabel}` : ""
              }`
            : ""),
        tool: data.tool,
        style: data.style,
        output: data.output,
        artifactId: data.artifactId,
        focusLabel: data.focusLabel,
        strategy: data.strategy,
        executionMode: data.executionMode,
        resolvedPersonaSkill: data.resolvedPersonaSkill ?? null,
        resolvedWorkflowSkill: data.resolvedWorkflowSkill ?? null,
        mutationSummary: data.mutationSummary ?? null,
        revertable: data.revertable ?? false,
        clarificationQuestions: data.clarificationQuestions ?? [],
      };
      setChatHistory([...newHistory, assistantMsg]);

      if (data.executionMode === "mutate") {
        if (data.profile) {
          setProfile((current) =>
            current
              ? { ...current, data: data.profile! }
              : {
                  id: crypto.randomUUID(),
                  data: data.profile!,
                  createdAt: new Date().toISOString(),
                }
          );
        }
        if (data.settings) {
          setVisibility(data.settings.visibility);
          setMode(data.settings.mode);
          setTheme(normalizePortfolioThemeId(data.settings.theme));
          setThemeConfig(data.settings.themeConfig ?? null);
          setResumeModel(normalizeResumeModelId(data.settings.resumeModel));
          setResumeModelConfig(data.settings.resumeModelConfig ?? null);
        }
        const arts = await fetch("/api/agent").then((r) => r.json() as Promise<ApiAgentResponse>);
        setSavedArtifacts(arts.artifacts ?? []);
      } else if (data.tool === "recrawl_url" || data.tool === "regenerate_profile") {
        await fetchData();
      } else if (data.artifactId) {
        // Refresh saved artifacts
        const arts = await fetch("/api/agent").then((r) => r.json() as Promise<ApiAgentResponse>);
        setSavedArtifacts(arts.artifacts ?? []);
      }
    } catch (err) {
      setChatHistory([...newHistory, { role: "assistant", content: `Error: ${String(err)}` }]);
    } finally {
      setAgentLoading(false);
      if (shouldResetSelectedTool) {
        setSelectedTool("");
        setSelectedStyle("");
      }
    }
  };

  const handleAgentChat = async () => {
    await sendAgentMessage();
  };

  // ── Automation handlers ────────────────────────────────────────────────────

  const handleCreateAutomation = async () => {
    if (!newAutomation.name.trim()) return;
    try {
      const res = await fetch("/api/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAutomation),
      });
      const data = (await res.json()) as ApiAutomationResponse;
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setAutomations((prev) => [data.automation!, ...prev]);
      setShowNewAutomation(false);
      setNewAutomation((current) => ({
        name: "",
        action: "regenerate_profile",
        schedule: "weekly",
        scheduleTime: current.scheduleTime,
        scheduleTimezone: current.scheduleTimezone,
        config: {},
      }));
      setMessage({ type: "success", text: "Automation created!" });
    } catch (err) {
      setMessage({ type: "error", text: String(err) });
    }
  };

  const handleToggleAutomation = async (id: string, enabled: boolean) => {
    await fetch(`/api/automations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    setAutomations((prev) => prev.map((a) => (a.id === id ? { ...a, enabled } : a)));
  };

  const handleDeleteAutomation = async (id: string) => {
    await fetch(`/api/automations/${id}`, { method: "DELETE" });
    setAutomations((prev) => prev.filter((a) => a.id !== id));
  };

  const handleRunAutomation = async (id: string) => {
    setRunningAutomation(id);
    try {
      const res = await fetch(`/api/automations/run?id=${id}`, { method: "POST" });
      const data = (await res.json()) as { ok: boolean; message: string };
      setMessage({ type: data.ok ? "success" : "error", text: data.message });
      await fetchData();
    } catch (err) {
      setMessage({ type: "error", text: String(err) });
    } finally {
      setRunningAutomation(null);
    }
  };

  const handleCrawl = async () => {
    const requestedUrls = splitCrawlInput(urlInput);
    if (requestedUrls.length === 0) {
      setMessage({
        type: "error",
        text: "Paste at least one URL to import. A homepage, GitHub profile, or project page is the best first step.",
      });
      return;
    }

    setCrawling(true);
    setMessage(null);
    try {
      const res = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: requestedUrls }),
      });
      const data = (await res.json()) as ApiCrawlResponse;
      const crawledItems = data.items ?? (data.item ? [data.item] : []);
      const failedResults = (data.results ?? []).filter((result) => result.error);

      if (!res.ok && crawledItems.length === 0) {
        throw new Error(data.error ?? "Crawl failed");
      }

      const successText =
        crawledItems.length === 1
          ? `Imported ${crawledItems[0]?.title ?? requestedUrls[0]}`
          : `Imported ${crawledItems.length} sources`;
      const failureText =
        failedResults.length > 0
          ? ` ${failedResults.length} source${failedResults.length === 1 ? "" : "s"} still need attention.`
          : "";

      setMessage({
        type: "success",
        text: `${successText}.${failureText} Review the imported proof below, then generate the profile.`,
      });
      setUrlInput("");
      await fetchData();
    } catch (err) {
      setMessage({
        type: "error",
        text: formatUiError(
          err,
          "LifePage could not import those sources yet. Check that the URLs are public and try again."
        ),
      });
    } finally {
      setCrawling(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setMessage(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ links, userInfo }),
      });
      const data = (await res.json()) as ApiGenerateResponse;
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      if (data.profile) setProfile(data.profile);
      if (data.billing) setBilling(data.billing);
      setMessage({
        type: "success",
        text: "Profile generated. Review the public page and resume view next.",
      });
      setActiveTab("profile");
    } catch (err) {
      setMessage({
        type: "error",
        text: formatUiError(
          err,
          "Profile generation failed. Check your evidence and try again."
        ),
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateProjectVideo = async (projectIndex: number) => {
    setMessage(null);
    setAgentLoading(true);
    try {
      const res = await fetch("/api/project-videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectIndex, durationSeconds: 8 }),
      });
      const data = (await res.json()) as ApiProjectVideoResponse;
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to queue project demo video.");
      }
      if (data.billing) {
        setBilling(data.billing);
      }

      const arts = await fetch("/api/agent").then(
        (r) => r.json() as Promise<ApiAgentResponse>
      );
      setSavedArtifacts(arts.artifacts ?? []);
      setMessage({
        type: "success",
        text:
          data.output?.summary ??
          "Queued a new project demo video. It will attach automatically when the render finishes.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to queue project demo video.",
      });
    } finally {
      setAgentLoading(false);
    }
  };

  const toggleVisibility = async (id: string, visible: boolean) => {
    await fetch(`/api/evidence/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visible }),
    });
    setEvidence((prev) =>
      prev.map((e) => (e.id === id ? { ...e, visible } : e))
    );
  };

  const deleteEvidence = async (id: string) => {
    await fetch(`/api/evidence/${id}`, { method: "DELETE" });
    setEvidence((prev) => prev.filter((e) => e.id !== id));
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#080d10] px-6 py-10 text-white">
        <div className="mx-auto max-w-5xl animate-pulse space-y-6">
          <div className="h-8 w-48 rounded-full bg-white/8" />
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.12fr)_minmax(280px,0.88fr)]">
            <div className="h-40 rounded-[1.75rem] border border-white/10 bg-white/5" />
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="h-28 rounded-[1.5rem] border border-white/10 bg-white/5" />
              <div className="h-28 rounded-[1.5rem] border border-white/10 bg-white/5" />
              <div className="h-28 rounded-[1.5rem] border border-white/10 bg-white/5" />
            </div>
          </div>
          <div className="h-12 w-96 rounded-xl bg-white/5" />
          <div className="h-72 rounded-[1.75rem] border border-white/10 bg-white/5" />
        </div>
      </div>
    );
  }

  const username =
    account?.username ??
    session?.user?.username ??
    session?.user?.email?.split("@")[0];
  const normalizedCustomDomainInput = customDomainInput.trim().toLowerCase();
  const hasCustomDomainChanges = normalizedCustomDomainInput !== customDomain;
  const customDomainTargetHost =
    customDomainVerificationValue || cloudflareSaasCnameTarget || "";
  const hasSavedCustomDomain = customDomain.length > 0;
  const hasActiveCustomDomain = customDomainStatus === "active";
  const customDomainLabelCount = normalizedCustomDomainInput
    .split(".")
    .filter(Boolean).length;
  const inputLooksLikeApexCandidate =
    normalizedCustomDomainInput.length > 0 &&
    !normalizedCustomDomainInput.includes("/") &&
    customDomainLabelCount === 2;
  const canVerifyCustomDomain =
    hasSavedCustomDomain &&
    !hasCustomDomainChanges &&
    customDomainStatus !== "active" &&
    cloudflareSaasConfigured &&
    Boolean(customDomainTargetHost);
  const customDomainVerifyLabel = !cloudflareSaasConfigured
    ? "Provider setup required"
    : verifyingDomain
      ? "Verifying…"
      : "Verify DNS";
  const customDomainLastCheckedLabel = customDomainLastCheckedAt
    ? new Date(customDomainLastCheckedAt).toLocaleString()
    : null;
  const customDomainTroubleshootingItems = getCustomDomainTroubleshootingItems({
    cloudflareSaasConfigured,
    customDomain: normalizedCustomDomainInput || customDomain,
    customDomainTargetHost,
    customDomainStatus,
    customDomainDnsStatus,
    customDomainProviderStatus,
    customDomainSslStatus,
    customDomainError,
    diagnostics: customDomainDiagnostics,
  });
  const billingIntervalForCards = selectedBillingInterval;
  const hasYearlyBillingOption = availableIntervals.includes("year");
  const activePlanPriceSuffix = formatPlanIntervalSuffix(billingIntervalForCards);
  const nextRenewalDate = billing?.subscriptionCurrentPeriodEnd
    ? new Date(billing.subscriptionCurrentPeriodEnd).toLocaleDateString()
    : null;
  const billingSyncedAt = billing?.billingSyncedAt
    ? new Date(billing.billingSyncedAt).toLocaleString()
    : null;
  const selectedProviderDef =
    availableProviders.find((provider) => provider.id === selectedAiProvider) ??
    availableProviders[0] ??
    null;
  const selectedProviderModelOptions = getProviderModelOptions(selectedAiProvider);
  const selectedModelPresetValue =
    selectedAiProvider === "auto"
      ? "auto"
      : !preferredAiModelInput
        ? ""
        : selectedProviderModelOptions.some(
              (option) => option.value === preferredAiModelInput
            )
          ? preferredAiModelInput
          : "__custom__";
  const selectedUsageRateDef =
    availableUsageRates.find((rate) => rate.id === selectedAiUsageRate) ??
    availableUsageRates[0] ??
    null;
  const selectedPersonaSkill =
    personaSkillOptions.find((skill) => skill.id === selectedPersonaSkillId) ?? null;
  const selectedWorkflowSkill =
    workflowSkillOptions.find((skill) => skill.id === selectedWorkflowSkillId) ?? null;
  const normalizedPreferredAiModelInput =
    selectedAiProvider === "auto" ? "auto" : preferredAiModelInput;
  const aiPreferencesDirty =
    billing != null &&
    (selectedAiProvider !== billing.aiProvider ||
      selectedAiUsageRate !== billing.aiUsageRate ||
      normalizedPreferredAiModelInput !== (billing.preferredAiModel ?? ""));
  const accountDirty =
    (accountNameInput.trim() || "") !== (account?.name ?? "") ||
    accountUsernameInput.trim().toLowerCase() !== (account?.username ?? "") ||
    normalizeOptionalFormValue(publicContactInput.location) !==
      (account?.profile?.location ?? null) ||
    normalizeOptionalFormValue(publicContactInput.website) !==
      (account?.profile?.website ?? null) ||
    normalizeOptionalFormValue(publicContactInput.github) !==
      (account?.profile?.github ?? null) ||
    normalizeOptionalFormValue(publicContactInput.linkedin) !==
      (account?.profile?.linkedin ?? null) ||
    normalizeOptionalFormValue(publicContactInput.youtube) !==
      (account?.profile?.youtube ?? null) ||
    normalizeOptionalFormValue(publicContactInput.contactEmail) !==
      (account?.profile?.contactEmail ?? null) ||
    normalizeOptionalFormValue(publicContactInput.phone) !==
      (account?.profile?.phone ?? null) ||
    normalizeOptionalFormValue(publicContactInput.contactNote) !==
      (account?.profile?.contactNote ?? null);
  const agentPreferencesDirty =
    defaultPersonaSkillId !==
      (account?.agentPreferences?.pinnedPersonaSkillId ?? "auto") ||
    defaultWorkflowSkillId !==
      (account?.agentPreferences?.pinnedWorkflowSkillId ?? "auto") ||
    brandVoiceInstructionInput.trim() !==
      (account?.agentPreferences?.brandVoiceInstruction ?? "");
  const advancedCreditsCap = billing?.plan.monthlyAdvancedCredits ?? null;
  const advancedCreditsUsed = billing?.advancedCreditsUsed ?? 0;
  const advancedCreditsRemaining = billing?.advancedCreditsRemaining ?? null;
  const advancedCreditsProgress = advancedCreditsCap
    ? Math.max(
        0,
        Math.min(100, (advancedCreditsUsed / Math.max(1, advancedCreditsCap)) * 100)
      )
    : 0;
  const activeChatModel = billing
    ? billing.fallbackToStandard
      ? billing.standardModel
      : billing.advancedModel
    : null;
  const activeChatModelLabel = billing
    ? `${billing.provider.label} · ${activeChatModel}`
    : null;
  const latestClarificationMessage = [...chatHistory]
    .reverse()
    .find(
      (message) =>
        message.role === "assistant" &&
        message.executionMode === "clarify" &&
        message.clarificationQuestions?.length
    );
  const chatInputPlaceholder = latestClarificationMessage
    ? "Answer the agent's clarification so it can continue…"
    : activeFocusValue === "all"
      ? "Ask anything or say 'create a skills tree'…"
      : `Ask about ${activeFocusOption.label.toLowerCase()}…`;
  const activeTabCopy = TAB_COPY[activeTab];
  const publishStatusLabel =
    visibility === "public"
      ? "Public"
      : visibility === "unlisted"
        ? "Link-only"
        : "Private";
  const profileStatusLabel = profile
    ? "Generated"
    : evidence.length > 0
      ? "Ready to generate"
      : "Waiting for proof";
  const isFirstRun = evidence.length === 0 && !profile;
  const canGenerateProfile = generating || evidence.length > 0 || Boolean(userInfo.bio.trim());
  const onboardingSteps = [
    {
      title: "Add 2-3 strong URLs",
      description: "Start with a homepage, repo, or proof-heavy project page.",
      done: evidence.length > 0 || urlInput.trim().length > 0,
    },
    {
      title: "Review imported evidence",
      description: "Keep what is useful, hide the noise, and make sure screenshots landed.",
      done: evidence.length > 0,
    },
    {
      title: "Generate the public page",
      description: "LifePage turns the evidence into a headline, projects, and resume view.",
      done: Boolean(profile),
    },
  ];

  return (
    <div className="min-h-screen bg-[#080d10] text-white"
      style={{
        backgroundImage: "radial-gradient(circle at 15% 15%, rgba(0,245,255,0.06), transparent 35%), radial-gradient(circle at 85% 80%, rgba(121,229,210,0.05), transparent 30%)",
      }}
    >
      <TrackPageView
        event="dashboard_onboarding_viewed"
        metadata={{ firstRun: isFirstRun }}
      />
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/8 bg-[#080d10]/80 px-6 py-4 backdrop-blur-2xl flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 text-xl font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[linear-gradient(135deg,rgba(0,245,255,0.9),rgba(121,229,210,0.85))] text-xs font-black text-black shadow-[0_6px_20px_rgba(0,245,255,0.25)]">
            LP
          </span>
          <span>
            Life<span className="text-[#00f5ff]">Page</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          {username && (
            <Link
              href={`/u/${username}`}
              target="_blank"
              className="inline-flex items-center gap-1 rounded-full border border-[#00f5ff]/20 bg-[#00f5ff]/8 px-3 py-1.5 text-sm text-[#00f5ff] transition-colors hover:bg-[#00f5ff]/15"
            >
              /u/{username}
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          )}
          <span className="hidden text-sm text-gray-400 sm:block">{session?.user?.email}</span>
          <Link
            href="/explore"
            className="text-sm text-gray-400 transition-colors hover:text-white"
          >
            Explore
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-gray-400 transition-colors hover:border-white/20 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Message */}
        {message && (
          <div
            className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
              message.type === "success"
                ? "border-emerald-500/25 bg-emerald-500/8 text-emerald-400"
                : message.type === "warning"
                  ? "border-amber-500/25 bg-amber-500/8 text-amber-200"
                  : "border-red-500/25 bg-red-500/8 text-red-400"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,1.12fr)_minmax(280px,0.88fr)]">
          <div className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-6 backdrop-blur-sm">
            <p className="lp-kicker text-[11px] text-[#00f5ff]">
              {activeTabCopy.eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
              {activeTabCopy.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-400">
              {activeTabCopy.summary}
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              {username && (
                <Link
                  href={`/u/${username}`}
                  target="_blank"
                  className="inline-flex items-center gap-2 rounded-full border border-[#00f5ff]/20 bg-[#00f5ff]/8 px-4 py-2 text-sm text-[#00f5ff] transition-colors hover:bg-[#00f5ff]/14"
                >
                  View public site
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              )}
              <button
                onClick={() => setActiveTab("settings")}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300 transition-colors hover:border-white/20 hover:text-white"
              >
                Open settings
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <p className="lp-kicker text-[10px] text-[#00f5ff]">Evidence</p>
              <p className="mt-3 text-2xl font-semibold text-white">{evidence.length}</p>
              <p className="mt-1 text-xs leading-6 text-gray-400">
                URLs, screenshots, and imported proof currently attached to the profile.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <p className="lp-kicker text-[10px] text-[#00f5ff]">Profile</p>
              <p className="mt-3 text-sm font-semibold text-white">{profileStatusLabel}</p>
              <p className="mt-1 text-xs leading-6 text-gray-400">
                {profile
                  ? "The public story is generated and ready to refine."
                  : evidence.length > 0
                    ? "You have enough proof to generate the first version."
                    : "Import more source material before asking the AI to write."}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <p className="lp-kicker text-[10px] text-[#00f5ff]">Publishing</p>
              <p className="mt-3 text-sm font-semibold text-white">
                {publishStatusLabel}
                {billing ? ` · ${billing.plan.label}` : ""}
              </p>
              <p className="mt-1 text-xs leading-6 text-gray-400">
                {username
                  ? `Live path: /u/${username}`
                  : "Add a username in settings to get a clean public path."}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex flex-wrap gap-1 w-fit rounded-xl border border-white/10 bg-white/5 p-1">
          {(Object.entries(TAB_META) as Array<[DashboardTab, { icon: LucideIcon; label: string }]>).map(([tab, meta]) => {
            const Icon = meta.icon;
            return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                activeTab === tab
                  ? "bg-[linear-gradient(135deg,#00f5ff,#79e5d2)] text-black shadow-[0_6px_20px_rgba(0,245,255,0.2)]"
                  : "text-gray-400 hover:bg-white/8 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {meta.label}
            </button>
            );
          })}
        </div>

        {/* CRAWL TAB */}
        {activeTab === "crawl" && (
          <div className="space-y-8">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-[#00f5ff]">
                  First-run checklist
                </p>
                <div className="mt-4 space-y-3">
                  {onboardingSteps.map((step) => (
                    <div
                      key={step.title}
                      className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/10 px-4 py-3"
                    >
                      <CheckCircle2
                        className={`mt-0.5 h-4 w-4 ${step.done ? "text-[#79e5d2]" : "text-gray-600"}`}
                      />
                      <div>
                        <p className="text-sm font-medium text-white">{step.title}</p>
                        <p className="mt-1 text-xs leading-6 text-gray-400">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-[#00f5ff]">
                  What the first version includes
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  {[
                    "A sharper headline and about section",
                    "Project cards with proof and screenshots",
                    "A public profile page you can share",
                    "A separate resume view with PDF export",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-gray-200"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* URL Crawler */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <div className="mb-2 flex items-center gap-2">
                <Search className="h-[18px] w-[18px] text-[#00f5ff]" />
                <h2 className="text-lg font-semibold">Import proof from the web</h2>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Paste the URLs that best prove your work. LifePage crawls each
                source, captures screenshots, and turns the useful signal into
                portfolio-ready evidence. Google Sites roots also expand into
                linked pages from the same site.
              </p>
              <div className="mb-3 flex flex-wrap gap-2">
                {["Multiple URLs", "GitHub + websites", "YouTube + docs", "Google Sites roots"].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-300"
                  >
                    {item}
                  </span>
                ))}
              </div>
              <div className="mb-4 flex flex-wrap gap-2">
                {CRAWL_EXAMPLE_GROUPS.map((group) => (
                  <button
                    key={group.label}
                    type="button"
                    onClick={() => {
                      setUrlInput(group.urls.join("\n"));
                      trackProductEvent("dashboard_onboarding_viewed", {
                        firstRun: isFirstRun,
                        exampleSet: group.label,
                      });
                    }}
                    className="rounded-full border border-[#00f5ff]/15 bg-[#00f5ff]/8 px-3 py-1.5 text-xs text-[#9ceeff] transition-colors hover:bg-[#00f5ff]/12"
                  >
                    Use {group.label} examples
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-3 md:flex-row">
                <textarea
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                      handleCrawl();
                    }
                  }}
                  placeholder={"https://your-site.com\nhttps://github.com/yourname\nhttps://youtube.com/@yourname"}
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  rows={4}
                  className="min-h-[120px] flex-1 resize-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#00f5ff]/50"
                />
                <button
                  onClick={handleCrawl}
                  disabled={crawling || !urlInput.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#00f5ff,#79e5d2)] px-6 py-3 font-medium text-black shadow-[0_8px_24px_rgba(0,245,255,0.2)] transition-all hover:shadow-[0_12px_32px_rgba(0,245,255,0.3)] hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 whitespace-nowrap md:self-start"
                >
                  {crawling ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      Import sources
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                Use one URL per line or separate them with commas. Press Cmd/Ctrl + Enter to start.
              </p>
              {crawling && (
                <div className="mt-4 rounded-2xl border border-[#00f5ff]/15 bg-[#00f5ff]/6 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <LoaderCircle className="h-4 w-4 animate-spin text-[#00f5ff]" />
                    Importing your proof
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-gray-300 sm:grid-cols-3">
                    <div className="rounded-xl border border-white/10 bg-black/15 px-3 py-2">
                      Fetching the page
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/15 px-3 py-2">
                      Capturing screenshots
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/15 px-3 py-2">
                      Saving evidence cards
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Links */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <div className="mb-4 flex items-center gap-2">
                <Link2 className="h-[18px] w-[18px] text-[#00f5ff]" />
                <h2 className="text-lg font-semibold">Social Links</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {(
                  [
                    {
                      key: "github",
                      label: "GitHub",
                      placeholder: "https://github.com/yourname",
                    },
                    {
                      key: "linkedin",
                      label: "LinkedIn",
                      placeholder: "https://linkedin.com/in/yourname",
                    },
                    {
                      key: "youtube",
                      label: "YouTube",
                      placeholder: "https://youtube.com/@yourname",
                    },
                    {
                      key: "drive",
                      label: "Google Drive / Portfolio",
                      placeholder: "https://drive.google.com/...",
                    },
                  ] as const
                ).map((l) => (
                  <div key={l.key}>
                    <label className="block text-sm text-gray-400 mb-1">
                      {l.label}
                    </label>
                    <input
                      type="url"
                      value={links[l.key]}
                      onChange={(e) =>
                        setLinks({ ...links, [l.key]: e.target.value })
                      }
                      placeholder={l.placeholder}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#00f5ff]/50 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* User Info */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <div className="mb-4 flex items-center gap-2">
                <User className="h-[18px] w-[18px] text-[#00f5ff]" />
                <h2 className="text-lg font-semibold">About You</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Your Name
                  </label>
                  <input
                    value={userInfo.name}
                    onChange={(e) =>
                      setUserInfo({ ...userInfo, name: e.target.value })
                    }
                    placeholder="Alex Chen"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#00f5ff]/50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Short Bio / Context
                  </label>
                  <textarea
                    value={userInfo.bio}
                    onChange={(e) =>
                      setUserInfo({ ...userInfo, bio: e.target.value })
                    }
                    placeholder="CS student at MIT, built 3 startups, won 2 hackathons..."
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#00f5ff]/50 text-sm resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Tags / Roles
                  </label>
                  <input
                    value={userInfo.tags}
                    onChange={(e) =>
                      setUserInfo({ ...userInfo, tags: e.target.value })
                    }
                    placeholder="Full-Stack Developer, ML Engineer, Designer..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#00f5ff]/50 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Evidence Items */}
            {evidence.length > 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                <div className="mb-4 flex items-center gap-2">
                  <FolderOpen className="h-[18px] w-[18px] text-[#00f5ff]" />
                  <h2 className="text-lg font-semibold">
                    Evidence Items ({evidence.length})
                  </h2>
                </div>
                <div className="space-y-3">
                  {evidence.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                        item.visible
                          ? "bg-white/5 border-white/10"
                          : "bg-white/2 border-white/5 opacity-50"
                      }`}
                    >
                      {item.screenshot && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.screenshot}
                          alt={item.title ?? "screenshot"}
                          loading="lazy"
                          decoding="async"
                          className="w-24 h-16 object-cover rounded-lg border border-white/10 flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {item.title ?? item.url}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-gray-300">
                            Crawl {formatEvidenceStatusLabel(item.crawlStatus)}
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-gray-300">
                            Screenshot {formatEvidenceStatusLabel(item.screenshotStatus)}
                          </span>
                          {!item.visible && (
                            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-gray-400">
                              Hidden
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-gray-400 text-xs mt-1 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#00f5ff] text-xs hover:underline mt-1 block truncate"
                          >
                            {item.url}
                          </a>
                        )}
                        {item.canonicalUrl &&
                          item.canonicalUrl !== item.url && (
                            <p className="mt-1 truncate text-[11px] text-gray-500">
                              Canonical: {item.canonicalUrl}
                            </p>
                          )}
                        {item.screenshotError && (
                          <p className="mt-2 text-[11px] text-yellow-300">
                            Screenshot issue: {item.screenshotError}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() =>
                            toggleVisibility(item.id, !item.visible)
                          }
                          className="inline-flex items-center justify-center rounded-lg border border-white/10 p-2 text-gray-400 hover:text-white"
                          title={
                            item.visible
                              ? "Hide from public page"
                              : "Show on public page"
                          }
                        >
                          {item.visible ? (
                            <Eye className="h-3.5 w-3.5" />
                          ) : (
                            <EyeOff className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => deleteEvidence(item.id)}
                          className="inline-flex items-center justify-center rounded-lg border border-red-500/20 p-2 text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                <div className="mx-auto max-w-2xl text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                    <FolderOpen className="h-6 w-6 text-[#00f5ff]" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">No imported proof yet</h2>
                  <p className="mt-2 text-sm leading-7 text-gray-400">
                    Start with the pages that show the strongest signal. A personal
                    site, GitHub profile, project write-up, or demo page is usually enough
                    to generate the first version.
                  </p>
                </div>
              </div>
            )}

            {/* Generate Button */}
            <div className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-6 text-center backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-[#00f5ff]">
                Step 3
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white">
                Generate the first public version
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-gray-400">
                LifePage will synthesize the imported proof into a headline, about
                section, projects, and resume framing you can refine from there.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {[
                  "Headline",
                  "About section",
                  "Project cards",
                  "Resume bullets",
                  "Public page",
                ].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-300"
                  >
                    {item}
                  </span>
                ))}
              </div>
              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleGenerate}
                  disabled={generating || !canGenerateProfile}
                  className="inline-flex items-center gap-2 bg-[#00f5ff] text-black px-12 py-4 rounded-full text-lg font-semibold hover:bg-[#00c8d4] transition-colors disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <LoaderCircle className="h-5 w-5 animate-spin" />
                      Generating your profile...
                    </>
                  ) : (
                    <>
                      <WandSparkles className="h-5 w-5" />
                      Generate My Profile
                    </>
                  )}
                </button>
              </div>
              {!canGenerateProfile && (
                <p className="mt-4 text-sm text-gray-500">
                  Crawl at least one URL or add a short bio before generating.
                </p>
              )}
              {generating && (
                <div className="mt-5 grid gap-2 text-xs text-gray-300 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-black/15 px-3 py-2">
                    Writing the headline
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/15 px-3 py-2">
                    Structuring case studies
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/15 px-3 py-2">
                    Preparing the resume view
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            {profile ? (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    Your Generated Profile
                  </h2>
                  <div className="flex gap-3">
                    <Link
                      href={`/u/${username}`}
                      target="_blank"
                      className="inline-flex items-center gap-2 text-sm bg-[#00f5ff] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#00c8d4]"
                    >
                      View Public Page
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                    <a
                      href="/api/resume"
                      target="_blank"
                      className="inline-flex items-center gap-2 text-sm border border-white/20 px-4 py-2 rounded-lg hover:bg-white/5"
                    >
                      <FileText className="h-4 w-4" />
                      Export Resume
                    </a>
                    <a
                      href="/api/export/google-sites"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm border border-white/20 px-4 py-2 rounded-lg hover:bg-white/5"
                    >
                      <Globe className="h-4 w-4" />
                      Export HTML for Google Sites
                    </a>
                  </div>
                </div>

                {/* Mode toggle */}
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-4">
                  <span className="text-sm text-gray-400">Page Mode:</span>
                  <div className="flex gap-1 bg-white/5 rounded-lg p-1">
                    <button
                      onClick={() => handleSetMode("hiring")}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors ${
                        mode === "hiring"
                          ? "bg-[#00f5ff] text-black"
                          : "text-gray-400"
                      }`}
                    >
                      <BriefcaseBusiness className="h-3.5 w-3.5" />
                      Hiring
                    </button>
                    <button
                      onClick={() => handleSetMode("admissions")}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors ${
                        mode === "admissions"
                          ? "bg-purple-500 text-white"
                          : "text-gray-400"
                      }`}
                    >
                      <GraduationCap className="h-3.5 w-3.5" />
                      Admissions
                    </button>
                  </div>
                  <span className="text-xs text-gray-500 ml-2">
                    {mode === "hiring"
                      ? "Shows skills, impact, case studies"
                      : "Shows story, growth, leadership"}
                  </span>
                </div>

                {/* Profile preview */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm space-y-6">
                  <div>
                    <div className="text-[#00f5ff] text-xs font-mono mb-1">
                      HEADLINE
                    </div>
                    <p className="text-2xl font-bold">{profile.data.headline}</p>
                  </div>
                  <div>
                    <div className="text-[#00f5ff] text-xs font-mono mb-1">
                      ABOUT
                    </div>
                    <p className="text-gray-300 leading-relaxed">
                      {profile.data.about}
                    </p>
                  </div>

                  {/* Stats */}
                  <div>
                    <div className="text-[#00f5ff] text-xs font-mono mb-3">
                      PROOF STATS
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        {
                          label: "Projects",
                          value: profile.data.stats?.projectsShipped,
                        },
                        {
                          label: "Years Building",
                          value: profile.data.stats?.yearsBuilding,
                        },
                        {
                          label: "Competitions",
                          value: profile.data.stats?.competitions,
                        },
                      ].map((s) => (
                        <div
                          key={s.label}
                          className="text-center bg-white/5 rounded-xl p-4"
                        >
                          <div className="text-3xl font-bold text-[#00f5ff]">
                            {s.value}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {s.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Skills */}
                  {profile.data.skills?.length > 0 && (
                    <div>
                      <div className="text-[#00f5ff] text-xs font-mono mb-3">
                        SKILLS
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {profile.data.skills.map((s) => (
                          <span
                            key={s.tag}
                            className="bg-white/10 border border-white/10 rounded-full px-3 py-1 text-sm"
                          >
                            {s.tag}
                            <span className="text-gray-500 ml-1 text-xs">
                              {s.level}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Projects */}
                  {profile.data.projects?.length > 0 && (
                    <div>
                      <div className="text-[#00f5ff] text-xs font-mono mb-3">
                        PROJECTS
                      </div>
                      <div className="space-y-4">
                        {profile.data.projects.slice(0, 3).map((p, index) => {
                          const latestVideoArtifact =
                            savedArtifacts.find((artifact) => {
                              const output = getProjectVideoOutput(artifact);
                              return output?.projectIndex === index;
                            }) ?? null;
                          const videoOutput =
                            getProjectVideoOutput(latestVideoArtifact) ??
                            null;
                          const completedMedia = (p.media ?? []).find((item) => {
                            if (!item || typeof item === "string") return false;
                            return item.type === "video" && item.status === "ready";
                          });

                          return (
                          <div
                            key={p.title}
                            className="border border-white/10 rounded-xl p-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <h4 className="font-semibold mb-2">{p.title}</h4>
                              <button
                                onClick={() => handleGenerateProjectVideo(index)}
                                disabled={
                                  agentLoading ||
                                  videoOutput?.status === "queued" ||
                                  videoOutput?.status === "in_progress"
                                }
                                className="inline-flex items-center gap-2 rounded-full border border-[#00f5ff]/20 bg-[#00f5ff]/10 px-3 py-1.5 text-xs text-[#7ef4ff] disabled:opacity-40"
                              >
                                <Clapperboard className="h-3.5 w-3.5" />
                                {videoOutput?.status === "queued" ||
                                videoOutput?.status === "in_progress"
                                  ? "Rendering..."
                                  : completedMedia
                                    ? "Regenerate demo"
                                    : "Generate demo"}
                              </button>
                            </div>
                            {p.problem && (
                              <p className="text-sm text-gray-400 mb-1">
                                Problem: {p.problem}
                              </p>
                            )}
                            {p.impact && (
                              <p className="text-sm text-green-400">
                                Impact: {p.impact}
                              </p>
                            )}
                            {p.tech?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {p.tech.map((t) => (
                                  <span
                                    key={t}
                                    className="text-xs bg-white/5 px-2 py-0.5 rounded"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                            {videoOutput ? (
                              <p className="mt-3 text-xs text-gray-500">
                                {videoOutput.summary}
                              </p>
                            ) : null}
                            {completedMedia && typeof completedMedia !== "string" ? (
                              <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black/20">
                                <video
                                  controls
                                  playsInline
                                  preload="metadata"
                                  poster={completedMedia.posterUrl ?? undefined}
                                  className="aspect-video w-full bg-black"
                                  src={completedMedia.url}
                                />
                              </div>
                            ) : null}
                          </div>
                        )})}
                      </div>
                    </div>
                  )}

                  {/* Confidence */}
                  <div className="text-xs text-gray-600 flex items-center gap-2">
                    <span>AI Confidence:</span>
                    <div className="flex-1 bg-white/5 rounded-full h-1.5 max-w-24">
                      <div
                        className="bg-[#00f5ff] h-1.5 rounded-full"
                        style={{
                          width: `${(profile.data.confidence ?? 0.5) * 100}%`,
                        }}
                      />
                    </div>
                    <span>
                      {Math.round((profile.data.confidence ?? 0.5) * 100)}%
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-20">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                  <Sparkles className="h-7 w-7 text-[#00f5ff]" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  No profile generated yet
                </h3>
                <p className="text-gray-400 mb-6">
                  Import a few strong URLs first, then generate the first public version from that evidence.
                </p>
                <button
                  onClick={() => setActiveTab("crawl")}
                  className="inline-flex items-center gap-2 bg-[#00f5ff] text-black px-6 py-2.5 rounded-full font-medium"
                >
                  Start onboarding
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* USAGE TAB */}
        {activeTab === "usage" && (
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <div className="mb-1 flex items-center gap-2">
                <ChartColumn className="h-[18px] w-[18px] text-[#00f5ff]" />
                <h2 className="text-lg font-semibold">Usage</h2>
              </div>
              <p className="text-sm text-gray-400">
                Track advanced AI usage with credits, plan limits, and fallback status.
              </p>
            </div>

            {billing ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                      Monthly allowance
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-white">
                      {advancedCreditsCap === null ? "Unlimited" : advancedCreditsCap}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {advancedCreditsCap === null
                        ? "No cap on advanced AI this cycle."
                        : "Advanced credits available each billing cycle."}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                      Used this cycle
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-white">
                      {advancedCreditsUsed}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Advanced AI runs already used in the current cycle.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                      Remaining
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-white">
                      {advancedCreditsRemaining === null ? "Unlimited" : advancedCreditsRemaining}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {billing.fallbackToStandard
                        ? `Advanced credits are exhausted. New runs use ${billing.standardModel}.`
                        : "Advanced credits left before fallback starts."}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                      Cycle ends
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-white">
                      {new Date(billing.cycleEndsAt).toLocaleDateString()}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {billing.billingInterval === "year"
                        ? "Credits refresh monthly even on yearly billing."
                        : "Credits reset automatically at the start of the next cycle."}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                        Credit progress
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {advancedCreditsCap === null
                          ? "Unlimited advanced AI on this plan"
                          : `${advancedCreditsUsed} of ${advancedCreditsCap} credits used`}
                      </p>
                      <p className="mt-1 text-sm text-gray-400">
                        {advancedCreditsCap === null
                          ? `${billing.plan.label} keeps every supported AI run on the advanced model.`
                          : `Each advanced AI run costs 1 credit. When you hit 0 remaining, the app falls back to ${billing.standardModel}.`}
                      </p>
                    </div>
                    <div className="text-sm text-gray-300">
                      Plan: <span className="text-white">{billing.plan.label}</span>
                      {billing.billingInterval && (
                        <span className="text-gray-500">
                          {" "}
                          · {formatBillingIntervalLabel(billing.billingInterval)}
                        </span>
                      )}
                    </div>
                  </div>

                  {advancedCreditsCap !== null && (
                    <>
                      <div className="mt-4 h-3 rounded-full bg-white/5">
                        <div
                          className="h-3 rounded-full bg-[#00f5ff]"
                          style={{ width: `${advancedCreditsProgress}%` }}
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                        <span>{advancedCreditsRemaining} credits left</span>
                        <span>{Math.round(advancedCreditsProgress)}% used</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                      What uses credits
                    </p>
                    <div className="mt-4 space-y-3 text-sm text-gray-300">
                      <p>Profile generation uses 1 advanced credit when it runs on the advanced model.</p>
                      <p>Agent runs and advanced tool generations use 1 advanced credit per run.</p>
                      <p>Project demo videos use 1 advanced credit per render and do not have a lightweight fallback model.</p>
                      <p>Automation runs only spend a credit when they use the advanced model.</p>
                      <p>Fallback runs do not spend advanced credits after your allowance is exhausted.</p>
                    </div>
                    {!billing.unlimitedAdvanced && (
                      <button
                        onClick={() => {
                          if (billing.canManageSubscription) {
                            void handleOpenBillingPortal();
                            return;
                          }
                          void handleStartCheckout("plus", billingIntervalForCards);
                        }}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#00f5ff]/25 bg-[#00f5ff]/10 px-3 py-2 text-xs font-medium text-[#7ef4ff] transition hover:border-[#00f5ff]/40 hover:bg-[#00f5ff]/15"
                      >
                        {billing.planTier === "free"
                          ? "Upgrade to Plus"
                          : "Manage paid plan"}
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                      Current AI setup
                    </p>
                    <div className="mt-4 space-y-3 text-sm text-gray-300">
                      <p>
                        Provider: <span className="text-white">{billing.provider.label}</span>
                      </p>
                      <p>
                        Advanced model: <span className="text-white">{billing.advancedModel}</span>
                      </p>
                      <p>
                        Fallback model: <span className="text-white">{billing.standardModel}</span>
                      </p>
                      <p>
                        AI intensity: <span className="text-white">{billing.aiUsageRate === "auto" ? "Auto (1x)" : billing.aiUsageRate}</span>
                      </p>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        onClick={() => openSettingsSection("settings-billing")}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#00f5ff] px-4 py-2.5 text-sm font-semibold text-black hover:bg-[#00e5ef]"
                      >
                        Manage billing
                        <ArrowRight className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openSettingsSection("settings-ai")}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-gray-300 hover:border-[#00f5ff]/30 hover:text-white"
                      >
                        Tune AI preferences
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
                <p className="text-sm text-gray-400">
                  Usage data will appear here once billing data is available.
                </p>
              </div>
            )}
          </div>
        )}

        {/* AGENT TAB */}
        {activeTab === "agent" && (
          <div className="space-y-6">

            {/* Tool picker */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="mb-1 flex items-center gap-2">
                <Bot className="h-[18px] w-[18px] text-[#00f5ff]" />
                <h2 className="text-lg font-semibold">AI Agent Workspace</h2>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Ask the agent to rewrite copy, improve structure, rethink the UI, or generate artifacts like timelines, scripts, and real project demo videos. Life edits now apply directly when the agent resolves a mutate workflow, and every live change can be reverted.
              </p>

              {billing && (
                <div className="mb-4 rounded-xl border border-white/10 bg-white/3 p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {billing.plan.label} plan · {billing.provider.label} · Advanced model {billing.advancedModel}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {billing.unlimitedAdvanced
                          ? "Unlimited advanced AI on this plan."
                          : `${billing.advancedCreditsRemaining} advanced credits left. When they run out, the agent falls back to ${billing.standardModel}.`}
                      </p>
                    </div>
                    {billing.fallbackToStandard && (
                      <span className="inline-flex items-center rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs text-yellow-300">
                        Using fallback model now
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="mb-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
                <div>
                  <label className="mb-1 block text-xs text-gray-400">
                    Expert mode
                  </label>
                  <select
                    value={selectedPersonaSkillId}
                    onChange={(e) => setSelectedPersonaSkillId(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-[#00f5ff]/40 focus:outline-none"
                  >
                    {personaSkillOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-gray-500">
                    {selectedPersonaSkill?.description ??
                      "LifeAgent picks the expert mode automatically."}
                  </p>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-gray-400">
                    Workflow
                  </label>
                  <select
                    value={selectedWorkflowSkillId}
                    onChange={(e) => setSelectedWorkflowSkillId(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-[#00f5ff]/40 focus:outline-none"
                  >
                    {workflowSkillOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-gray-500">
                    {selectedWorkflowSkill?.description ??
                      "LifeAgent picks the workflow automatically."}
                  </p>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-gray-400">
                    Focus area
                  </label>
                  <select
                    value={activeFocusValue}
                    onChange={(e) => setSelectedFocusValue(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-[#00f5ff]/40 focus:outline-none"
                  >
                    {agentFocusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/3 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                    Current routing
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {selectedPersonaSkillId === "auto"
                      ? "Expert mode: Auto"
                      : `Expert mode: ${selectedPersonaSkill?.label ?? "Custom"}`}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-400">
                    {selectedWorkflowSkillId === "auto"
                      ? "Workflow: Auto"
                      : `Workflow: ${selectedWorkflowSkill?.label ?? "Custom"}`}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-gray-500">
                    Focus: {activeFocusOption.label}. Save persistent defaults in Settings if you want these skills to stay pinned.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                {AGENT_TOOL_META.map((t) => {
                  const Icon = t.icon;
                  return (
                  <div
                    key={t.tool}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedTool === t.tool
                        ? "border-[#00f5ff] bg-[#00f5ff]/8"
                        : "border-white/10 bg-white/3 hover:border-white/20"
                    }`}
                    onClick={() => {
                      const isDeselecting = t.tool === selectedTool;
                      setSelectedTool(isDeselecting ? "" : t.tool);
                      setSelectedStyle(isDeselecting ? "" : (t.styles[0] ?? ""));
                    }}
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                      <Icon className="h-4 w-4 text-[#00f5ff]" />
                    </div>
                    <p className="font-medium text-sm">{t.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
                    {selectedTool === t.tool && (
                      t.tool === "set_portfolio_theme" || t.tool === "set_resume_model" ? (
                        <div className="mt-3 space-y-2">
                          <label className="text-[11px] uppercase tracking-[0.18em] text-gray-500">
                            {t.tool === "set_portfolio_theme" ? "Portfolio model" : "Resume model"}
                          </label>
                          <select
                            value={selectedStyle}
                            onChange={(e) => {
                              e.stopPropagation();
                              setSelectedStyle(e.target.value);
                            }}
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-[#00f5ff]/40 focus:outline-none"
                          >
                            <option value="custom">custom</option>
                            {t.tool === "set_portfolio_theme"
                              ? PORTFOLIO_THEME_PRESETS.map((preset) => (
                                  <option key={preset.id} value={preset.id}>
                                    {preset.label} · {preset.heroLayout} / {preset.projectLayout}
                                  </option>
                                ))
                              : RESUME_MODEL_PRESETS.map((preset) => (
                                  <option key={preset.id} value={preset.id}>
                                    {preset.label} · {preset.headerLayout} / {preset.sectionStyle}
                                  </option>
                                ))}
                          </select>
                        </div>
                      ) : t.styles.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {t.styles.map((s) => (
                            <button
                              key={s}
                              onClick={(e) => { e.stopPropagation(); setSelectedStyle(s); }}
                              className={`text-xs px-2 py-0.5 rounded-md border transition-colors ${
                                selectedStyle === s
                                  ? "border-[#00f5ff] bg-[#00f5ff]/15 text-[#00f5ff]"
                                  : "border-white/10 text-gray-400 hover:border-white/20"
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 text-xs leading-relaxed text-gray-500">
                          No style selection needed. The agent will use the current focus and evidence.
                        </p>
                      )
                    )}
                  </div>
                  );
                })}
              </div>

              {selectedTool && (
                <button
                  onClick={handleAgentChat}
                  disabled={agentLoading}
                  className="w-full bg-[#00f5ff] text-black py-2.5 rounded-xl font-semibold text-sm hover:bg-[#00e5ef] transition-colors disabled:opacity-50 mb-3"
                >
                  {agentLoading
                    ? "Generating…"
                    : `${formatAgentActionLabel(selectedTool, selectedStyle)}${
                        activeFocusValue === "all"
                          ? ""
                          : ` for ${activeFocusOption.label}`
                      }`}
                </button>
              )}
            </div>

            {/* Chat interface */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="inline-flex items-center gap-2 font-medium text-sm">
                      <MessageSquare className="h-4 w-4 text-[#00f5ff]" />
                      Chat with Agent
                    </p>
                    <p className="text-xs text-gray-400">
                      Ask for advice, generate artifacts, or say &quot;redesign my portfolio theme&quot;. Current focus:{" "}
                      <span className="text-white">{activeFocusOption.label}</span>.
                    </p>
                    {latestClarificationMessage ? (
                      <p className="mt-1 text-[11px] text-yellow-300">
                        The agent is waiting on a clarification before it continues.
                      </p>
                    ) : null}
                  </div>
                  {billing && activeChatModelLabel && (
                    <div className="text-right">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500">
                        Active model
                      </p>
                      <div className="mt-1 inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white">
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${
                            billing.fallbackToStandard
                              ? "bg-yellow-400"
                              : "bg-[#00f5ff]"
                          }`}
                        />
                        <span className="truncate">{activeChatModelLabel}</span>
                      </div>
                      <p
                        className={`mt-1 text-[11px] ${
                          billing.fallbackToStandard
                            ? "text-yellow-300"
                            : "text-gray-500"
                        }`}
                      >
                        {billing.fallbackToStandard
                          ? "Fallback is active"
                          : "Advanced model is active"}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                {chatHistory.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                      <Bot className="h-5 w-5 text-[#00f5ff]" />
                    </div>
                    <p>I can rewrite sections, improve positioning, redesign the theme direction, generate artifacts, or apply live portfolio edits with a revert trail.</p>
                    <div className="flex flex-wrap gap-2 justify-center mt-4">
                      {[
                        "Rewrite my headline to sound sharper",
                        "Redesign my portfolio theme for hiring",
                        "Make me a documentary timeline",
                        "What should I improve next?",
                      ].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => { setChatInput(suggestion); }}
                          className="text-xs bg-white/5 border border-white/10 px-3 py-1.5 rounded-full hover:border-[#00f5ff]/30 hover:text-[#00f5ff] transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] ${msg.role === "user" ? "order-2" : "order-1"}`}>
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-[#00f5ff] text-black rounded-br-sm"
                            : "bg-white/8 border border-white/10 rounded-bl-sm"
                        }`}
                      >
                        {msg.content || (msg.tool ? formatAgentActionLabel(msg.tool, msg.style) : "")}
                      </div>
                      {msg.role === "assistant" && msg.strategy && (
                        <AgentStrategyCard strategy={msg.strategy} />
                      )}
                      {(msg.resolvedPersonaSkill || msg.resolvedWorkflowSkill || msg.executionMode) && (
                        <AgentSkillBadges
                          personaSkill={msg.resolvedPersonaSkill}
                          workflowSkill={msg.resolvedWorkflowSkill}
                          executionMode={msg.executionMode}
                        />
                      )}
                      {msg.executionMode === "clarify" ? (
                        <AgentClarificationCard
                          questions={msg.clarificationQuestions}
                          onOptionSelect={(answer) => {
                            void sendAgentMessage(answer);
                          }}
                        />
                      ) : null}
                      {msg.focusLabel && (
                        <p
                          className={`mt-1 px-1 text-[11px] ${
                            msg.role === "user"
                              ? "text-right text-gray-500"
                              : "text-gray-500"
                          }`}
                        >
                          {msg.role === "user" ? "Focus" : "Scoped to"}: {msg.focusLabel}
                        </p>
                      )}
                      {msg.tool && msg.output != null && (
                        <ArtifactRenderer
                          tool={msg.tool}
                          output={msg.output}
                          revertable={msg.revertable}
                          onRevert={
                            msg.revertable && msg.artifactId
                              ? () => handleRevertAgentArtifact(msg.artifactId!)
                              : null
                          }
                        />
                      )}
                    </div>
                  </div>
                ))}
                {agentLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white/8 border border-white/10 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-gray-400">
                      <span className="animate-pulse">Thinking…</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-white/10 flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAgentChat()}
                  placeholder={chatInputPlaceholder}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00f5ff]/40"
                />
                <button
                  onClick={handleAgentChat}
                  disabled={agentLoading || (!chatInput.trim() && !selectedTool)}
                  className="inline-flex items-center justify-center bg-[#00f5ff] text-black px-4 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-40 hover:bg-[#00e5ef] transition-colors"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Saved artifacts */}
            {savedArtifacts.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h3 className="mb-4 inline-flex items-center gap-2 font-semibold text-sm">
                  <FolderOpen className="h-4 w-4 text-[#00f5ff]" />
                  Saved Artifacts
                </h3>
                <div className="space-y-3">
                  {savedArtifacts.slice(0, 5).map((a) => (
                    <div key={a.id} className="border border-white/8 rounded-xl overflow-hidden">
                      <div className="px-4 py-2.5 bg-white/3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {a.tool === "generate_timeline" ? (
                            <ChartColumn className="h-4 w-4 text-[#00f5ff]" />
                          ) : a.tool === "generate_video_script" ? (
                            <Clapperboard className="h-4 w-4 text-[#00f5ff]" />
                          ) : a.tool === "generate_project_video" ? (
                            <Clapperboard className="h-4 w-4 text-[#00f5ff]" />
                          ) : a.tool === "regenerate_profile" ? (
                            <WandSparkles className="h-4 w-4 text-[#00f5ff]" />
                          ) : a.tool === "recrawl_url" ? (
                            <RefreshCcw className="h-4 w-4 text-[#00f5ff]" />
                          ) : a.tool === "set_resume_model" ? (
                            <FileText className="h-4 w-4 text-[#00f5ff]" />
                          ) : a.tool === "set_portfolio_theme" ? (
                            <Palette className="h-4 w-4 text-[#00f5ff]" />
                          ) : a.tool === "mutate_portfolio" || a.tool === "revert_agent_mutation" ? (
                            <Bot className="h-4 w-4 text-[#00f5ff]" />
                          ) : (
                            <GitBranch className="h-4 w-4 text-[#00f5ff]" />
                          )}
                          <span className="text-sm font-medium capitalize">
                            {humanizeAgentToolName(a.tool)}
                          </span>
                          {a.style && <span className="text-xs text-gray-500">· {a.style}</span>}
                        </div>
                        <span className="text-xs text-gray-500">{new Date(a.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="px-4 pb-4">
                        <AgentSkillBadges
                          personaSkill={
                            a.meta?.resolvedPersonaSkillId
                              ? personaSkillOptions.find(
                                  (skill) => skill.id === a.meta?.resolvedPersonaSkillId
                                ) ?? null
                              : null
                          }
                          workflowSkill={
                            a.meta?.resolvedWorkflowSkillId
                              ? workflowSkillOptions.find(
                                  (skill) => skill.id === a.meta?.resolvedWorkflowSkillId
                                ) ?? null
                              : null
                          }
                          executionMode={a.meta?.executionMode}
                        />
                        <ArtifactRenderer
                          tool={a.tool}
                          output={a.output}
                          revertable={isRevertableArtifact(a)}
                          onRevert={
                            isRevertableArtifact(a)
                              ? () => handleRevertAgentArtifact(a.id)
                              : null
                          }
                        />
                        {a.meta?.revertedAt ? (
                          <p className="mt-3 text-[11px] text-gray-500">
                            Reverted on {new Date(a.meta.revertedAt).toLocaleString()}.
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* AUTOMATIONS TAB */}
        {activeTab === "automations" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="inline-flex items-center gap-2 text-xl font-bold">
                  <Clock3 className="h-5 w-5 text-[#00f5ff]" />
                  Automations
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  Schedule recurring tasks with a saved cadence, time of day, and timezone. The runner now locks work in flight and retries transient failures automatically.
                </p>
              </div>
              <button
                onClick={() => setShowNewAutomation(!showNewAutomation)}
                className="inline-flex items-center gap-2 bg-[#00f5ff] text-black px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#00e5ef] transition-colors"
              >
                <Plus className="h-4 w-4" />
                New Automation
              </button>
            </div>

            {/* New automation form */}
            {showNewAutomation && (
              <div className="bg-white/5 border border-[#00f5ff]/20 rounded-2xl p-5 space-y-4">
                <h3 className="font-semibold text-sm text-[#00f5ff]">Create Automation</h3>

                <div>
                  <label className="text-xs text-gray-400 block mb-1">Name</label>
                  <input
                    value={newAutomation.name}
                    onChange={(e) => setNewAutomation((n) => ({ ...n, name: e.target.value }))}
                    placeholder="e.g. Weekly profile refresh"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00f5ff]/40"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-2">Action</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(ACTION_META).map(([action, meta]) => (
                      <button
                        key={action}
                        onClick={() => setNewAutomation((n) => ({ ...n, action, config: {} }))}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          newAutomation.action === action
                            ? "border-[#00f5ff] bg-[#00f5ff]/8"
                            : "border-white/10 bg-white/3 hover:border-white/20"
                        }`}
                      >
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                          <meta.icon className="h-4 w-4 text-[#00f5ff]" />
                        </div>
                        <p className="text-xs font-medium">{meta.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{meta.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* URL config for recrawl */}
                {newAutomation.action === "recrawl_url" && (
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">URL to crawl</label>
                    <input
                      placeholder="https://your-website.com"
                      onChange={(e) => setNewAutomation((n) => ({ ...n, config: { ...n.config, url: e.target.value } }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00f5ff]/40"
                    />
                  </div>
                )}

                {/* Style config for timeline/video */}
                {(newAutomation.action === "refresh_timeline" || newAutomation.action === "refresh_video_script") && (
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Style</label>
                    <select
                      onChange={(e) => setNewAutomation((n) => ({ ...n, config: { ...n.config, style: e.target.value } }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00f5ff]/40"
                    >
                      {newAutomation.action === "refresh_timeline"
                        ? ["vertical", "horizontal", "documentary", "minimal"].map((s) => <option key={s} value={s}>{s}</option>)
                        : ["documentary", "pitch", "cinematic", "tutorial", "story"].map((s) => <option key={s} value={s}>{s}</option>)
                      }
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-xs text-gray-400 block mb-2">Schedule</label>
                  <div className="flex gap-2">
                    {["daily", "weekly", "monthly"].map((s) => (
                      <button
                        key={s}
                        onClick={() => setNewAutomation((n) => ({ ...n, schedule: s }))}
                        className={`flex-1 py-2 rounded-xl text-sm border transition-all capitalize ${
                          newAutomation.schedule === s
                            ? "border-[#00f5ff] bg-[#00f5ff]/10 text-[#00f5ff]"
                            : "border-white/10 text-gray-400 hover:border-white/20"
                        }`}
                      >
                        {SCHEDULE_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">
                      Time of day
                    </label>
                    <input
                      type="time"
                      value={newAutomation.scheduleTime}
                      onChange={(e) =>
                        setNewAutomation((n) => ({
                          ...n,
                          scheduleTime: e.target.value || "09:00",
                        }))
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00f5ff]/40"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">
                      Timezone
                    </label>
                    <input
                      value={newAutomation.scheduleTimezone}
                      onChange={(e) =>
                        setNewAutomation((n) => ({
                          ...n,
                          scheduleTimezone: e.target.value,
                        }))
                      }
                      placeholder="America/Los_Angeles"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00f5ff]/40"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleCreateAutomation}
                    disabled={!newAutomation.name.trim()}
                    className="flex-1 bg-[#00f5ff] text-black py-2.5 rounded-xl font-semibold text-sm hover:bg-[#00e5ef] transition-colors disabled:opacity-40"
                  >
                    Create Automation
                  </button>
                  <button
                    onClick={() => setShowNewAutomation(false)}
                    className="px-4 py-2.5 rounded-xl border border-white/10 text-sm text-gray-400 hover:border-white/20"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Automation list */}
            {automations.length === 0 && !showNewAutomation ? (
              <div className="text-center py-16 border border-white/8 rounded-2xl">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                  <Clock3 className="h-6 w-6 text-[#00f5ff]" />
                </div>
                <p className="font-semibold mb-1">No automations yet</p>
                <p className="text-sm text-gray-400 mb-6">
                  Set up a recurring re-crawl or profile refresh so your portfolio stays fresh automatically.
                </p>
                <button
                  onClick={() => setShowNewAutomation(true)}
                  className="inline-flex items-center gap-2 bg-[#00f5ff] text-black px-5 py-2 rounded-xl text-sm font-semibold hover:bg-[#00e5ef] transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Create first automation
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {automations.map((auto) => {
                  const meta = ACTION_META[auto.action] ?? { icon: Settings, label: auto.action, desc: "" };
                  const MetaIcon = meta.icon;
                  return (
                    <div
                      key={auto.id}
                      className={`bg-white/3 border rounded-2xl p-5 transition-colors ${
                        auto.enabled ? "border-white/10" : "border-white/5 opacity-60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                            <MetaIcon className="h-[18px] w-[18px] text-[#00f5ff]" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-sm">{auto.name}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${
                                auto.enabled
                                  ? "border-green-500/30 text-green-400 bg-green-500/10"
                                  : "border-gray-500/30 text-gray-500 bg-gray-500/10"
                              }`}>
                                {auto.enabled ? "Active" : "Paused"}
                              </span>
                              {auto.lastStatus && (
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                                  auto.lastStatus === "success"
                                    ? "border-blue-500/30 text-blue-400"
                                    : auto.lastStatus === "error"
                                    ? "border-red-500/30 text-red-400"
                                    : "border-yellow-500/30 text-yellow-400"
                                }`}>
                                  {auto.lastStatus}
                                </span>
                              )}
                              {auto.lockedAt && auto.lastStatus === "running" && (
                                <span className="text-xs px-2 py-0.5 rounded-full border border-yellow-500/30 text-yellow-300">
                                  Locked
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5 capitalize">
                              {meta.label} · {SCHEDULE_LABELS[auto.schedule] ?? auto.schedule} · {auto.scheduleTime} · {auto.scheduleTimezone}
                            </p>
                            <div className="flex gap-4 mt-1.5 text-xs text-gray-500">
                              {auto.lastRun && <span>Last run: {new Date(auto.lastRun).toLocaleString()}</span>}
                              {!auto.lastRun && auto.lastAttemptAt && (
                                <span>Last attempt: {new Date(auto.lastAttemptAt).toLocaleString()}</span>
                              )}
                              {auto.nextRun && <span>Next: {new Date(auto.nextRun).toLocaleString()}</span>}
                              <span>Runs: {auto.runCount}</span>
                              {auto.retryCount > 0 && <span>Retries queued: {auto.retryCount}</span>}
                            </div>
                            {auto.lastError && (
                              <p className="text-xs text-red-400 mt-1 truncate">{auto.lastError}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Run now */}
                          <button
                            onClick={() => handleRunAutomation(auto.id)}
                            disabled={runningAutomation === auto.id}
                            className="text-xs px-3 py-1.5 rounded-lg border border-white/10 hover:border-[#00f5ff]/30 hover:text-[#00f5ff] transition-colors disabled:opacity-40"
                          >
                            {runningAutomation === auto.id ? "Running…" : "Run now"}
                          </button>
                          {/* Toggle */}
                          <button
                            onClick={() => handleToggleAutomation(auto.id, !auto.enabled)}
                            className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
                              auto.enabled ? "bg-[#00f5ff]" : "bg-gray-700"
                            }`}
                          >
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform mx-0.5 ${
                              auto.enabled ? "translate-x-5" : "translate-x-0"
                            }`} />
                          </button>
                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteAutomation(auto.id)}
                            className="inline-flex items-center justify-center rounded-lg p-2 text-red-400/60 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Cron setup hint */}
            <div className="bg-white/3 border border-white/8 rounded-xl p-4 text-xs text-gray-500">
              <p className="mb-1 inline-flex items-center gap-2 font-medium text-gray-400">
                <Settings className="h-3.5 w-3.5" />
                How automations run
              </p>
              <p>Automations are triggered by calling <code className="text-[#00f5ff] bg-[#00f5ff]/10 px-1 rounded">POST /api/automations/run</code> with your <code className="text-[#00f5ff] bg-[#00f5ff]/10 px-1 rounded">CRON_SECRET</code> header. Each run now stores its scheduled time and timezone, prevents overlapping execution with a lock, and requeues transient failures with backoff.</p>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500 mb-3">
                Settings Sections
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { href: "#settings-personal", icon: User, label: "Personal Info" },
                  { href: "#settings-usage", icon: ChartColumn, label: "Usage" },
                  { href: "#settings-billing", icon: Sparkles, label: "Billing" },
                  { href: "#settings-ai", icon: Bot, label: "AI Preferences" },
                  { href: "#settings-agent", icon: WandSparkles, label: "Agent" },
                  { href: "#settings-public", icon: Globe, label: "Public Site" },
                  { href: "#settings-theme", icon: Palette, label: "Theme" },
                  { href: "#settings-resume", icon: FileText, label: "Resume" },
                  { href: "#settings-deploy", icon: Globe, label: "Deploy" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/3 px-3 py-2 text-sm text-gray-300 hover:border-[#00f5ff]/30 hover:text-white"
                    >
                      <Icon className="h-4 w-4 text-[#00f5ff]" />
                      {item.label}
                    </a>
                  );
                })}
              </div>
            </div>

            <div
              id="settings-personal"
              className="scroll-mt-24 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
            >
              <div className="mb-1 flex items-center gap-2">
                <User className="h-[18px] w-[18px] text-[#00f5ff]" />
                <h2 className="text-lg font-semibold">Personal Info</h2>
              </div>
              <p className="text-sm text-gray-400 mb-5">
                Manage the identity and contact details attached to your public brand page.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm text-gray-400">
                    Display name
                  </label>
                  <input
                    value={accountNameInput}
                    onChange={(e) => setAccountNameInput(e.target.value)}
                    placeholder="Your full name"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-[#00f5ff]/40 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm text-gray-400">
                    Username
                  </label>
                  <input
                    value={accountUsernameInput}
                    onChange={(e) => setAccountUsernameInput(e.target.value)}
                    placeholder="yourname"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-[#00f5ff]/40 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-3 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-[#00f5ff]" />
                  <h3 className="text-sm font-semibold text-white">Public Contact</h3>
                </div>
                <p className="mb-4 max-w-2xl text-xs leading-relaxed text-gray-500">
                  These details show up on your public portfolio and give visitors a way to reach you. Leave any field empty if you do not want it displayed.
                </p>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm text-gray-400">
                      Public contact email
                    </label>
                    <input
                      type="email"
                      value={publicContactInput.contactEmail}
                      onChange={(e) =>
                        setPublicContactInput((current) => ({
                          ...current,
                          contactEmail: e.target.value,
                        }))
                      }
                      placeholder="hello@yourbrand.com"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-[#00f5ff]/40 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-gray-400">
                      Phone
                    </label>
                    <input
                      value={publicContactInput.phone}
                      onChange={(e) =>
                        setPublicContactInput((current) => ({
                          ...current,
                          phone: e.target.value,
                        }))
                      }
                      placeholder="+1 (555) 123-4567"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-[#00f5ff]/40 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-gray-400">
                      Location
                    </label>
                    <input
                      value={publicContactInput.location}
                      onChange={(e) =>
                        setPublicContactInput((current) => ({
                          ...current,
                          location: e.target.value,
                        }))
                      }
                      placeholder="San Francisco, CA"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-[#00f5ff]/40 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-gray-400">
                      Website
                    </label>
                    <input
                      type="url"
                      value={publicContactInput.website}
                      onChange={(e) =>
                        setPublicContactInput((current) => ({
                          ...current,
                          website: e.target.value,
                        }))
                      }
                      placeholder="https://yourbrand.com"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-[#00f5ff]/40 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-gray-400">
                      GitHub
                    </label>
                    <input
                      type="url"
                      value={publicContactInput.github}
                      onChange={(e) =>
                        setPublicContactInput((current) => ({
                          ...current,
                          github: e.target.value,
                        }))
                      }
                      placeholder="https://github.com/yourname"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-[#00f5ff]/40 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-gray-400">
                      LinkedIn
                    </label>
                    <input
                      type="url"
                      value={publicContactInput.linkedin}
                      onChange={(e) =>
                        setPublicContactInput((current) => ({
                          ...current,
                          linkedin: e.target.value,
                        }))
                      }
                      placeholder="https://linkedin.com/in/yourname"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-[#00f5ff]/40 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-gray-400">
                      YouTube
                    </label>
                    <input
                      type="url"
                      value={publicContactInput.youtube}
                      onChange={(e) =>
                        setPublicContactInput((current) => ({
                          ...current,
                          youtube: e.target.value,
                        }))
                      }
                      placeholder="https://youtube.com/@yourname"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-[#00f5ff]/40 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="mb-1 block text-sm text-gray-400">
                    Contact note
                  </label>
                  <textarea
                    value={publicContactInput.contactNote}
                    onChange={(e) =>
                      setPublicContactInput((current) => ({
                        ...current,
                        contactNote: e.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="Example: Reach out for internships, collaborations, design critiques, or speaking opportunities."
                    className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-[#00f5ff]/40 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                <div className="rounded-xl border border-white/10 bg-white/3 p-4 text-sm text-gray-400">
                  <p>
                    Email: <span className="text-white">{account?.email ?? session?.user?.email}</span>
                  </p>
                  <p className="mt-1">
                    Public URL:{" "}
                    <span className="text-[#00f5ff]">
                      /u/{accountUsernameInput.trim().toLowerCase() || username || "yourname"}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Joined {account?.createdAt ? new Date(account.createdAt).toLocaleDateString() : "recently"}.
                    Account email changes are not editable here. Public contact email is optional and separate.
                  </p>
                </div>

                <button
                  onClick={handleSaveAccount}
                  disabled={savingAccount || !accountDirty}
                  className="rounded-xl bg-[#00f5ff] px-4 py-2.5 text-sm font-semibold text-black hover:bg-[#00e5ef] disabled:opacity-50"
                >
                  Save Profile
                </button>
              </div>
            </div>

            {billing && (
              <div
                id="settings-usage"
                className="scroll-mt-24 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
              >
                <div className="mb-1 flex items-center gap-2">
                  <ChartColumn className="h-[18px] w-[18px] text-[#00f5ff]" />
                  <h2 className="text-lg font-semibold">Usage</h2>
                </div>
                <p className="text-sm text-gray-400 mb-5">
                  Track your current advanced AI credits, fallback behavior, and monthly refresh cadence.
                </p>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <div className="rounded-2xl border border-white/10 bg-white/3 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                      Advanced AI usage
                    </p>
                    <p className="mt-2 text-sm font-medium text-white">
                      {billing.unlimitedAdvanced
                        ? "Unlimited advanced AI on this plan"
                        : `${billing.advancedCreditsRemaining} advanced credits left this cycle`}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {billing.unlimitedAdvanced
                        ? `${billing.plan.label} keeps every AI request on your advanced model.`
                        : `After your credits run out, requests automatically fall back to ${billing.standardModel}.`}
                    </p>
                    {!billing.unlimitedAdvanced && (
                      <div className="mt-3 h-2 rounded-full bg-white/5">
                        <div
                          className="h-2 rounded-full bg-[#00f5ff]"
                          style={{
                            width: `${Math.max(
                              0,
                              Math.min(
                                100,
                                ((billing.plan.monthlyAdvancedCredits ?? 0) -
                                  (billing.advancedCreditsRemaining ?? 0)) /
                                  Math.max(1, billing.plan.monthlyAdvancedCredits ?? 1) *
                                  100
                              )
                            )}%`,
                          }}
                        />
                      </div>
                    )}
                    <p className="mt-3 text-xs text-gray-500">
                      {billing.billingInterval === "year"
                        ? `Next monthly credit refresh: ${new Date(billing.cycleEndsAt).toLocaleDateString()}.`
                        : `Cycle resets on ${new Date(billing.cycleEndsAt).toLocaleDateString()}.`}
                    </p>
                    {billing.fallbackToStandard && (
                      <p className="mt-2 text-xs text-yellow-300">
                        Advanced credits are exhausted. AI is now using {billing.standardModel}.
                      </p>
                    )}
                    {!billing.unlimitedAdvanced && (
                      <button
                        onClick={() => {
                          if (billing.canManageSubscription) {
                            void handleOpenBillingPortal();
                            return;
                          }
                          void handleStartCheckout("plus", billingIntervalForCards);
                        }}
                        className="mt-3 inline-flex items-center gap-2 rounded-xl border border-[#00f5ff]/25 bg-[#00f5ff]/10 px-3 py-2 text-xs font-medium text-[#7ef4ff] transition hover:border-[#00f5ff]/40 hover:bg-[#00f5ff]/15"
                      >
                        {billing.planTier === "free"
                          ? "Upgrade to Plus"
                          : "Manage paid plan"}
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/3 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                      Credit policy
                    </p>
                    <p className="mt-2 text-sm font-medium text-white">
                      {billing.unlimitedAdvanced
                        ? "Unlimited advanced AI on this plan"
                        : "1 advanced AI run = 1 credit"}
                    </p>
                    <p className="mt-1 text-sm text-gray-300">
                      Plan: {billing.plan.label}
                    </p>
                    <p className="mt-1 text-sm text-gray-300">
                      Advanced model: {billing.advancedModel}
                    </p>
                    <p className="mt-1 text-sm text-gray-300">
                      Fallback: {billing.standardModel}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-gray-400">
                      AI intensity is configured in AI Preferences. Usage here is counted in credits, not token totals. Yearly billing still refreshes credits monthly.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {billing && (
              <div
                id="settings-billing"
                className="scroll-mt-24 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
              >
                <div className="mb-1 flex items-center gap-2">
                  <Sparkles className="h-[18px] w-[18px] text-[#00f5ff]" />
                  <h2 className="text-lg font-semibold">Billing</h2>
                </div>
                <p className="text-sm text-gray-400 mb-5">
                  Plans and intervals now come from Stripe. Use checkout to upgrade and the Stripe portal to manage changes, renewals, and cancellations.
                </p>
                {!stripeConfigured && (
                  <div className="mb-5 rounded-2xl border border-yellow-500/20 bg-yellow-500/8 p-4 text-sm text-yellow-100">
                    Stripe billing is not configured in this environment yet. AI preferences still save normally, but paid upgrades and subscription changes stay disabled until the Stripe env vars are present.
                  </div>
                )}
                {billing.subscriptionStatus === "past_due" && (
                  <div className="mb-5 rounded-2xl border border-yellow-500/20 bg-yellow-500/8 p-4 text-sm text-yellow-100">
                    Stripe marked this subscription as past due. Advanced access stays active for now, but you should update the payment method in the Stripe portal before the subscription moves to an unpaid or canceled state.
                  </div>
                )}
                {billing.cancelAtPeriodEnd && billing.subscriptionCurrentPeriodEnd && (
                  <div className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-200">
                    This subscription is scheduled to cancel at the end of the current period on{" "}
                    {new Date(billing.subscriptionCurrentPeriodEnd).toLocaleDateString()}.
                    Paid access stays active until then.
                  </div>
                )}

                <div className="mb-5 grid gap-4 xl:grid-cols-4">
                  <div className="rounded-2xl border border-white/10 bg-white/3 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                      Current plan
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {billing.plan.label}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {billing.planTier === "free"
                        ? "No active Stripe subscription yet."
                        : `${formatPlanPrice(
                            billing.plan,
                            billing.billingInterval ?? "month"
                          )}${formatPlanIntervalSuffix(
                            billing.billingInterval ?? "month"
                          )} billed through Stripe.`}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/3 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                      Billing interval
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {formatBillingIntervalLabel(billing.billingInterval)}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {billing.billingInterval === "year"
                        ? "Billed once a year, credits still refresh monthly."
                        : billing.billingInterval === "month"
                          ? "Billed every month."
                          : "Upgrade to Plus or Pro to start billing."}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/3 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                      Subscription status
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {formatSubscriptionStatus(billing.subscriptionStatus)}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {billing.cancelAtPeriodEnd
                        ? "Cancellation is scheduled at the end of the current period."
                        : billing.subscriptionStatus
                          ? "Stripe webhook sync controls access and renewal state."
                          : "You are currently on the free plan."}
                    </p>
                    {billingSyncedAt && (
                      <p className="mt-2 text-[11px] text-gray-500">
                        Last synced: {billingSyncedAt}
                      </p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/3 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                      Next renewal
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {nextRenewalDate ?? "Not scheduled"}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {billing.cancelAtPeriodEnd && nextRenewalDate
                        ? "Access stays active until this date."
                        : billing.subscriptionCurrentPeriodEnd
                          ? "Stripe reports the current period end here."
                          : "No paid renewal on file."}
                    </p>
                  </div>
                </div>

                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="inline-flex rounded-2xl border border-white/10 bg-white/4 p-1">
                    {availableIntervals.map((interval) => {
                      const isActive = billingIntervalForCards === interval;
                      return (
                        <button
                          key={interval}
                          type="button"
                          onClick={() => setSelectedBillingInterval(interval)}
                          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                            isActive
                              ? "bg-[#00f5ff] text-black"
                              : "text-gray-300 hover:text-white"
                          }`}
                        >
                          {interval === "year" ? "Yearly" : "Monthly"}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                    {hasYearlyBillingOption && (
                      <span className="rounded-full border border-[#00f5ff]/20 bg-[#00f5ff]/8 px-3 py-1 text-[#7ef4ff]">
                        Yearly pricing is 10 months effective
                      </span>
                    )}
                    {billing.canManageSubscription && stripeConfigured && (
                      <button
                        onClick={handleOpenBillingPortal}
                        disabled={updatingPlan}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/8 disabled:opacity-50"
                      >
                        Manage subscription
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mb-5 grid gap-4 md:grid-cols-3">
                  {availablePlans.map((plan) => {
                    const isCurrentPlan = billing.planTier === plan.id;
                    const isCurrentInterval =
                      billing.billingInterval === billingIntervalForCards;
                    const savingsCopy = getPlanSavingsCopy(
                      plan,
                      billingIntervalForCards
                    );
                    const cardPrice = formatPlanPrice(plan, billingIntervalForCards);
                    const buttonLabel =
                      plan.id === "free"
                        ? isCurrentPlan
                          ? "Current plan"
                          : stripeConfigured
                            ? "Downgrade in Stripe"
                            : "Stripe unavailable"
                        : !stripeConfigured
                          ? "Stripe unavailable"
                        : billing.canManageSubscription
                          ? isCurrentPlan && isCurrentInterval
                            ? "Manage in Stripe"
                            : "Change in Stripe"
                          : `Choose ${plan.label}`;
                    return (
                      <div
                        key={plan.id}
                        className={`rounded-2xl border p-4 ${
                          isCurrentPlan
                            ? "border-[#00f5ff]/40 bg-[#00f5ff]/8"
                            : "border-white/10 bg-white/3"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">{plan.label}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {cardPrice}
                              {plan.id === "free" ? "" : activePlanPriceSuffix}
                            </p>
                            {savingsCopy && (
                              <p className="mt-1 text-[11px] text-[#7ef4ff]">
                                {savingsCopy}
                              </p>
                            )}
                          </div>
                          {isCurrentPlan && (
                            <span className="rounded-full border border-[#00f5ff]/30 bg-[#00f5ff]/10 px-2 py-0.5 text-[11px] text-[#00f5ff]">
                              {billing.billingInterval === billingIntervalForCards
                                ? "Current"
                                : "Current plan"}
                            </span>
                          )}
                        </div>
                        <p className="mt-3 text-xs leading-relaxed text-gray-400">
                          {plan.summary}
                        </p>
                        <div className="mt-3 space-y-1.5">
                          {plan.highlights.map((highlight) => (
                            <p key={highlight} className="text-xs text-gray-300">
                              {highlight}
                            </p>
                          ))}
                        </div>
                        <button
                          onClick={() => {
                            if (plan.id === "free") {
                              if (billing.canManageSubscription) {
                                void handleOpenBillingPortal();
                              }
                              return;
                            }
                            void handleStartCheckout(plan.id, billingIntervalForCards);
                          }}
                          disabled={
                            updatingPlan ||
                            (plan.id !== "free" && !stripeConfigured) ||
                            (plan.id === "free" && !isCurrentPlan && !stripeConfigured) ||
                            (plan.id === "free" && !billing.canManageSubscription) ||
                            (plan.id === "free" && isCurrentPlan)
                          }
                          className={`mt-4 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                            (plan.id === "free" && isCurrentPlan)
                              ? "bg-white/5 text-gray-500"
                              : "bg-[#00f5ff] text-black hover:bg-[#00e5ef]"
                          } disabled:opacity-50`}
                        >
                          {buttonLabel}
                        </button>
                      </div>
                    );
                  })}
                </div>

                <p className="text-xs text-gray-500">
                  Usage details, current rate, and active models are tracked in the Usage section above. Yearly subscriptions still refresh credits every 30 days from the subscription anchor.
                </p>
              </div>
            )}

            <div
              id="settings-ai"
              className="scroll-mt-24 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
            >
              <div className="mb-1 flex items-center gap-2">
                <Bot className="h-[18px] w-[18px] text-[#00f5ff]" />
                <h2 className="text-lg font-semibold">AI Preferences</h2>
              </div>
              <p className="text-sm text-gray-400 mb-5">
                Choose the provider, AI intensity, and preferred advanced model. Auto rate means 1x. Lower intensity keeps outputs shorter and cheaper, while higher intensity allows longer responses.
              </p>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,220px)_minmax(0,170px)_minmax(0,1fr)_auto] lg:items-end">
                <div>
                  <label className="mb-1 block text-sm text-gray-400">
                    Provider
                  </label>
                  <select
                    value={selectedAiProvider}
                    onChange={(e) => {
                      const nextProvider = e.target.value as BillingProvider["id"];
                      setSelectedAiProvider(nextProvider);
                      if (nextProvider !== "auto" && preferredAiModelInput === "auto") {
                        setPreferredAiModelInput("");
                      }
                    }}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-[#00f5ff]/40 focus:outline-none"
                  >
                    {availableProviders.map((provider) => (
                      <option
                        key={provider.id}
                        value={provider.id}
                        disabled={!provider.available}
                      >
                        {provider.label}{provider.available ? "" : " (Unavailable)"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm text-gray-400">
                    AI intensity
                  </label>
                  <select
                    value={selectedAiUsageRate}
                    onChange={(e) => setSelectedAiUsageRate(e.target.value as BillingUsageRate["id"])}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-[#00f5ff]/40 focus:outline-none"
                  >
                    {availableUsageRates.map((rate) => (
                      <option key={rate.id} value={rate.id}>
                        {rate.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm text-gray-400">
                    Preferred advanced model
                  </label>
                  <div className="space-y-2">
                    <select
                      value={selectedModelPresetValue}
                      disabled={selectedAiProvider === "auto"}
                      onChange={(e) => {
                        const nextValue = e.target.value;
                        if (nextValue === "__custom__") {
                          if (
                            !preferredAiModelInput ||
                            selectedProviderModelOptions.some(
                              (option) => option.value === preferredAiModelInput
                            ) ||
                            preferredAiModelInput === "auto"
                          ) {
                            setPreferredAiModelInput("");
                          }
                          return;
                        }
                        setPreferredAiModelInput(nextValue);
                      }}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-[#00f5ff]/40 focus:outline-none disabled:opacity-60"
                    >
                      {selectedAiProvider === "auto" && (
                        <option value="auto">auto</option>
                      )}
                      {selectedAiProvider !== "auto" && (
                        <option value="">
                          Use provider default ({selectedProviderDef?.defaultAdvancedModel ?? "default"})
                        </option>
                      )}
                      {selectedProviderModelOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.note
                            ? `${option.label} · ${option.note}`
                            : option.label}
                        </option>
                      ))}
                      {selectedAiProvider !== "auto" && (
                        <option value="__custom__">Custom model…</option>
                      )}
                    </select>
                    {selectedAiProvider !== "auto" &&
                      selectedModelPresetValue === "__custom__" && (
                        <input
                          value={preferredAiModelInput}
                          onChange={(e) => setPreferredAiModelInput(e.target.value)}
                          placeholder={selectedProviderDef?.defaultAdvancedModel ?? "Enter model name"}
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-[#00f5ff]/40 focus:outline-none"
                        />
                      )}
                  </div>
                </div>

                <button
                  onClick={handleSaveAiPreferences}
                  disabled={updatingPlan || !aiPreferencesDirty}
                  className="rounded-xl bg-[#00f5ff] px-4 py-2.5 text-sm font-semibold text-black hover:bg-[#00e5ef] disabled:opacity-50"
                >
                  Save AI
                </button>
              </div>

              {selectedProviderDef && (
                <div className="mt-4 rounded-xl border border-white/10 bg-white/3 p-4 text-sm text-gray-400">
                  <p className="font-medium text-white mb-1">{selectedProviderDef.label}</p>
                  <p className="leading-relaxed">{selectedProviderDef.summary}</p>
                  <p className="mt-3 text-xs text-gray-500">
                    Default advanced model: {selectedProviderDef.defaultAdvancedModel}
                  </p>
                  <p className="text-xs text-gray-500">
                    Default fallback model: {selectedProviderDef.defaultStandardModel}
                  </p>
                  {selectedAiProvider === "openai" && (
                    <p className="mt-2 text-xs text-[#7ef4ff]">
                      GPT-5, GPT-5 mini, GPT-5 nano, and GPT-5.1 presets are available.
                    </p>
                  )}
                  <p className="mt-3 text-xs text-gray-500">
                    Current rate: {selectedAiUsageRate === "auto" ? "Auto (1x)" : selectedAiUsageRate}
                  </p>
                  {selectedUsageRateDef && (
                    <p className="text-xs text-gray-500">
                      {selectedUsageRateDef.summary}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Effective output multiplier: {billing?.tokenRateMultiplier ?? 1}x
                  </p>
                </div>
              )}
            </div>

            <div
              id="settings-agent"
              className="scroll-mt-24 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
            >
              <div className="mb-1 flex items-center gap-2">
                <WandSparkles className="h-[18px] w-[18px] text-[#00f5ff]" />
                <h2 className="text-lg font-semibold">Agent Defaults</h2>
              </div>
              <p className="text-sm text-gray-400 mb-5">
                Pin default expert and workflow skills for LifeAgent, and add a brand voice note the agent should keep in mind on every turn.
              </p>

              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm text-gray-400">
                    Default expert mode
                  </label>
                  <select
                    value={defaultPersonaSkillId}
                    onChange={(e) => setDefaultPersonaSkillId(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-[#00f5ff]/40 focus:outline-none"
                  >
                    {personaSkillOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm text-gray-400">
                    Default workflow
                  </label>
                  <select
                    value={defaultWorkflowSkillId}
                    onChange={(e) => setDefaultWorkflowSkillId(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-[#00f5ff]/40 focus:outline-none"
                  >
                    {workflowSkillOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-1 block text-sm text-gray-400">
                  Brand / voice instruction
                </label>
                <textarea
                  value={brandVoiceInstructionInput}
                  onChange={(e) => setBrandVoiceInstructionInput(e.target.value)}
                  placeholder="Example: Keep the tone calm, ambitious, and specific. Avoid hype words and make the work feel product-focused."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-[#00f5ff]/40 focus:outline-none"
                />
                <p className="mt-2 text-xs text-gray-500">
                  The agent reads this on every run. Use it for tone, voice, and how your personal brand should feel.
                </p>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="rounded-xl border border-white/10 bg-white/3 px-4 py-3 text-sm text-gray-400">
                  <p className="text-white">
                    Current defaults:{" "}
                    <span className="text-[#00f5ff]">
                      {defaultPersonaSkillId === "auto"
                        ? "Auto expert"
                        : personaSkillOptions.find((option) => option.id === defaultPersonaSkillId)?.label ?? "Custom expert"}
                    </span>
                    {" · "}
                    <span className="text-[#00f5ff]">
                      {defaultWorkflowSkillId === "auto"
                        ? "Auto workflow"
                        : workflowSkillOptions.find((option) => option.id === defaultWorkflowSkillId)?.label ?? "Custom workflow"}
                    </span>
                  </p>
                </div>

                <button
                  onClick={handleSaveAgentPreferences}
                  disabled={savingAgentPreferences || !agentPreferencesDirty}
                  className="rounded-xl bg-[#00f5ff] px-4 py-2.5 text-sm font-semibold text-black hover:bg-[#00e5ef] disabled:opacity-50"
                >
                  Save Agent Defaults
                </button>
              </div>
            </div>

            {/* ── Page Visibility — GitHub-style ── */}
            <div
              id="settings-public"
              className="scroll-mt-24 bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
            >
              <div className="px-6 pt-6 pb-4">
                <h2 className="text-lg font-semibold mb-1">Page Visibility</h2>
                <p className="text-sm text-gray-400">
                  Control who can see your portfolio — just like a GitHub repository.
                </p>
              </div>

              <button
                onClick={() => handleSetVisibility("public")}
                className={`w-full flex items-start gap-4 px-6 py-4 text-left border-t border-white/10 transition-colors ${
                  visibility === "public" ? "bg-green-500/10" : "hover:bg-white/3"
                }`}
              >
                <div className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  visibility === "public" ? "bg-green-500/20 border border-green-500/30" : "bg-white/5 border border-white/10"
                }`}>
                  <Globe className="h-4 w-4 text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Public</span>
                    {visibility === "public" && (
                      <span className="text-xs bg-green-500/15 border border-green-500/30 text-green-400 px-2 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Anyone can see your portfolio at{" "}
                    <span className="text-[#00f5ff]">/u/{username}</span>. It appears in Explore and public listings.
                  </p>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 mt-1 flex-shrink-0 flex items-center justify-center ${
                  visibility === "public" ? "border-green-500 bg-green-500" : "border-gray-600"
                }`}>
                  {visibility === "public" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </button>

              <button
                onClick={() => handleSetVisibility("unlisted")}
                className={`w-full flex items-start gap-4 px-6 py-4 text-left border-t border-white/10 transition-colors ${
                  visibility === "unlisted" ? "bg-blue-500/10" : "hover:bg-white/3"
                }`}
              >
                <div className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  visibility === "unlisted" ? "bg-blue-500/20 border border-blue-500/30" : "bg-white/5 border border-white/10"
                }`}>
                  <Link2 className="h-4 w-4 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Anyone with link</span>
                    {visibility === "unlisted" && (
                      <span className="text-xs bg-blue-500/15 border border-blue-500/30 text-blue-400 px-2 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Direct visitors can open your portfolio, but it stays out of Explore and public discovery surfaces.
                  </p>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 mt-1 flex-shrink-0 flex items-center justify-center ${
                  visibility === "unlisted" ? "border-blue-500 bg-blue-500" : "border-gray-600"
                }`}>
                  {visibility === "unlisted" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </button>

              <button
                onClick={() => handleSetVisibility("private")}
                className={`w-full flex items-start gap-4 px-6 py-4 text-left border-t border-white/10 transition-colors ${
                  visibility === "private" ? "bg-yellow-500/10" : "hover:bg-white/3"
                }`}
              >
                <div className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  visibility === "private" ? "bg-yellow-500/20 border border-yellow-500/30" : "bg-white/5 border border-white/10"
                }`}>
                  <Lock className="h-4 w-4 text-yellow-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Private</span>
                    {visibility === "private" && (
                      <span className="text-xs bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 px-2 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Only you can see this portfolio. Direct links, custom domains, Explore, and resume export all stay blocked.
                  </p>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 mt-1 flex-shrink-0 flex items-center justify-center ${
                  visibility === "private" ? "border-yellow-500 bg-yellow-500" : "border-gray-600"
                }`}>
                  {visibility === "private" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </button>

              <div className="px-6 py-3 bg-white/2 border-t border-white/10">
                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                  {savingSettings ? (
                    <><span className="w-1.5 h-1.5 rounded-full bg-[#00f5ff] animate-pulse" />Saving…</>
                  ) : (
                    <><span className="w-1.5 h-1.5 rounded-full bg-green-500" />Changes save instantly</>
                  )}
                </p>
              </div>
            </div>

            {/* ── Theme ── */}
            <div
              id="settings-theme"
              className="scroll-mt-24 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
            >
              <div className="mb-1 flex items-center gap-2">
                <Palette className="h-[18px] w-[18px] text-[#00f5ff]" />
                <h2 className="text-lg font-semibold">Theme</h2>
              </div>
              <p className="mb-4 text-sm text-gray-400">
                Choose the look of your public portfolio page. The agent can also create a custom variant on top of these preset directions.
              </p>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {PORTFOLIO_THEME_PRESETS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSetTheme(t.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      theme === t.id
                        ? "border-[#00f5ff] bg-[#00f5ff]/5"
                        : "border-white/10 hover:border-white/20 bg-white/3"
                    }`}
                  >
                    <div
                      className="mb-3 h-20 rounded-lg border p-3"
                      style={{
                        background: t.previewBackground,
                        borderColor: `${t.accent}33`,
                      }}
                    >
                      <div
                        className="mb-1.5 h-1.5 w-12 rounded"
                        style={{ background: `${t.accent}cc` }}
                      />
                      <div
                        className="mb-1 h-1 w-20 rounded"
                        style={{
                          background:
                            t.variant === "dark"
                              ? "rgba(255,255,255,0.22)"
                              : "rgba(30,30,30,0.18)",
                        }}
                      />
                      <div
                        className="h-1 w-16 rounded"
                        style={{
                          background:
                            t.variant === "dark"
                              ? "rgba(255,255,255,0.12)"
                              : "rgba(30,30,30,0.1)",
                        }}
                      />
                      <div className="mt-2 flex gap-1">
                        <div
                          className="rounded border px-1.5 py-0.5 text-[6px]"
                          style={{
                            background: `${t.accent}22`,
                            borderColor: `${t.accent}33`,
                            color: t.variant === "dark" ? t.accentSoft : t.accent,
                          }}
                        >
                          React
                        </div>
                        <div
                          className="rounded border px-1.5 py-0.5 text-[6px]"
                          style={{
                            background: `${t.accentSecondary}22`,
                            borderColor: `${t.accentSecondary}33`,
                            color:
                              t.variant === "dark"
                                ? t.accentSoft
                                : t.accentSecondary,
                          }}
                        >
                          Brand
                        </div>
                      </div>
                    </div>
                    <div className="font-semibold text-sm">{t.label}</div>
                    <div className="mt-0.5 text-xs text-gray-500">
                      {t.category} · {t.heroLayout} hero · {t.projectLayout} projects · {t.timelineLayout} timeline
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {t.variant === "dark" ? "Dark" : "Light"} · {t.displayFont}/{t.bodyFont} · {t.description}
                    </div>
                    {theme === t.id && (
                      <div className="text-xs text-[#00f5ff] mt-1">Active</div>
                    )}
                  </button>
                ))}
              </div>
              {theme === "custom" && (
                <div className="mt-4 rounded-xl border border-[#00f5ff]/20 bg-[#00f5ff]/5 p-4">
                  <p className="text-sm font-medium text-[#8ef6ff]">Custom theme active</p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-300">
                    This portfolio is using an agent-generated variant
                    {themeConfig?.baseThemeId ? ` built on ${themeConfig.baseThemeId}` : ""}.
                    Pick a preset above to reset it, or use the agent tool to redesign it again.
                  </p>
                </div>
              )}
            </div>

            <div
              id="settings-resume"
              className="scroll-mt-24 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
            >
              <div className="mb-1 flex items-center gap-2">
                <FileText className="h-[18px] w-[18px] text-[#00f5ff]" />
                <h2 className="text-lg font-semibold">Resume Model</h2>
              </div>
              <p className="mb-4 text-sm text-gray-400">
                Choose the layout system for your separate public resume page. The agent can apply one of these presets or generate a custom variant safely on top of them.
              </p>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {RESUME_MODEL_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSetResumeModel(preset.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      resumeModel === preset.id
                        ? "border-[#00f5ff] bg-[#00f5ff]/5"
                        : "border-white/10 hover:border-white/20 bg-white/3"
                    }`}
                  >
                    <div
                      className="mb-3 rounded-lg border p-3"
                      style={{
                        background: `linear-gradient(180deg, ${preset.sheetStart}, ${preset.sheetEnd})`,
                        borderColor: `${preset.accent}33`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div
                            className="h-1.5 w-16 rounded"
                            style={{ background: `${preset.accent}cc` }}
                          />
                          <div
                            className="mt-2 h-1 w-24 rounded"
                            style={{ background: "rgba(33,25,18,0.18)" }}
                          />
                          <div
                            className="mt-1 h-1 w-16 rounded"
                            style={{ background: "rgba(33,25,18,0.12)" }}
                          />
                        </div>
                        {preset.asideLayout !== "hidden" && (
                          <div
                            className="w-12 rounded border px-2 py-1 text-[6px] uppercase tracking-[0.14em]"
                            style={{
                              borderColor: `${preset.accent}2a`,
                              background: `${preset.accentSoft}cc`,
                              color: preset.accent,
                            }}
                          >
                            {preset.asideLayout}
                          </div>
                        )}
                      </div>
                      <div className="mt-3 flex gap-1">
                        {[0, 1, 2].map((index) => (
                          <div
                            key={index}
                            className="h-9 flex-1 rounded border"
                            style={{
                              borderColor: `${preset.accent}24`,
                              background:
                                preset.sectionStyle === "cards"
                                  ? "rgba(255,255,255,0.74)"
                                  : preset.sectionStyle === "bands"
                                    ? `${preset.accentSoft}aa`
                                    : "rgba(255,255,255,0.35)",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="font-semibold text-sm">{preset.label}</div>
                    <div className="mt-0.5 text-xs text-gray-500">
                      {preset.headerLayout} header · {preset.asideLayout} aside · {preset.sectionStyle} sections
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {preset.displayFont}/{preset.bodyFont} · {preset.description}
                    </div>
                    {resumeModel === preset.id && (
                      <div className="text-xs text-[#00f5ff] mt-1">Active</div>
                    )}
                  </button>
                ))}
              </div>
              {resumeModel === "custom" && (
                <div className="mt-4 rounded-xl border border-[#00f5ff]/20 bg-[#00f5ff]/5 p-4">
                  <p className="text-sm font-medium text-[#8ef6ff]">Custom resume model active</p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-300">
                    This public resume is using an agent-generated variant
                    {resumeModelConfig?.baseModelId ? ` built on ${resumeModelConfig.baseModelId}` : ""}.
                    Pick a preset above to reset it, or use the agent tool to redesign the resume page again.
                  </p>
                </div>
              )}
            </div>

            <div
              id="settings-deploy"
              className="scroll-mt-24 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
            >
              <div className="mb-1 flex items-center gap-2">
                <Globe className="h-[18px] w-[18px] text-[#00f5ff]" />
                <h2 className="text-lg font-semibold">Deploy</h2>
              </div>
              <p className="text-sm text-gray-400 mb-5">
                Launch scope is intentionally narrow for safety: users can connect subdomains like <code className="rounded bg-white/5 px-1.5 py-0.5 text-[#8ef6ff]">portfolio.example.com</code>. Root/apex domains stay behind a later milestone until they are fully implemented.
              </p>

              <div className="mb-5 grid gap-3 md:grid-cols-4">
                {[
                  {
                    step: "01",
                    title: "Choose a subdomain",
                    desc: "Use a hostname you control, not the root domain.",
                  },
                  {
                    step: "02",
                    title: "Save the request",
                    desc: "LifePage provisions the managed hostname when Cloudflare SaaS is ready.",
                  },
                  {
                    step: "03",
                    title: "Add the CNAME",
                    desc: "Point the requested hostname at the target shown below.",
                  },
                  {
                    step: "04",
                    title: "Verify and wait for SSL",
                    desc: "DNS must match first. The domain only goes live after SSL is active too.",
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#00f5ff]">
                      Step {item.step}
                    </p>
                    <p className="mt-2 text-sm font-medium text-white">{item.title}</p>
                    <p className="mt-2 text-xs leading-6 text-gray-400">{item.desc}</p>
                  </div>
                ))}
              </div>

              {!cloudflareSaasConfigured && (
                <div className="mb-5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                  Managed domain provisioning is paused in this environment because the Cloudflare SaaS setup is incomplete. You can still save the requested hostname now; verification will stay paused until provider setup is finished.
                </div>
              )}

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto] lg:items-end">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Requested subdomain
                  </label>
                  <input
                    value={customDomainInput}
                    onChange={(e) => setCustomDomainInput(e.target.value)}
                    placeholder="portfolio.example.com"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#00f5ff]/50 text-sm"
                  />
                  <p className="mt-2 text-xs leading-6 text-gray-500">
                    Example: <span className="text-[#8ef6ff]">portfolio.example.com</span>. Root domains like <span className="text-gray-300">example.com</span> are not part of this launch.
                  </p>
                  {inputLooksLikeApexCandidate && (
                    <p className="mt-2 text-xs text-amber-200">
                      That looks like an apex/root domain. Use a subdomain such as <span className="text-[#8ef6ff]">portfolio.{normalizedCustomDomainInput}</span> instead.
                    </p>
                  )}
                </div>

                <button
                  onClick={handleSaveCustomDomain}
                  disabled={
                    savingSettings || !hasCustomDomainChanges
                  }
                  className="inline-flex items-center justify-center gap-2 bg-[#00f5ff] text-black px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#00e5ef] transition-colors disabled:opacity-50"
                >
                  Save Hostname
                </button>

                <button
                  onClick={handleVerifyCustomDomain}
                  disabled={savingSettings || verifyingDomain || !canVerifyCustomDomain}
                  className="inline-flex items-center justify-center gap-2 border border-white/10 px-4 py-2.5 rounded-lg text-sm text-gray-200 hover:border-white/20 hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  {customDomainVerifyLabel}
                </button>

                <button
                  onClick={handleClearCustomDomain}
                  disabled={savingSettings || !customDomain}
                  className="inline-flex items-center justify-center gap-2 border border-white/10 px-4 py-2.5 rounded-lg text-sm text-gray-300 hover:border-white/20 hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  Clear
                </button>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/3 p-4 text-sm text-gray-400">
                  <p className="font-medium text-white mb-2">Requested domain</p>
                  <p className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white">
                    {normalizedCustomDomainInput || customDomain || "portfolio.example.com"}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`mt-3 rounded-full border px-2.5 py-1 text-xs ${getDomainStatusTone(customDomainStatus)}`}
                    >
                      {formatCustomDomainStatus(customDomainStatus)}
                    </span>
                    <span
                      className={`mt-3 rounded-full border px-2.5 py-1 text-xs ${getDomainStatusTone(customDomainDnsStatus)}`}
                    >
                      {formatCustomDomainDnsStatus(customDomainDnsStatus)}
                    </span>
                    {customDomainLastCheckedLabel && (
                      <span className="mt-3 text-xs text-gray-500">
                        Last checked: {customDomainLastCheckedLabel}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 leading-relaxed">
                    {getCustomDomainStatusCopy(customDomainStatus)}
                  </p>
                  <p className="mt-3 text-xs leading-6 text-gray-500">
                    Public traffic only switches over after both the Cloudflare hostname status and SSL status are active.
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/3 p-4 text-sm text-gray-400">
                  <p className="font-medium text-white mb-2">Required CNAME</p>
                  <p className="leading-relaxed">
                    Add a single CNAME for <code className="text-[#00f5ff] bg-[#00f5ff]/10 px-1.5 py-0.5 rounded">{customDomainVerificationName || normalizedCustomDomainInput || customDomain || "portfolio.example.com"}</code> that points to{" "}
                    <code className="text-[#00f5ff] bg-[#00f5ff]/10 px-1.5 py-0.5 rounded">{customDomainTargetHost || "waiting for provider setup"}</code>.
                  </p>
                  <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-gray-300">
                    <p>
                      Record name:{" "}
                      <code className="text-[#7ef4ff]">
                        {customDomainVerificationName || normalizedCustomDomainInput || customDomain || "portfolio.example.com"}
                      </code>
                    </p>
                    <p className="mt-1">
                      Target value:{" "}
                      <code className="text-[#7ef4ff]">
                        {customDomainVerificationValue || customDomainTargetHost || "waiting for provider setup"}
                      </code>
                    </p>
                  </div>
                  {customDomainDiagnostics?.dns?.observedValues?.length ? (
                    <p className="mt-3 text-xs leading-6 text-amber-100">
                      DNS currently resolves to{" "}
                      <span className="text-[#8ef6ff]">
                        {customDomainDiagnostics.dns.observedValues.join(", ")}
                      </span>.
                    </p>
                  ) : null}
                </div>

                <div className="rounded-xl border border-white/10 bg-white/3 p-4 text-sm text-gray-400">
                  <p className="font-medium text-white mb-2">Verification and SSL</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-gray-300">
                      Hostname {formatExternalStatusLabel(customDomainProviderStatus)}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-gray-300">
                      SSL {formatExternalStatusLabel(customDomainSslStatus)}
                    </span>
                    {customDomainProviderId && (
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-gray-300">
                        Cloudflare ID {customDomainProviderId}
                      </span>
                    )}
                  </div>
                  {customDomainProviderError && (
                    <p className="mt-3 text-xs text-yellow-300">
                      Cloudflare: {customDomainProviderError}
                    </p>
                  )}
                  {hasActiveCustomDomain && (
                    <a
                      href={`https://${customDomain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-[#00f5ff] hover:underline"
                    >
                      Open connected domain
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {hasSavedCustomDomain && !hasActiveCustomDomain && (
                    <p className="mt-3 text-xs text-gray-500 leading-6">
                      The hostname is saved, but it will not resolve publicly until DNS is verified and SSL activation completes.
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-white/10 bg-white/3 p-4 text-sm text-gray-400">
                  <p className="font-medium text-white mb-2">Troubleshooting</p>
                  <ul className="space-y-2 text-xs leading-6 text-gray-300">
                    {customDomainTroubleshootingItems.map((item) => (
                      <li key={item} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                        {item}
                      </li>
                    ))}
                    {!customDomainTroubleshootingItems.length && (
                      <li className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                        Save a subdomain to begin the launch-safe custom-domain flow.
                      </li>
                    )}
                  </ul>
                  {customDomainError && (
                    <p
                      className={`mt-3 text-xs ${
                        customDomainStatus === "error"
                          ? "text-red-300"
                          : "text-amber-200"
                      }`}
                    >
                      {customDomainError}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ── Danger Zone ── */}
            <div className="bg-white/5 border border-red-500/20 rounded-2xl p-6">
              <h2 className="mb-1 inline-flex items-center gap-2 text-lg font-semibold text-red-400">
                <TriangleAlert className="h-[18px] w-[18px]" />
                Danger Zone
              </h2>
              <p className="text-sm text-gray-400 mb-4">
                Regenerate your entire profile from scratch using your existing evidence.
              </p>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="inline-flex items-center gap-2 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                <RefreshCcw className={`h-4 w-4 ${generating ? "animate-spin" : ""}`} />
                {generating ? "Regenerating…" : "Regenerate Profile"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 px-6 text-center text-gray-600 text-xs mt-20">
        Built by{" "}
        <a
          href="https://atrak.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#00f5ff]/70 hover:text-[#00f5ff]"
        >
          atrak.dev
        </a>
      </footer>
    </div>
  );
}
