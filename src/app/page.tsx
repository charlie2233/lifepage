import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import type { ProfileJSON } from "@/lib/schema";
import { PublicProfilePage } from "@/components/public-profile-page";
import { ContactSection } from "@/components/contact-section";
import {
  getPublicPageUserByCustomDomain,
} from "@/lib/public-page";
import {
  getRequestHostname,
  isInternalAppHostname,
} from "@/lib/custom-domain";
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  BriefcaseBusiness,
  ChartColumn,
  FileText,
  Globe,
  GraduationCap,
  LayoutGrid,
  Link2,
  Lock,
  Palette,
  Search,
  Sparkles,
} from "lucide-react";

const SITE_AUTHOR = "atrak.dev";
const SITE_AUTHOR_URL = "https://atrak.dev";

const DEFAULT_METADATA: Metadata = {
  title: "LifePage",
  description: "AI-powered personal brand builder that turns your work into a live, deployable site.",
};

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

const HOW_IT_WORKS: Array<{
  step: string;
  title: string;
  desc: string;
  color: string;
  icon: LucideIcon;
}> = [
  {
    step: "01",
    icon: Link2,
    title: "Paste a URL",
    desc: "Your website, GitHub profile, YouTube channel, or any project link.",
    color: "#00f5ff",
  },
  {
    step: "02",
    icon: Bot,
    title: "AI crawls & understands",
    desc: "Screenshots, content extraction, metadata — the AI reads everything you built.",
    color: "#7c3aed",
  },
  {
    step: "03",
    icon: Sparkles,
    title: "Deploy your brand",
    desc: "Launch a polished personal brand site at /u/yourname or your own domain, with full control over access.",
    color: "#f97316",
  },
];

const FEATURES: Array<{
  icon: LucideIcon;
  title: string;
  desc: string;
}> = [
  { icon: Search, title: "Proof-of-Work Ingest", desc: "Paste any URL and we turn your work into structured personal brand material." },
  { icon: Globe, title: "Deploy Anywhere", desc: "Publish at /u/yourname or connect your own domain for a branded live site." },
  { icon: Lock, title: "Visibility Controls", desc: "Choose public, anyone-with-link, or private access for each portfolio." },
  { icon: BriefcaseBusiness, title: "Hiring Mode", desc: "Emphasizes skills, case studies, and measurable impact for recruiters." },
  { icon: GraduationCap, title: "Admissions Mode", desc: "Tells your story — growth, leadership, and projects — for applications." },
  { icon: FileText, title: "Resume Export", desc: "One-click PDF with action verbs and ATS-friendly formatting." },
  { icon: Palette, title: "Two Themes", desc: "Obsidian (dark neon glass) or Paper (clean editorial serif)." },
  { icon: ChartColumn, title: "Story Timeline", desc: "A documentary-style journey of how you leveled up over the years." },
  { icon: LayoutGrid, title: "Explore Page", desc: "Browse public personal brands and discover creators, engineers, and builders." },
];

const PRICING = [
  {
    name: "Free",
    price: "$0",
    detail: "20 advanced AI credits each month",
    body: "Start building your personal brand and keep going on a lighter fallback model after your advanced credits run out.",
    badge: "Start here",
  },
  {
    name: "Plus",
    price: "$5",
    detail: "150 advanced AI credits each month",
    body: "For active students and builders who want more advanced AI generations without jumping to an unlimited plan.",
    badge: "Most practical",
  },
  {
    name: "Pro",
    price: "$10",
    detail: "Unlimited advanced AI usage",
    body: "For heavy iteration, constant editing, and teams or creators who want advanced AI on every request.",
    badge: "Unlimited",
  },
] as const;

export const dynamic = "force-dynamic";

async function getCustomDomainPageContext() {
  const hostname = getRequestHostname((await headers()).get("host"));
  if (!hostname || isInternalAppHostname(hostname)) {
    return { hostname, isCustomHost: false as const, user: null };
  }

  const user = await getPublicPageUserByCustomDomain(hostname);
  return { hostname, isCustomHost: true as const, user };
}

export async function generateMetadata(): Promise<Metadata> {
  const { hostname, isCustomHost, user } = await getCustomDomainPageContext();
  if (!isCustomHost) {
    return DEFAULT_METADATA;
  }

  if (!user) {
    return {
      title: "Portfolio not found — LifePage",
      description: hostname
        ? `No public portfolio is connected to ${hostname}.`
        : DEFAULT_METADATA.description,
    };
  }

  const profile = user.generatedProfiles[0]?.data as unknown as
    | ProfileJSON
    | undefined;

  return {
    title: `${user.name ?? user.username ?? "Portfolio"} — LifePage`,
    description: profile?.headline ?? DEFAULT_METADATA.description,
  };
}

