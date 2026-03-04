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
  const [activeTab, setActiveTab] = useState<"crawl" | "profile" | "settings">(
    "crawl"
  );
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchData = useCallback(async () => {
    const [ev, pr] = await Promise.all([
      fetch("/api/evidence").then((r) => r.json() as Promise<ApiEvidenceResponse>),
      fetch("/api/profile").then((r) => r.json() as Promise<ApiProfileResponse>),
    ]);
    setEvidence(ev.items ?? []);
    if (pr.profile) setProfile(pr.profile);
  }, []);

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
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4">🔒 Privacy</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Public Portfolio</p>
                  <p className="text-sm text-gray-400">
                    {isPublic
                      ? "Your page is visible at /u/yourname"
                      : "Your page is private"}
                  </p>
                </div>
                <button
                  onClick={() => setIsPublic(!isPublic)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    isPublic ? "bg-[#00f5ff]" : "bg-gray-700"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform mx-0.5 ${
                      isPublic ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4">🎨 Theme</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    id: "obsidian",
                    label: "Obsidian",
                    desc: "Dark glass neon",
                    cls: "bg-[#0d0d0d] border-[#00f5ff] text-white",
                  },
                  {
                    id: "paper",
                    label: "Paper",
                    desc: "Clean editorial serif",
                    cls: "bg-white border-blue-500 text-black",
                  },
                ].map((t) => (
                  <button
                    key={t.id}
                    className={`p-4 rounded-xl border-2 ${t.cls} text-left transition-all`}
                  >
                    <div className="font-semibold">{t.label}</div>
                    <div className="text-xs opacity-60 mt-1">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-2">⚠️ Danger Zone</h2>
              <p className="text-sm text-gray-400 mb-4">
                Regenerate your profile from scratch.
              </p>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm hover:bg-red-500/10"
              >
                🔄 Regenerate Profile
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
