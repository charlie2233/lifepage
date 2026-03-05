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

interface ApiEvidenceResponse {
  items?: EvidenceItem[];
}
interface ApiProfileResponse {
  profile?: GeneratedProfile | null;
}
interface ApiCrawlResponse {
  item?: EvidenceItem;
  error?: string;
}
interface ApiGenerateResponse {
  profile?: GeneratedProfile;
  error?: string;
}

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
  const [activeTab, setActiveTab] = useState<"crawl" | "profile" | "settings">(
    "crawl"
  );
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchData = useCallback(async () => {
    const [ev, pr, st] = await Promise.all([
      fetch("/api/evidence").then((r) => r.json() as Promise<ApiEvidenceResponse>),
      fetch("/api/profile").then((r) => r.json() as Promise<ApiProfileResponse>),
      fetch("/api/settings").then((r) => r.json() as Promise<{ settings?: { isPublic: boolean; theme: string; mode: string } | null }>),
    ]);
    setEvidence(ev.items ?? []);
    if (pr.profile) setProfile(pr.profile);
    if (st.settings) {
      setIsPublic(st.settings.isPublic);
      setTheme((st.settings.theme as "obsidian" | "paper") ?? "obsidian");
      setMode((st.settings.mode as "hiring" | "admissions") ?? "hiring");
    }
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
    saveSettings({ isPublic: value }).catch(() => {/* already handled inside saveSettings */});
  };

  const handleSetTheme = (value: "obsidian" | "paper") => {
    setTheme(value);
    saveSettings({ theme: value }).catch(() => {/* already handled inside saveSettings */});
  };

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      fetchData();
    }
  }, [status, router, fetchData]);

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
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-8 w-fit">
          {(["crawl", "profile", "settings"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                activeTab === tab
                  ? "bg-[#00f5ff] text-black"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab === "crawl"
                ? "🕷️ Crawl & Upload"
                : tab === "profile"
                ? "✨ Generated Profile"
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