function LandingPage() {
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
            href="#contact"
            className="hidden sm:inline-flex text-sm text-gray-400 hover:text-white px-3 py-1.5 transition-colors"
          >
            Contact
          </Link>
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
          AI Personal Brand Builder
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.08] tracking-tight mb-6 max-w-4xl">
          Build your{" "}
          <span className="relative">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f5ff] via-[#7c3aed] to-[#f97316]">
              personal brand
            </span>
          </span>
          . Deploy it instantly.
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed">
          Paste a URL — your website, GitHub, YouTube, or project link — and the AI
          crawls it, screenshots it, and turns it into a deployable personal brand site in seconds.
          Publish it <strong className="text-white">public, link-only, or private</strong>, just like a GitHub repo.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Link
            href="/register"
            className="group flex items-center justify-center gap-2 bg-[#00f5ff] text-black px-8 py-3.5 rounded-xl text-base font-bold hover:bg-[#00e5ef] transition-all shadow-xl shadow-[#00f5ff]/25 hover:shadow-[#00f5ff]/40 hover:-translate-y-0.5"
          >
            Build my brand
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/explore"
            className="flex items-center justify-center gap-2 border border-white/15 text-white px-8 py-3.5 rounded-xl text-base hover:bg-white/5 hover:border-white/25 transition-all"
          >
            <Search className="h-4 w-4" />
            Explore brands
          </Link>
        </div>
        <p className="text-xs text-gray-600">Free to start · No credit card · {SITE_AUTHOR}</p>
      </section>

      {/* ── Live portfolio cards preview ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-20">
        <div className="text-center mb-10">
          <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-2">Example portfolios</p>
          <h2 className="text-2xl md:text-3xl font-bold">See personal brands in the wild</h2>
          <p className="text-gray-400 text-sm mt-2">
            Browse live brand pages, share with a direct link, or keep yours fully private
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
                      <>
                        <Globe className="h-3 w-3" />
                        Public
                      </>
                    ) : (
                      <>
                        <Lock className="h-3 w-3" />
                        Private
                      </>
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
                      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold text-black"
                      style={{ background: p.accent }}
                    >
                      View portfolio
                      <ArrowUpRight className="h-3.5 w-3.5" />
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
            Browse all public portfolios
            <ArrowRight className="h-4 w-4" />
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
          {HOW_IT_WORKS.map((item, i) => {
            const Icon = item.icon;
            return (
            <div
              key={item.step}
              className="relative bg-white/3 border border-white/8 rounded-2xl p-6 hover:border-white/15 transition-colors"
            >
              {i < 2 && (
                <div className="hidden md:block absolute top-8 -right-4 text-gray-700 z-10">
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${item.color}18`, border: `1px solid ${item.color}30` }}
              >
                <Icon className="h-5 w-5" style={{ color: item.color }} />
              </div>
              <div className="text-xs font-mono mb-1" style={{ color: item.color }}>{item.step}</div>
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
            </div>
            );
          })}
        </div>
      </section>

      {/* ── Features grid ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Everything you need</h2>
          <p className="text-gray-400">Built for students, engineers, and creators.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
            <div
              key={f.title}
              className="flex gap-3 bg-white/3 border border-white/8 rounded-xl p-4 hover:bg-white/5 hover:border-white/15 transition-all"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                <Icon className="h-[18px] w-[18px] text-[#00f5ff]" />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            </div>
            );
          })}
        </div>
      </section>

      <section className="relative z-10 max-w-5xl mx-auto px-6 py-16 border-t border-white/8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Simple pricing</h2>
          <p className="text-gray-400">
            Free gets monthly advanced AI credits. Plus adds more. Pro removes the cap.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {PRICING.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl border p-6 ${
                tier.name === "Plus"
                  ? "border-[#00f5ff]/30 bg-[#00f5ff]/8"
                  : "border-white/10 bg-white/3"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-lg font-semibold">{tier.name}</p>
                  <p className="mt-1 text-3xl font-bold">
                    {tier.price}
                    <span className="text-sm font-medium text-gray-500">/mo</span>
                  </p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
                  {tier.badge}
                </span>
              </div>
              <p className="text-sm text-white mb-2">{tier.detail}</p>
              <p className="text-sm leading-relaxed text-gray-400">{tier.body}</p>
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
            Ready to launch your brand?
          </h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            Turn your work into a polished personal brand site and deploy it in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-[#00f5ff] text-black px-8 py-3.5 rounded-xl font-bold hover:bg-[#00e5ef] transition-all shadow-xl shadow-[#00f5ff]/25 hover:-translate-y-0.5"
            >
              Build my brand
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="border border-white/15 text-gray-300 px-8 py-3.5 rounded-xl hover:bg-white/5 hover:border-white/25 transition-all"
            >
              Sign In
            </Link>
            <Link
              href="#contact"
              className="border border-white/15 text-gray-300 px-8 py-3.5 rounded-xl hover:bg-white/5 hover:border-white/25 transition-all"
            >
              Contact us
            </Link>
          </div>
        </div>
      </section>

      <ContactSection />

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
            <Link href="#contact" className="hover:text-white transition-colors">Contact</Link>
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

interface HomePageProps {
  searchParams: Promise<{ mode?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { mode } = await searchParams;
  const { isCustomHost, user } = await getCustomDomainPageContext();

  if (isCustomHost) {
    if (!user?.username) {
      notFound();
    }

    return (
      <PublicProfilePage
        basePath="/"
        queryMode={mode}
        user={user}
        username={user.username}
      />
    );
  }

  return <LandingPage />;
}
