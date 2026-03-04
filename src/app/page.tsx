import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold tracking-tight">
            Life<span className="text-[#00f5ff]">Page</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="text-sm bg-[#00f5ff] text-black px-4 py-2 rounded-full font-medium hover:bg-[#00c8d4] transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-32">
        <div className="inline-block bg-white/10 border border-white/20 rounded-full px-4 py-1 text-sm text-[#00f5ff] mb-8">
          🤖 AI-Powered Portfolio Builder
        </div>
        <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 max-w-4xl">
          Your work deserves a{" "}
          <span className="text-[#00f5ff]">world-class</span> portfolio
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed">
          Give LifePage a URL — your website, GitHub, YouTube, or project link.
          Our AI crawls it, understands it, and builds a stunning portfolio page
          for you in seconds.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/register"
            className="bg-[#00f5ff] text-black px-8 py-4 rounded-full text-lg font-semibold hover:bg-[#00c8d4] transition-colors"
          >
            Generate my page →
          </Link>
          <Link
            href="/u/demo"
            className="border border-white/20 text-white px-8 py-4 rounded-full text-lg hover:bg-white/10 transition-colors"
          >
            See example
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">How it works</h2>
        <p className="text-gray-400 text-center mb-16">
          No manual data entry. Just paste a URL.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              title: "Paste your URL",
              desc: "Share your website, GitHub profile, YouTube channel, or any project link.",
              icon: "🔗",
            },
            {
              step: "02",
              title: "AI crawls & understands",
              desc: "Our agent visits the page, takes screenshots, reads content, and extracts your story.",
              icon: "🤖",
            },
            {
              step: "03",
              title: "Get your portfolio",
              desc: "A polished public page at /u/yourname with hero, projects, skills, and a downloadable resume.",
              icon: "✨",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-[#00f5ff]/30 transition-colors"
            >
              <div className="text-4xl mb-4">{item.icon}</div>
              <div className="text-[#00f5ff] text-sm font-mono mb-2">
                {item.step}
              </div>
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-16">
          Everything you need
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              icon: "🕷️",
              title: "Web Crawler",
              desc: "Crawls any URL — screenshots, metadata, content extraction. The AI sees what you built.",
            },
            {
              icon: "🎨",
              title: "Two Premium Themes",
              desc: "Obsidian (dark glass neon) or Paper (clean serif editorial). Pick your vibe.",
            },
            {
              icon: "📄",
              title: "Resume PDF Export",
              desc: "One-click resume download. Action verbs, measurable outcomes, ATS-friendly.",
            },
            {
              icon: "🔁",
              title: "Hiring ↔ Admissions Mode",
              desc: "Same data, different emphasis. Toggle between recruiter and admissions views.",
            },
            {
              icon: "🔒",
              title: "Privacy Controls",
              desc: "Public/private toggle. Hide specific evidence items from your public page.",
            },
            {
              icon: "📊",
              title: "Story Timeline",
              desc: "A documentary-style timeline of your journey. Show how you leveled up.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="flex gap-4 bg-white/5 border border-white/10 rounded-xl p-6"
            >
              <div className="text-3xl">{f.icon}</div>
              <div>
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-gray-400 text-sm">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6 text-center text-gray-500 text-sm">
        <p>
          Built with ❤️ by{" "}
          <a
            href="https://atrak.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00f5ff] hover:underline"
          >
            atrak.dev
          </a>{" "}
          · LifePage AI Personal Brand Builder
        </p>
      </footer>
    </div>
  );
}
