import Link from "next/link";

const SITE_AUTHOR = "atrak.dev";
const SITE_AUTHOR_URL = "https://atrak.dev";

const DEMO_PROFILES = [
  {
    username: "alexchen",
    name: "Alex Chen",
    headline: "Full-Stack Engineer · ML Enthusiast",
    skills: ["React", "Python", "AWS"],
    stats: { projects: 12, years: 4 },
    gradient: "from-[#00f5ff]/20 to-[#7c3aed]/20",
    accent: "#00f5ff",
    isPublic: true,
  },
  {
    username: "sarahjones",
    name: "Sarah Jones",
    headline: "Product Designer · Systems Thinker",
    skills: ["Figma", "UX Research", "Framer"],
    stats: { projects: 8, years: 3 },
    gradient: "from-[#f97316]/20 to-[#ec4899]/20",
    accent: "#f97316",
    isPublic: true,
  },
  {
    username: "marcorivas",
    name: "Marco Rivas",
    headline: "Robotics Engineer · Hackathon Winner",
    skills: ["ROS", "C++", "Computer Vision"],
    stats: { projects: 6, years: 5 },
    gradient: "from-[#22c55e]/20 to-[#06b6d4]/20",
    accent: "#22c55e",
    isPublic: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden">

      {/* ── Background glow blobs ── */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-[#00f5ff]/8 blur-[120px]" />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] rounded-full bg-[#7c3aed]/8 blur-[120px]" />
        <div className="absolute -bottom-20 left-1/3 w-[400px] h-[400px] rounded-full bg-[#f97316]/6 blur-[100px]" />
      </div>

      {/* ── Nav ── */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-10 py-5 border-b border-white/8 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#00f5ff] flex items-center justify-center">
            <span className="text-black font-black text-xs">LP</span>
          </div>
          <span className="text-xl font-bold tracking-tight">
            Life<span className="text-[#00f5ff]">Page</span>
          </span>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <Link
            href="/explore"
            className="hidden sm:inline-flex text-sm text-gray-400 hover:text-white px-3 py-1.5 transition-colors"
          >
            Explore
          </Link>
          <Link
            href="/login"
            className="text-sm text-gray-300 hover:text-white px-4 py-2 rounded-xl border border-white/10 hover:border-white/20 transition-all"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="text-sm bg-[#00f5ff] text-black px-4 py-2 rounded-xl font-semibold hover:bg-[#00e5ef] transition-colors shadow-lg shadow-[#00f5ff]/20"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-24 pb-16 md:pt-32 md:pb-20">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-[#00f5ff]/10 border border-[#00f5ff]/25 rounded-full px-4 py-1.5 text-sm text-[#00f5ff] mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00f5ff] animate-pulse" />
          AI-Powered Portfolio Builder
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.08] tracking-tight mb-6 max-w-4xl">
          Your work deserves a{" "}
          <span className="relative">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f5ff] via-[#7c3aed] to-[#f97316]">
              world-class
            </span>
          </span>{" "}
          portfolio
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed">
          Paste a URL — your website, GitHub, YouTube, or project link — and the AI
          crawls it, screenshots it, and builds a stunning portfolio page in seconds.
          Set it <strong className="text-white">public or private</strong>, just like a GitHub repo.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Link
            href="/register"
            className="group flex items-center justify-center gap-2 bg-[#00f5ff] text-black px-8 py-3.5 rounded-xl text-base font-bold hover:bg-[#00e5ef] transition-all shadow-xl shadow-[#00f5ff]/25 hover:shadow-[#00f5ff]/40 hover:-translate-y-0.5"
          >
            Create my page
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
          <Link
            href="/explore"
            className="flex items-center justify-center gap-2 border border-white/15 text-white px-8 py-3.5 rounded-xl text-base hover:bg-white/5 hover:border-white/25 transition-all"
          >
            <span>🔍</span> Browse portfolios
          </Link>
        </div>
        <p className="text-xs text-gray-600">Free to start · No credit card · {SITE_AUTHOR}</p>
      </section>

      {/* ── Live portfolio cards preview ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-20">
        <div className="text-center mb-10">
          <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-2">Example portfolios</p>
          <h2 className="text-2xl md:text-3xl font-bold">See what others are building</h2>
          <p className="text-gray-400 text-sm mt-2">
            Browse public pages — or keep yours private like a private repo
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {DEMO_PROFILES.map((p) => (
            <div
              key={p.username}
              className={`relative group rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-all hover:-translate-y-1 cursor-pointer`}
            >
              {/* Card gradient bg */}
              <div className={`absolute inset-0 bg-gradient-to-br ${p.gradient} opacity-60`} />
              <div className="absolute inset-0 bg-[#0a0a0a]/70" />

              <div className="relative p-5">
                {/* Public/Private badge — GitHub style */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-black"
                      style={{ background: p.accent }}
                    >
                      {p.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold leading-none">{p.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">@{p.username}</p>
                    </div>
                  </div>
                  {/* Public/Private pill like GitHub */}
                  <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
                    p.isPublic
                      ? "border-green-500/30 text-green-400 bg-green-500/10"
                      : "border-gray-500/30 text-gray-400 bg-gray-500/10"
                  }`}>
                    {p.isPublic ? (
                      <><span>🌐</span> Public</>
                    ) : (
                      <><span>🔒</span> Private</>
                    )}
                  </span>
                </div>

                <p className="text-xs text-gray-400 mb-3 leading-snug">{p.headline}</p>

                {/* Skills */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {p.skills.map((s) => (
                    <span key={s} className="text-xs bg-white/8 border border-white/10 rounded-md px-2 py-0.5 text-gray-300">
                      {s}
                    </span>
                  ))}
                </div>

                {/* Stats */}
                <div className="flex gap-4 text-xs text-gray-500">
                  <span><b className="text-white">{p.stats.projects}</b> projects</span>
                  <span><b className="text-white">{p.stats.years}</b> yrs building</span>
                </div>

                {/* View button — only on hover, only for public */}
                {p.isPublic && (
                  <Link
                    href={`/u/${p.username}`}
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-end p-5 transition-opacity"
                  >
                    <span
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold text-black"
                      style={{ background: p.accent }}
                    >
                      View portfolio ↗
                    </span>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-6">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 text-sm text-[#00f5ff] hover:underline"
          >
            Browse all public portfolios →
          </Link>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-16 border-t border-white/8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">How it works</h2>
          <p className="text-gray-400">Three steps. Zero manual data entry.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              icon: "🔗",
              title: "Paste a URL",
              desc: "Your website, GitHub profile, YouTube channel, or any project link.",
              color: "#00f5ff",
            },
            {
              step: "02",
              icon: "🤖",
              title: "AI crawls & understands",
              desc: "Screenshots, content extraction, metadata — the AI reads everything you built.",
              color: "#7c3aed",
            },
            {
              step: "03",
              icon: "✨",
              title: "Your portfolio is live",
              desc: "A polished page at /u/yourname. Set it public or private — you control it.",
              color: "#f97316",
            },
          ].map((item, i) => (
            <div
              key={item.step}
              className="relative bg-white/3 border border-white/8 rounded-2xl p-6 hover:border-white/15 transition-colors"
            >
              {i < 2 && (
                <div className="hidden md:block absolute top-8 -right-4 text-gray-700 text-lg z-10">→</div>
              )}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4"
                style={{ background: `${item.color}18`, border: `1px solid ${item.color}30` }}
              >
                {item.icon}
              </div>
              <div className="text-xs font-mono mb-1" style={{ color: item.color }}>{item.step}</div>
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features grid ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Everything you need</h2>
          <p className="text-gray-400">Built for students, engineers, and creators.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: "🕷️", title: "Web Crawler", desc: "Paste any URL. We screenshot it, read it, and feed it to the AI." },
            { icon: "🌐", title: "Public Portfolios", desc: "Your page lives at /u/yourname. Share it with anyone, anywhere." },
            { icon: "🔒", title: "Private Pages", desc: "Keep your page private — like a private GitHub repo. Only you can see it." },
            { icon: "💼", title: "Hiring Mode", desc: "Emphasizes skills, case studies, and measurable impact for recruiters." },
            { icon: "🎓", title: "Admissions Mode", desc: "Tells your story — growth, leadership, and projects — for applications." },
            { icon: "📄", title: "Resume Export", desc: "One-click PDF with action verbs and ATS-friendly formatting." },
            { icon: "🎨", title: "Two Themes", desc: "Obsidian (dark neon glass) or Paper (clean editorial serif)." },
            { icon: "📊", title: "Story Timeline", desc: "A documentary-style journey of how you leveled up over the years." },
            { icon: "🔍", title: "Explore Page", desc: "Browse all public portfolios. Discover creators and developers." },
          ].map((f) => (
            <div
              key={f.title}
              className="flex gap-3 bg-white/3 border border-white/8 rounded-xl p-4 hover:bg-white/5 hover:border-white/15 transition-all"
            >
              <div className="text-2xl flex-shrink-0 mt-0.5">{f.icon}</div>
              <div>
                <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Sign-up CTA banner ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-20">
        <div className="relative rounded-2xl overflow-hidden border border-[#00f5ff]/20 bg-gradient-to-br from-[#00f5ff]/8 via-transparent to-[#7c3aed]/8 p-10 text-center">
          <div aria-hidden className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-[#00f5ff]/50 to-transparent" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Ready to build your page?
          </h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            Join creators and engineers who let AI tell their story. Free to start.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="bg-[#00f5ff] text-black px-8 py-3.5 rounded-xl font-bold hover:bg-[#00e5ef] transition-all shadow-xl shadow-[#00f5ff]/25 hover:-translate-y-0.5"
            >
              Create my portfolio →
            </Link>
            <Link
              href="/login"
              className="border border-white/15 text-gray-300 px-8 py-3.5 rounded-xl hover:bg-white/5 hover:border-white/25 transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/8 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#00f5ff] flex items-center justify-center">
              <span className="text-black font-black text-[8px]">LP</span>
            </div>
            <span>LifePage</span>
          </div>
          <div className="flex items-center gap-6 text-xs">
            <Link href="/explore" className="hover:text-white transition-colors">Explore</Link>
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link href="/register" className="hover:text-white transition-colors">Register</Link>
          </div>
          <p className="text-xs">
            Built by{" "}
            <a href={SITE_AUTHOR_URL} target="_blank" rel="noopener noreferrer" className="text-[#00f5ff] hover:underline">
              {SITE_AUTHOR}
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
