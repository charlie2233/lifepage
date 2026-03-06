"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  encodeAgentFocusValue,
  parseAgentFocusValue,
  type AgentFocusSelection,
} from "@/lib/agent-focus";
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
  title?: string | null;
  description?: string | null;
  screenshot?: string | null;
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
  enabled: boolean;
  lastRun?: string | null;
  nextRun?: string | null;
  lastStatus?: string | null;
  lastError?: string | null;
  runCount: number;
}

interface AgentArtifact {
  id: string;
  tool: string;
  style?: string | null;
  output: unknown;
  createdAt: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  tool?: string;
  style?: string;
  output?: unknown;
  artifactId?: string;
  focusLabel?: string;
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
  monthlyAdvancedCredits: number | null;
  summary: string;
  highlights: string[];
}
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
  type?: "chat" | "tool_result";
  reply?: string;
  tool?: string;
  style?: string;
  output?: unknown;
  artifactId?: string;
  focusLabel?: string;
  billing?: BillingSnapshot;
  error?: string;
  artifacts?: AgentArtifact[];
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
interface ApiBillingResponse {
  billing?: BillingSnapshot;
  plans?: BillingPlan[];
  providers?: BillingProvider[];
  usageRates?: BillingUsageRate[];
  error?: string;
}
interface AccountSettings {
  name: string | null;
  username: string | null;
  email: string;
  createdAt: string;
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

function splitCrawlInput(value: string) {
  return value
    .split(/[\n,]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function humanizeAgentToolName(tool: string) {
  if (tool === "set_portfolio_theme") {
    return "portfolio theme";
  }
  if (tool === "set_resume_model") {
    return "resume model";
  }
  return tool.replace(/^generate_/, "").replace(/_/g, " ");
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

// ── Artifact renderer dispatcher ─────────────────────────────────────────────

function ArtifactRenderer({ tool, output }: { tool: string; output: unknown }) {
  if (tool === "generate_timeline") return <TimelineArtifact output={output} />;
  if (tool === "generate_video_script") return <VideoScriptArtifact output={output} />;
  if (tool === "generate_tree") return <TreeArtifact output={output} />;
  if (tool === "set_portfolio_theme") return <ThemeArtifact output={output} />;
  if (tool === "set_resume_model") return <ResumeModelArtifact output={output} />;
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
];

// ── Main dashboard ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
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
  const [currentHost, setCurrentHost] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [account, setAccount] = useState<AccountSettings | null>(null);
  const [accountNameInput, setAccountNameInput] = useState("");
  const [accountUsernameInput, setAccountUsernameInput] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);
  const [billing, setBilling] = useState<BillingSnapshot | null>(null);
  const [availablePlans, setAvailablePlans] = useState<BillingPlan[]>([]);
  const [availableProviders, setAvailableProviders] = useState<BillingProvider[]>([]);
  const [availableUsageRates, setAvailableUsageRates] = useState<BillingUsageRate[]>([]);
  const [selectedAiProvider, setSelectedAiProvider] = useState<BillingProvider["id"]>("kimi");
  const [selectedAiUsageRate, setSelectedAiUsageRate] = useState<BillingUsageRate["id"]>("auto");
  const [preferredAiModelInput, setPreferredAiModelInput] = useState("");
  const [updatingPlan, setUpdatingPlan] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>("crawl");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // ── Agent state ────────────────────────────────────────────────────────────
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [agentLoading, setAgentLoading] = useState(false);
  const [savedArtifacts, setSavedArtifacts] = useState<AgentArtifact[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>("");
  const [selectedStyle, setSelectedStyle] = useState<string>("");
  const [selectedFocusValue, setSelectedFocusValue] = useState("all");

  // ── Automation state ───────────────────────────────────────────────────────
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [newAutomation, setNewAutomation] = useState({
    name: "",
    action: "regenerate_profile",
    schedule: "weekly",
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

  const fetchData = useCallback(async () => {
    const [ev, pr, st, arts, billingRes, accountRes, autos] = await Promise.all([
      fetch("/api/evidence").then((r) => r.json() as Promise<ApiEvidenceResponse>),
      fetch("/api/profile").then((r) => r.json() as Promise<ApiProfileResponse>),
      fetch("/api/settings").then((r) =>
        r.json() as Promise<{
          settings?: {
            isPublic: boolean;
            visibility?: PublicPageVisibility | null;
            theme: PortfolioThemeId;
            themeConfig?: PortfolioThemeConfig | null;
            resumeModel?: ResumeModelId;
            resumeModelConfig?: ResumeModelConfig | null;
            mode: string;
            customDomain?: string | null;
          } | null;
        }>
      ),
      fetch("/api/agent").then((r) => r.json() as Promise<ApiAgentResponse>),
      fetch("/api/billing").then((r) => r.json() as Promise<ApiBillingResponse>),
      fetch("/api/account").then((r) => r.json() as Promise<ApiAccountResponse>),
      fetch("/api/automations").then((r) => r.json() as Promise<ApiAutomationResponse>),
    ]);
    setEvidence(ev.items ?? []);
    if (pr.profile) setProfile(pr.profile);
    if (st.settings) {
      setVisibility(normalizeVisibility(st.settings));
      setTheme(normalizePortfolioThemeId(st.settings.theme));
      setThemeConfig(st.settings.themeConfig ?? null);
      setResumeModel(normalizeResumeModelId(st.settings.resumeModel));
      setResumeModelConfig(st.settings.resumeModelConfig ?? null);
      setMode((st.settings.mode as "hiring" | "admissions") ?? "hiring");
      setCustomDomain(st.settings.customDomain ?? "");
      setCustomDomainInput(st.settings.customDomain ?? "");
    }
    setSavedArtifacts(arts.artifacts ?? []);
    setBilling(billingRes.billing ?? null);
    setAvailablePlans(billingRes.plans ?? []);
    setAvailableProviders(billingRes.providers ?? []);
    setAvailableUsageRates(billingRes.usageRates ?? []);
    setSelectedAiProvider(billingRes.billing?.aiProvider ?? "kimi");
    setSelectedAiUsageRate(billingRes.billing?.aiUsageRate ?? "auto");
    setPreferredAiModelInput(billingRes.billing?.preferredAiModel ?? "");
    setAccount(accountRes.account ?? null);
    setAccountNameInput(accountRes.account?.name ?? "");
    setAccountUsernameInput(accountRes.account?.username ?? "");
    setAutomations(autos.automations ?? []);
  }, []);

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
      const data = (await res.json()) as {
        settings?: {
          isPublic: boolean;
          visibility?: PublicPageVisibility | null;
          theme: PortfolioThemeId;
          themeConfig?: PortfolioThemeConfig | null;
          resumeModel?: ResumeModelId;
          resumeModelConfig?: ResumeModelConfig | null;
          mode: string;
          customDomain?: string | null;
        } | null;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to save settings.");
      }
      if (data.settings) {
        setTheme(normalizePortfolioThemeId(data.settings.theme));
        setThemeConfig(data.settings.themeConfig ?? null);
        setResumeModel(normalizeResumeModelId(data.settings.resumeModel));
        setResumeModelConfig(data.settings.resumeModelConfig ?? null);
      }
      setMessage({ type: "success", text: "Settings saved." });
      return data.settings ?? null;
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

  const handleChangePlan = async (planTier: BillingPlan["id"]) => {
    setUpdatingPlan(true);
    try {
      const res = await fetch("/api/billing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planTier }),
      });
      const data = (await res.json()) as ApiBillingResponse;
      if (!res.ok || !data.billing) {
        throw new Error(data.error ?? "Failed to change plan.");
      }
      setBilling(data.billing);
      setAvailablePlans(data.plans ?? availablePlans);
      setAvailableProviders(data.providers ?? availableProviders);
      setAvailableUsageRates(data.usageRates ?? availableUsageRates);
      setSelectedAiProvider(data.billing.aiProvider);
      setSelectedAiUsageRate(data.billing.aiUsageRate);
      setPreferredAiModelInput(data.billing.preferredAiModel ?? "");
      setMessage({
        type: "success",
        text: `Plan updated to ${data.billing.plan.label}.`,
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to change plan.",
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
      setAvailableProviders(data.providers ?? availableProviders);
      setAvailableUsageRates(data.usageRates ?? availableUsageRates);
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
    const settings = await saveSettings({
      customDomain: customDomainInput.trim() || null,
    });

    if (settings) {
      const savedDomain = settings.customDomain ?? "";
      setCustomDomain(savedDomain);
      setCustomDomainInput(savedDomain);
    }
  };

  const handleClearCustomDomain = async () => {
    const settings = await saveSettings({ customDomain: null });
    if (settings) {
      setCustomDomain("");
      setCustomDomainInput("");
    }
  };

  const handleSaveAccount = async () => {
    const normalizedName = accountNameInput.trim();
    const normalizedUsername = accountUsernameInput.trim().toLowerCase();
    const payload: { name?: string | null; username?: string } = {};

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
    setCurrentHost(window.location.hostname);
  }, []);

  // ── Agent handlers ──────────────────────────────────────────────────────────

  const handleAgentChat = async () => {
    if (!chatInput.trim() && !selectedTool) return;
    const focusLabel =
      activeFocusValue === "all" ? undefined : activeFocusOption?.label;
    const userMsg =
      chatInput.trim() ||
      `Generate ${humanizeAgentToolName(selectedTool)} (${selectedStyle})${
        focusLabel ? ` for ${focusLabel}` : ""
      }`;
    setAgentLoading(true);
    setChatInput("");

    const newHistory: ChatMessage[] = [
      ...chatHistory,
      { role: "user", content: userMsg, focusLabel },
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

      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as ApiAgentResponse;
      if (!res.ok) throw new Error(data.error ?? "Agent error");
      if (data.billing) setBilling(data.billing);
      if (data.tool === "set_portfolio_theme" && data.output) {
        const themeOutput = data.output as ThemeArtifactOutput;
        setTheme(themeOutput.themeId);
        setThemeConfig(themeOutput.themeConfig ?? null);
      } else if (data.tool === "set_resume_model" && data.output) {
        const resumeModelOutput = data.output as ResumeModelArtifactOutput;
        setResumeModel(normalizeResumeModelId(resumeModelOutput.modelId));
        setResumeModelConfig(resumeModelOutput.modelConfig ?? null);
      }

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content:
          data.reply ??
          (data.type === "tool_result"
            ? `Generated ${humanizeAgentToolName(data.tool ?? "")}${
                data.style ? ` (${data.style} style)` : ""
              }${data.focusLabel ? ` for ${data.focusLabel}` : ""}`
            : ""),
        tool: data.tool,
        style: data.style,
        output: data.output,
        artifactId: data.artifactId,
        focusLabel: data.focusLabel,
      };
      setChatHistory([...newHistory, assistantMsg]);

      if (data.artifactId) {
        // Refresh saved artifacts
        const arts = await fetch("/api/agent").then((r) => r.json() as Promise<ApiAgentResponse>);
        setSavedArtifacts(arts.artifacts ?? []);
      }
    } catch (err) {
      setChatHistory([...newHistory, { role: "assistant", content: `Error: ${String(err)}` }]);
    } finally {
      setAgentLoading(false);
      setSelectedTool("");
      setSelectedStyle("");
    }
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
      setNewAutomation({ name: "", action: "regenerate_profile", schedule: "weekly", config: {} });
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
    if (requestedUrls.length === 0) return;

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
          ? `Crawled ${crawledItems[0]?.title ?? requestedUrls[0]}`
          : `Crawled ${crawledItems.length} sources`;
      const failureText =
        failedResults.length > 0
          ? ` ${failedResults.length} failed.`
          : "";

      setMessage({
        type: "success",
        text: `${successText}.${failureText}`,
      });
      setUrlInput("");
      await fetchData();
    } catch (err) {
      setMessage({ type: "error", text: String(err) });
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
        text: "Profile generated. Check your public page.",
      });
      setActiveTab("profile");
    } catch (err) {
      setMessage({ type: "error", text: String(err) });
    } finally {
      setGenerating(false);
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
      <div className="min-h-screen bg-[#080d10] flex items-center justify-center">
        <div className="inline-flex items-center gap-3 text-white/80">
          <LoaderCircle className="h-5 w-5 animate-spin text-[#00f5ff]" />
          <span className="animate-pulse">Loading dashboard...</span>
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
  const dnsTargetHost =
    currentHost &&
    !["localhost", "127.0.0.1", "::1", "[::1]"].includes(currentHost)
      ? currentHost
      : "your-app-host";
  const selectedProviderDef =
    availableProviders.find((provider) => provider.id === selectedAiProvider) ??
    availableProviders[0] ??
    null;
  const selectedUsageRateDef =
    availableUsageRates.find((rate) => rate.id === selectedAiUsageRate) ??
    availableUsageRates[0] ??
    null;
  const normalizedPreferredAiModelInput =
    selectedAiProvider === "auto" ? "auto" : preferredAiModelInput;
  const aiPreferencesDirty =
    billing != null &&
    (selectedAiProvider !== billing.aiProvider ||
      selectedAiUsageRate !== billing.aiUsageRate ||
      normalizedPreferredAiModelInput !== (billing.preferredAiModel ?? ""));
  const accountDirty =
    (accountNameInput.trim() || "") !== (account?.name ?? "") ||
    accountUsernameInput.trim().toLowerCase() !== (account?.username ?? "");
  const advancedCreditsCap = billing?.plan.monthlyAdvancedCredits ?? null;
  const advancedCreditsUsed = billing?.advancedCreditsUsed ?? 0;
  const advancedCreditsRemaining = billing?.advancedCreditsRemaining ?? null;
  const advancedCreditsProgress = advancedCreditsCap
    ? Math.max(
        0,
        Math.min(100, (advancedCreditsUsed / Math.max(1, advancedCreditsCap)) * 100)
      )
    : 0;

  return (
    <div className="min-h-screen bg-[#080d10] text-white"
      style={{
        backgroundImage: "radial-gradient(circle at 15% 15%, rgba(0,245,255,0.06), transparent 35%), radial-gradient(circle at 85% 80%, rgba(121,229,210,0.05), transparent 30%)",
      }}
    >
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
                : "border-red-500/25 bg-red-500/8 text-red-400"
            }`}
          >
            {message.text}
          </div>
        )}

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
            {/* URL Crawler */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <div className="mb-2 flex items-center gap-2">
                <Search className="h-[18px] w-[18px] text-[#00f5ff]" />
                <h2 className="text-lg font-semibold">Web Crawler</h2>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Paste any URL — your website, GitHub profile, project page, or
                YouTube channel. Separate multiple URLs with commas and the AI
                agent will crawl each source, take screenshots, and extract your
                story automatically. Google Sites roots expand into linked
                subpages from the same portfolio.
              </p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCrawl()}
                  placeholder="https://atrak.dev, https://github.com/yourname..."
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#00f5ff]/50"
                />
                <button
                  onClick={handleCrawl}
                  disabled={crawling || !urlInput.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#00f5ff,#79e5d2)] px-6 py-2.5 font-medium text-black shadow-[0_8px_24px_rgba(0,245,255,0.2)] transition-all hover:shadow-[0_12px_32px_rgba(0,245,255,0.3)] hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 whitespace-nowrap"
                >
                  {crawling ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Crawling...
                    </>
                  ) : (
                    <>
                      Crawl
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
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
            {evidence.length > 0 && (
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
                          className="w-24 h-16 object-cover rounded-lg border border-white/10 flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {item.title ?? item.url}
                        </p>
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
            )}

            {/* Generate Button */}
            <div className="flex justify-center pt-4">
              <button
                onClick={handleGenerate}
                disabled={
                  generating || (evidence.length === 0 && !userInfo.bio)
                }
                className="inline-flex items-center gap-2 bg-[#00f5ff] text-black px-12 py-4 rounded-full text-lg font-semibold hover:bg-[#00c8d4] transition-colors disabled:opacity-50"
              >
                {generating
                  ? (
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
            {evidence.length === 0 && !userInfo.bio && (
              <p className="text-center text-gray-500 text-sm">
                Crawl at least one URL or fill in your bio to generate your
                profile.
              </p>
            )}
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
                        {profile.data.projects.slice(0, 3).map((p) => (
                          <div
                            key={p.title}
                            className="border border-white/10 rounded-xl p-4"
                          >
                            <h4 className="font-semibold mb-2">{p.title}</h4>
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
                          </div>
                        ))}
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
                  Go to the Crawl tab, add some URLs, and click Generate.
                </p>
                <button
                  onClick={() => setActiveTab("crawl")}
                  className="inline-flex items-center gap-2 bg-[#00f5ff] text-black px-6 py-2.5 rounded-full font-medium"
                >
                  Start crawling
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
                      Credits reset automatically at the start of the next cycle.
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
                      <p>Automation runs only spend a credit when they use the advanced model.</p>
                      <p>Fallback runs do not spend advanced credits after your allowance is exhausted.</p>
                    </div>
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
                <h2 className="text-lg font-semibold">AI Agent Tools</h2>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Ask the agent anything, or pick a tool to generate timelines, video scripts, and skill trees. You can scope it to a specific part so it knows exactly where to work.
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

              <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
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
                    Active focus
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {activeFocusOption.label}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-400">
                    {activeFocusOption.hint}
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
                      setSelectedTool(t.tool === selectedTool ? "" : t.tool);
                      setSelectedStyle(t.styles[0] ?? "");
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
                      ) : (
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
                    : `Generate ${humanizeAgentToolName(selectedTool)} (${selectedStyle})${
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
                <p className="inline-flex items-center gap-2 font-medium text-sm">
                  <MessageSquare className="h-4 w-4 text-[#00f5ff]" />
                  Chat with Agent
                </p>
                <p className="text-xs text-gray-400">
                  Ask for advice, generate artifacts, or say &quot;redesign my portfolio theme&quot;. Current focus:{" "}
                  <span className="text-white">{activeFocusOption.label}</span>.
                </p>
              </div>

              {/* Messages */}
              <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                {chatHistory.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                      <Bot className="h-5 w-5 text-[#00f5ff]" />
                    </div>
                    <p>Hi! I&apos;m your LifeAgent. Ask me to create a timeline, video script, skill tree, or any portfolio advice.</p>
                    <div className="flex flex-wrap gap-2 justify-center mt-4">
                      {[
                        "Make me a documentary timeline",
                        "Write a pitch video script",
                        "Create a skills tree",
                        "How can I improve my portfolio?",
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
                        {msg.content || (msg.tool ? `Generated ${msg.tool?.replace("generate_", "")} (${msg.style} style)` : "")}
                      </div>
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
                        <ArtifactRenderer tool={msg.tool} output={msg.output} />
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
                  placeholder={
                    activeFocusValue === "all"
                      ? "Ask anything or say 'create a skills tree'…"
                      : `Ask about ${activeFocusOption.label.toLowerCase()}…`
                  }
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
                          ) : a.tool === "set_resume_model" ? (
                            <FileText className="h-4 w-4 text-[#00f5ff]" />
                          ) : a.tool === "set_portfolio_theme" ? (
                            <Palette className="h-4 w-4 text-[#00f5ff]" />
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
                        <ArtifactRenderer tool={a.tool} output={a.output} />
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
                  Schedule recurring tasks — re-crawl a URL weekly, regenerate your profile, refresh your timeline.
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
                  Set up a weekly re-crawl or profile refresh so your portfolio stays fresh automatically.
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
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5 capitalize">{meta.label} · {SCHEDULE_LABELS[auto.schedule] ?? auto.schedule}</p>
                            <div className="flex gap-4 mt-1.5 text-xs text-gray-500">
                              {auto.lastRun && <span>Last run: {new Date(auto.lastRun).toLocaleDateString()}</span>}
                              {auto.nextRun && <span>Next: {new Date(auto.nextRun).toLocaleDateString()}</span>}
                              <span>Runs: {auto.runCount}</span>
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
              <p>Automations are triggered by calling <code className="text-[#00f5ff] bg-[#00f5ff]/10 px-1 rounded">POST /api/automations/run</code> with your <code className="text-[#00f5ff] bg-[#00f5ff]/10 px-1 rounded">CRON_SECRET</code> header. Set this up with Vercel Cron, GitHub Actions, or Upstash QStash for fully automatic scheduling.</p>
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
                Manage the identity attached to your public brand page.
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
                    Email changes are not editable here.
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
                  Track your current advanced AI credits and fallback behavior.
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
                      Cycle resets on {new Date(billing.cycleEndsAt).toLocaleDateString()}.
                    </p>
                    {billing.fallbackToStandard && (
                      <p className="mt-2 text-xs text-yellow-300">
                        Advanced credits are exhausted. AI is now using {billing.standardModel}.
                      </p>
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
                      AI intensity is configured in AI Preferences. Usage here is counted in credits, not token totals.
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
                  Pick your plan and control how much advanced AI capacity you want each month.
                </p>

                <div className="mb-5 grid gap-4 md:grid-cols-3">
                  {availablePlans.map((plan) => {
                    const isCurrent = billing.planTier === plan.id;
                    return (
                      <div
                        key={plan.id}
                        className={`rounded-2xl border p-4 ${
                          isCurrent
                            ? "border-[#00f5ff]/40 bg-[#00f5ff]/8"
                            : "border-white/10 bg-white/3"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">{plan.label}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              ${plan.monthlyPriceUsd}/month
                            </p>
                          </div>
                          {isCurrent && (
                            <span className="rounded-full border border-[#00f5ff]/30 bg-[#00f5ff]/10 px-2 py-0.5 text-[11px] text-[#00f5ff]">
                              Current
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
                          onClick={() => handleChangePlan(plan.id)}
                          disabled={updatingPlan || isCurrent}
                          className={`mt-4 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                            isCurrent
                              ? "bg-white/5 text-gray-500"
                              : "bg-[#00f5ff] text-black hover:bg-[#00e5ef]"
                          } disabled:opacity-50`}
                        >
                          {isCurrent ? "Current plan" : `Switch to ${plan.label}`}
                        </button>
                      </div>
                    );
                  })}
                </div>

                <p className="text-xs text-gray-500">
                  Usage details, current rate, and active models are tracked in the Usage section above.
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
                  <input
                    value={selectedAiProvider === "auto" ? "auto" : preferredAiModelInput}
                    onChange={(e) => setPreferredAiModelInput(e.target.value)}
                    disabled={selectedAiProvider === "auto"}
                    placeholder={selectedProviderDef?.defaultAdvancedModel ?? "Enter model name"}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-[#00f5ff]/40 focus:outline-none"
                  />
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
                Connect a custom domain and deploy your personal brand site at the root of that hostname.
              </p>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-end">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Custom domain
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
                </div>

                <button
                  onClick={handleSaveCustomDomain}
                  disabled={savingSettings || !hasCustomDomainChanges}
                  className="inline-flex items-center justify-center gap-2 bg-[#00f5ff] text-black px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#00e5ef] transition-colors disabled:opacity-50"
                >
                  Save Domain
                </button>

                <button
                  onClick={handleClearCustomDomain}
                  disabled={savingSettings || !customDomain}
                  className="inline-flex items-center justify-center gap-2 border border-white/10 px-4 py-2.5 rounded-lg text-sm text-gray-300 hover:border-white/20 hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  Clear
                </button>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/3 p-4 text-sm text-gray-400">
                  <p className="font-medium text-white mb-2">DNS setup</p>
                  <p className="leading-relaxed">
                    Point <code className="text-[#00f5ff] bg-[#00f5ff]/10 px-1.5 py-0.5 rounded">{normalizedCustomDomainInput || "portfolio.example.com"}</code> to
                    {" "}
                    <code className="text-[#00f5ff] bg-[#00f5ff]/10 px-1.5 py-0.5 rounded">{dnsTargetHost}</code>.
                    Use a CNAME for subdomains, or ALIAS/ANAME flattening if you want to use an apex domain.
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/3 p-4 text-sm text-gray-400">
                  <p className="font-medium text-white mb-2">Behavior</p>
                  <p className="leading-relaxed">
                    Once DNS resolves here, this app will serve your public LifePage as a live personal brand site at the root of that host. Unmapped external hosts return a 404 instead of the generic landing page.
                  </p>
                  {customDomain && (
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
