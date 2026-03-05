"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
    projects: Array<{
      title: string;
      problem?: string | null;
      impact?: string | null;
      tech: string[];
    }>;
    achievements: Array<{ title: string; date?: string | null }>;
    timeline: Array<{ year: string; milestones: string[] }>;
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
}

interface ApiEvidenceResponse { items?: EvidenceItem[] }
interface ApiProfileResponse { profile?: GeneratedProfile | null }
interface ApiCrawlResponse { item?: EvidenceItem; error?: string }
interface ApiGenerateResponse { profile?: GeneratedProfile; error?: string }
interface ApiAgentResponse {
  type?: "chat" | "tool_result";
  reply?: string;
  tool?: string;
  style?: string;
  output?: unknown;
  artifactId?: string;
  error?: string;
  artifacts?: AgentArtifact[];
}
interface ApiAutomationResponse {
  automations?: Automation[];
  automation?: Automation;
  error?: string;
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
                  {ev.highlight && <span className="text-xs text-[#00f5ff]">★</span>}
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
            {scene.musicMood && <span className="text-xs text-purple-400">♪ {scene.musicMood}</span>}
          </div>
          <p className="text-xs text-gray-400"><b className="text-gray-300">🎬 Visual:</b> {scene.visualDirection}</p>
          <p className="text-xs text-white leading-relaxed"><b className="text-[#00f5ff]">🎙️</b> {scene.narration}</p>
          {scene.textOverlay && <p className="text-xs text-yellow-400"><b>📝</b> {scene.textOverlay}</p>}
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

// ── Artifact renderer dispatcher ─────────────────────────────────────────────

function ArtifactRenderer({ tool, output }: { tool: string; output: unknown }) {
  if (tool === "generate_timeline") return <TimelineArtifact output={output} />;
  if (tool === "generate_video_script") return <VideoScriptArtifact output={output} />;
  if (tool === "generate_tree") return <TreeArtifact output={output} />;
  return (
    <pre className="mt-2 text-xs bg-white/5 rounded p-3 overflow-auto max-h-48">
      {JSON.stringify(output, null, 2)}
    </pre>
  );
}

// ── Action labels ─────────────────────────────────────────────────────────────

const ACTION_META: Record<string, { icon: string; label: string; desc: string }> = {
  recrawl_url:           { icon: "🕷️", label: "Re-crawl URL",       desc: "Visits a URL and refreshes its content + screenshot" },
  regenerate_profile:    { icon: "🤖", label: "Regenerate Profile",  desc: "Rebuilds your full AI profile from current evidence" },
  refresh_timeline:      { icon: "📊", label: "Refresh Timeline",    desc: "Generates a fresh timeline tree from your profile" },
  refresh_video_script:  { icon: "🎬", label: "Refresh Video Script", desc: "Creates a new video script from your profile" },
};

const SCHEDULE_LABELS: Record<string, string> = {
  daily: "Every day",
  weekly: "Every week",
  monthly: "Every month",
};

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
  const [isPublic, setIsPublic] = useState(true);
  const [theme, setTheme] = useState<"obsidian" | "paper">("obsidian");
  const [savingSettings, setSavingSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<"crawl" | "profile" | "agent" | "automations" | "settings">(
    "crawl"
  );
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

  const fetchData = useCallback(async () => {
    const [ev, pr, st, arts, autos] = await Promise.all([
      fetch("/api/evidence").then((r) => r.json() as Promise<ApiEvidenceResponse>),
      fetch("/api/profile").then((r) => r.json() as Promise<ApiProfileResponse>),
      fetch("/api/settings").then((r) => r.json() as Promise<{ settings?: { isPublic: boolean; theme: string; mode: string } | null }>),
      fetch("/api/agent").then((r) => r.json() as Promise<ApiAgentResponse>),
      fetch("/api/automations").then((r) => r.json() as Promise<ApiAutomationResponse>),
    ]);
    setEvidence(ev.items ?? []);
    if (pr.profile) setProfile(pr.profile);
    if (st.settings) {
      setIsPublic(st.settings.isPublic);
      setTheme((st.settings.theme as "obsidian" | "paper") ?? "obsidian");
      setMode((st.settings.mode as "hiring" | "admissions") ?? "hiring");
    }
    setSavedArtifacts(arts.artifacts ?? []);
    setAutomations(autos.automations ?? []);
  }, []);

  const saveSettings = async (patch: { isPublic?: boolean; theme?: string; mode?: string }) => {
    setSavingSettings(true);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      setMessage({ type: "success", text: "Settings saved." });
    } catch {
      setMessage({ type: "error", text: "Failed to save settings." });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSetPublic = (value: boolean) => {
    setIsPublic(value);
    saveSettings({ isPublic: value }).catch(() => {
      // Error already handled and shown via setMessage inside saveSettings
    });
  };

  const handleSetTheme = (value: "obsidian" | "paper") => {
    setTheme(value);
    saveSettings({ theme: value }).catch(() => {
      // Error already handled and shown via setMessage inside saveSettings
    });
  };

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      fetchData();
    }
  }, [status, router, fetchData]);

  // ── Agent handlers ──────────────────────────────────────────────────────────

  const handleAgentChat = async () => {
    if (!chatInput.trim() && !selectedTool) return;
    const userMsg = chatInput.trim() || `Generate ${selectedTool?.replace("generate_", "")} (${selectedStyle})`;
    setAgentLoading(true);
    setChatInput("");

    const newHistory: ChatMessage[] = [...chatHistory, { role: "user", content: userMsg }];
    setChatHistory(newHistory);

    try {
      const body: Record<string, unknown> = {
        message: userMsg,
        history: chatHistory.map(({ role, content }) => ({ role, content })),
      };
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

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.reply ?? (data.type === "tool_result" ? `Generated ${data.tool} (${data.style} style)` : ""),
        tool: data.tool,
        style: data.style,
        output: data.output,
        artifactId: data.artifactId,
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
    if (!urlInput.trim()) return;
    setCrawling(true);
    setMessage(null);
    try {
      const res = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput }),
      });
      const data = (await res.json()) as ApiCrawlResponse;
      if (!res.ok) throw new Error(data.error ?? "Crawl failed");
      setMessage({
        type: "success",
        text: `✅ Crawled: ${data.item?.title ?? urlInput}`,
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
      setMessage({
        type: "success",
        text: "🎉 Profile generated! Check your public page.",
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
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <div className="text-white animate-pulse">Loading...</div>
      </div>
    );
  }

  const username =
    session?.user?.username ??
    session?.user?.email?.split("@")[0];

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          Life<span className="text-[#00f5ff]">Page</span>
        </Link>
        <div className="flex items-center gap-4">
          {username && (
            <Link
              href={`/u/${username}`}
              target="_blank"
              className="text-sm text-[#00f5ff] hover:underline"
            >
              /u/{username} ↗
            </Link>
          )}
          <span className="text-sm text-gray-400">{session?.user?.email}</span>
          <Link
            href="/explore"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Explore
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-sm text-gray-500 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Message */}
        {message && (
          <div
            className={`mb-6 px-4 py-3 rounded-lg text-sm border ${
              message.type === "success"
                ? "bg-green-500/10 border-green-500/30 text-green-400"
                : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 bg-white/5 rounded-xl p-1 mb-8 w-fit">
          {(["crawl", "profile", "agent", "automations", "settings"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-[#00f5ff] text-black"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab === "crawl" ? "🕷️ Crawl"
                : tab === "profile" ? "✨ Profile"
                : tab === "agent" ? "🤖 Agent"
                : tab === "automations" ? "⏰ Automations"
                : "⚙️ Settings"}
            </button>
          ))}
        </div>

        {/* CRAWL TAB */}
        {activeTab === "crawl" && (
          <div className="space-y-8">
            {/* URL Crawler */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-2">🕷️ Web Crawler</h2>
              <p className="text-gray-400 text-sm mb-4">
                Paste any URL — your website, GitHub profile, project page, or
                YouTube channel. The AI agent will crawl it, take a screenshot,
                and extract your story automatically.
              </p>
              <div className="flex gap-3">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCrawl()}
                  placeholder="https://atrak.dev, https://github.com/yourname..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#00f5ff]/50"
                />
                <button
                  onClick={handleCrawl}
                  disabled={crawling || !urlInput.trim()}
                  className="bg-[#00f5ff] text-black px-6 py-2.5 rounded-lg font-medium hover:bg-[#00c8d4] transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {crawling ? "🔄 Crawling..." : "Crawl →"}
                </button>
              </div>
            </div>

            {/* Links */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4">🔗 Social Links</h2>
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
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4">👤 About You</h2>
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
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-4">
                  📁 Evidence Items ({evidence.length})
                </h2>
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
                          className="text-xs px-2 py-1 rounded border border-white/10 text-gray-400 hover:text-white"
                          title={
                            item.visible
                              ? "Hide from public page"
                              : "Show on public page"
                          }
                        >
                          {item.visible ? "👁️" : "🙈"}
                        </button>
                        <button
                          onClick={() => deleteEvidence(item.id)}
                          className="text-xs px-2 py-1 rounded border border-red-500/20 text-red-400 hover:bg-red-500/10"
                        >
                          ✕
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
                className="bg-[#00f5ff] text-black px-12 py-4 rounded-full text-lg font-semibold hover:bg-[#00c8d4] transition-colors disabled:opacity-50"
              >
                {generating
                  ? "🤖 Generating your profile..."
                  : "✨ Generate My Profile"}
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
                      className="text-sm bg-[#00f5ff] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#00c8d4]"
                    >
                      View Public Page ↗
                    </Link>
                    <a
                      href="/api/resume"
                      target="_blank"
                      className="text-sm border border-white/20 px-4 py-2 rounded-lg hover:bg-white/5"
                    >
                      📄 Export Resume
                    </a>
                  </div>
                </div>

                {/* Mode toggle */}
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-4">
                  <span className="text-sm text-gray-400">Page Mode:</span>
                  <div className="flex gap-1 bg-white/5 rounded-lg p-1">
                    <button
                      onClick={() => setMode("hiring")}
                      className={`px-3 py-1.5 rounded text-sm transition-colors ${
                        mode === "hiring"
                          ? "bg-[#00f5ff] text-black"
                          : "text-gray-400"
                      }`}
                    >
                      💼 Hiring
                    </button>
                    <button
                      onClick={() => setMode("admissions")}
                      className={`px-3 py-1.5 rounded text-sm transition-colors ${
                        mode === "admissions"
                          ? "bg-purple-500 text-white"
                          : "text-gray-400"
                      }`}
                    >
                      🎓 Admissions
                    </button>
                  </div>
                  <span className="text-xs text-gray-500 ml-2">
                    {mode === "hiring"
                      ? "Shows skills, impact, case studies"
                      : "Shows story, growth, leadership"}
                  </span>
                </div>

                {/* Profile preview */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
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
                <div className="text-6xl mb-4">🤖</div>
                <h3 className="text-xl font-semibold mb-2">
                  No profile generated yet
                </h3>
                <p className="text-gray-400 mb-6">
                  Go to the Crawl tab, add some URLs, and click Generate.
                </p>
                <button
                  onClick={() => setActiveTab("crawl")}
                  className="bg-[#00f5ff] text-black px-6 py-2.5 rounded-full font-medium"
                >
                  Start crawling →
                </button>
              </div>
            )}
          </div>
        )}

        {/* AGENT TAB */}
        {activeTab === "agent" && (
          <div className="space-y-6">

            {/* Tool picker */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <h2 className="text-lg font-semibold mb-1">🤖 AI Agent Tools</h2>
              <p className="text-sm text-gray-400 mb-4">
                Ask the agent anything, or pick a tool to instantly generate timelines, video scripts, and skill trees from your portfolio.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                {[
                  {
                    tool: "generate_timeline",
                    icon: "📊",
                    label: "Timeline",
                    styles: ["vertical", "horizontal", "documentary", "minimal"],
                    desc: "Visual journey timeline",
                  },
                  {
                    tool: "generate_video_script",
                    icon: "🎬",
                    label: "Video Script",
                    styles: ["documentary", "pitch", "cinematic", "tutorial", "story"],
                    desc: "Scene-by-scene script",
                  },
                  {
                    tool: "generate_tree",
                    icon: "🌳",
                    label: "Tree / Map",
                    styles: ["skills", "projects", "career", "goals"],
                    desc: "Interactive skill/project tree",
                  },
                ].map((t) => (
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
                    <div className="text-2xl mb-2">{t.icon}</div>
                    <p className="font-medium text-sm">{t.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
                    {selectedTool === t.tool && (
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
                    )}
                  </div>
                ))}
              </div>

              {selectedTool && (
                <button
                  onClick={handleAgentChat}
                  disabled={agentLoading}
                  className="w-full bg-[#00f5ff] text-black py-2.5 rounded-xl font-semibold text-sm hover:bg-[#00e5ef] transition-colors disabled:opacity-50 mb-3"
                >
                  {agentLoading ? "Generating…" : `Generate ${selectedTool.replace("generate_", "")} (${selectedStyle}) →`}
                </button>
              )}
            </div>

            {/* Chat interface */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10">
                <p className="font-medium text-sm">💬 Chat with Agent</p>
                <p className="text-xs text-gray-400">Ask for advice, or say "make me a documentary timeline" or "write a pitch video script"</p>
              </div>

              {/* Messages */}
              <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                {chatHistory.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    <div className="text-3xl mb-2">🤖</div>
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
                        {msg.content || (msg.tool ? `✅ Generated ${msg.tool?.replace("generate_", "")} (${msg.style} style)` : "")}
                      </div>
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
                  placeholder="Ask anything or say 'create a skills tree'…"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00f5ff]/40"
                />
                <button
                  onClick={handleAgentChat}
                  disabled={agentLoading || (!chatInput.trim() && !selectedTool)}
                  className="bg-[#00f5ff] text-black px-4 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-40 hover:bg-[#00e5ef] transition-colors"
                >
                  →
                </button>
              </div>
            </div>

            {/* Saved artifacts */}
            {savedArtifacts.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h3 className="font-semibold text-sm mb-4">📁 Saved Artifacts</h3>
                <div className="space-y-3">
                  {savedArtifacts.slice(0, 5).map((a) => (
                    <div key={a.id} className="border border-white/8 rounded-xl overflow-hidden">
                      <div className="px-4 py-2.5 bg-white/3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {a.tool === "generate_timeline" ? "📊" : a.tool === "generate_video_script" ? "🎬" : "🌳"}
                          </span>
                          <span className="text-sm font-medium capitalize">{a.tool.replace("generate_", "")}</span>
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
                <h2 className="text-xl font-bold">⏰ Automations</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Schedule recurring tasks — re-crawl a URL weekly, regenerate your profile, refresh your timeline.
                </p>
              </div>
              <button
                onClick={() => setShowNewAutomation(!showNewAutomation)}
                className="bg-[#00f5ff] text-black px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#00e5ef] transition-colors"
              >
                + New Automation
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
                        <div className="text-xl mb-1">{meta.icon}</div>
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
                <div className="text-4xl mb-3">⏰</div>
                <p className="font-semibold mb-1">No automations yet</p>
                <p className="text-sm text-gray-400 mb-6">
                  Set up a weekly re-crawl or profile refresh so your portfolio stays fresh automatically.
                </p>
                <button
                  onClick={() => setShowNewAutomation(true)}
                  className="bg-[#00f5ff] text-black px-5 py-2 rounded-xl text-sm font-semibold hover:bg-[#00e5ef] transition-colors"
                >
                  + Create first automation
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {automations.map((auto) => {
                  const meta = ACTION_META[auto.action] ?? { icon: "⚙️", label: auto.action };
                  return (
                    <div
                      key={auto.id}
                      className={`bg-white/3 border rounded-2xl p-5 transition-colors ${
                        auto.enabled ? "border-white/10" : "border-white/5 opacity-60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="text-2xl flex-shrink-0">{meta.icon}</div>
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
                            {runningAutomation === auto.id ? "Running…" : "▶ Run now"}
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
                            className="text-xs text-red-400/60 hover:text-red-400 transition-colors"
                          >
                            ✕
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
              <p className="font-medium text-gray-400 mb-1">⚙️ How automations run</p>
              <p>Automations are triggered by calling <code className="text-[#00f5ff] bg-[#00f5ff]/10 px-1 rounded">POST /api/automations/run</code> with your <code className="text-[#00f5ff] bg-[#00f5ff]/10 px-1 rounded">CRON_SECRET</code> header. Set this up with Vercel Cron, GitHub Actions, or Upstash QStash for fully automatic scheduling.</p>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
          <div className="space-y-6">

            {/* ── Page Visibility — GitHub-style ── */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-6 pt-6 pb-4">
                <h2 className="text-lg font-semibold mb-1">Page Visibility</h2>
                <p className="text-sm text-gray-400">
                  Control who can see your portfolio — just like a GitHub repository.
                </p>
              </div>

              {/* Public option */}
              <button
                onClick={() => handleSetPublic(true)}
                className={`w-full flex items-start gap-4 px-6 py-4 text-left border-t border-white/10 transition-colors ${
                  isPublic ? "bg-green-500/10" : "hover:bg-white/3"
                }`}
              >
                <div className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                  isPublic ? "bg-green-500/20 border border-green-500/30" : "bg-white/5 border border-white/10"
                }`}>
                  🌐
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Public</span>
                    {isPublic && (
                      <span className="text-xs bg-green-500/15 border border-green-500/30 text-green-400 px-2 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Anyone can see your portfolio at{" "}
                    <span className="text-[#00f5ff]">/u/{username}</span>. It will also appear in Explore.
                  </p>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 mt-1 flex-shrink-0 flex items-center justify-center ${
                  isPublic ? "border-green-500 bg-green-500" : "border-gray-600"
                }`}>
                  {isPublic && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </button>

              {/* Private option */}
              <button
                onClick={() => handleSetPublic(false)}
                className={`w-full flex items-start gap-4 px-6 py-4 text-left border-t border-white/10 transition-colors ${
                  !isPublic ? "bg-yellow-500/10" : "hover:bg-white/3"
                }`}
              >
                <div className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                  !isPublic ? "bg-yellow-500/20 border border-yellow-500/30" : "bg-white/5 border border-white/10"
                }`}>
                  🔒
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Private</span>
                    {!isPublic && (
                      <span className="text-xs bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 px-2 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Only you can see this portfolio. It won&apos;t appear in Explore or public searches.
                  </p>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 mt-1 flex-shrink-0 flex items-center justify-center ${
                  !isPublic ? "border-yellow-500 bg-yellow-500" : "border-gray-600"
                }`}>
                  {!isPublic && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
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
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-1">🎨 Theme</h2>
              <p className="text-sm text-gray-400 mb-4">Choose the look of your public portfolio page.</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    id: "obsidian" as const,
                    label: "Obsidian",
                    desc: "Dark · Glass · Neon",
                    preview: (
                      <div className="h-20 rounded-lg bg-[#0d0d0d] border border-[#00f5ff]/30 p-3 mb-3">
                        <div className="w-12 h-1.5 rounded bg-[#00f5ff]/60 mb-1.5" />
                        <div className="w-20 h-1 rounded bg-white/20 mb-1" />
                        <div className="w-16 h-1 rounded bg-white/10" />
                        <div className="flex gap-1 mt-2">
                          <div className="px-1.5 py-0.5 rounded bg-[#00f5ff]/15 border border-[#00f5ff]/20 text-[6px]">React</div>
                          <div className="px-1.5 py-0.5 rounded bg-[#00f5ff]/15 border border-[#00f5ff]/20 text-[6px]">AI</div>
                        </div>
                      </div>
                    ),
                  },
                  {
                    id: "paper" as const,
                    label: "Paper",
                    desc: "Light · Clean · Serif",
                    preview: (
                      <div className="h-20 rounded-lg bg-[#faf9f7] border border-gray-200 p-3 mb-3">
                        <div className="w-12 h-1.5 rounded bg-blue-600/70 mb-1.5" />
                        <div className="w-20 h-1 rounded bg-gray-300 mb-1" />
                        <div className="w-16 h-1 rounded bg-gray-200" />
                        <div className="flex gap-1 mt-2">
                          <div className="px-1.5 py-0.5 rounded bg-blue-50 border border-blue-100 text-[6px] text-blue-600">React</div>
                          <div className="px-1.5 py-0.5 rounded bg-blue-50 border border-blue-100 text-[6px] text-blue-600">AI</div>
                        </div>
                      </div>
                    ),
                  },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSetTheme(t.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      theme === t.id
                        ? "border-[#00f5ff] bg-[#00f5ff]/5"
                        : "border-white/10 hover:border-white/20 bg-white/3"
                    }`}
                  >
                    {t.preview}
                    <div className="font-semibold text-sm">{t.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{t.desc}</div>
                    {theme === t.id && (
                      <div className="text-xs text-[#00f5ff] mt-1">✓ Active</div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Danger Zone ── */}
            <div className="bg-white/5 border border-red-500/20 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-1 text-red-400">⚠️ Danger Zone</h2>
              <p className="text-sm text-gray-400 mb-4">
                Regenerate your entire profile from scratch using your existing evidence.
              </p>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                🔄 {generating ? "Regenerating…" : "Regenerate Profile"}
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
