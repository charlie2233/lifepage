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
  description:
    "AI-powered personal brand and life-story builder for creators, students, job seekers, and people documenting their life.",
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

const WHO_ITS_FOR: Array<{
  icon: LucideIcon;
  title: string;
  desc: string;
}> = [
  {
    icon: Sparkles,
    title: "People building a personal brand",
    desc: "Turn your links, work, and proof into a polished site that feels intentional and easy to share.",
  },
  {
    icon: GraduationCap,
    title: "Students applying to college",
    desc: "Show projects, growth, leadership, and ambition in a format admissions teams can actually follow.",
  },
  {
    icon: BriefcaseBusiness,
    title: "People applying for jobs",
    desc: "Give recruiters and hiring managers a stronger story than a resume alone can carry.",
  },
  {
    icon: ChartColumn,
    title: "People recording their life",
    desc: "Document milestones, timelines, projects, memories, and the way your life evolves over time.",
  },
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
    <div className="lp-page overflow-hidden text-white">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="animate-orb-float absolute -top-32 left-[8%] h-[34rem] w-[34rem] rounded-full bg-[#79e5d2]/12 blur-[130px]" />
        <div className="animate-orb-float-alt absolute right-[4%] top-[16%] h-[28rem] w-[28rem] rounded-full bg-[#8fa9ff]/14 blur-[120px]" />
        <div className="animate-orb-float absolute bottom-[6%] left-[38%] h-[22rem] w-[22rem] rounded-full bg-[#f3b276]/12 blur-[110px]" style={{ animationDelay: "2s" }} />
        <div className="animate-orb-float-alt absolute left-[60%] top-[55%] h-[18rem] w-[18rem] rounded-full bg-[#79e5d2]/6 blur-[100px]" style={{ animationDelay: "4s" }} />
      </div>

      <nav className="relative z-10 border-b border-white/8 bg-[#091015]/75 backdrop-blur-2xl">
        <div className="lp-shell flex items-center justify-between py-5">
          <div className="flex items-center gap-3">
            <div className="animate-pulse-glow flex h-10 w-10 items-center justify-center rounded-2xl border border-[#79e5d2]/30 bg-[linear-gradient(135deg,rgba(121,229,210,0.9),rgba(207,255,246,0.92))] text-[11px] font-black tracking-[0.24em] text-[#041117]">
              LP
            </div>
            <div>
              <p className="brand-display text-[1.35rem] leading-none tracking-tight">
                LifePage
              </p>
              <p className="lp-kicker mt-1 text-[10px] text-[#94a2ad]">
                Brand, proof, deploy
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <Link
              href="#contact"
              className="lp-button-ghost hidden px-3 py-2 text-sm sm:inline-flex"
            >
              Contact
            </Link>
            <Link
              href="/explore"
              className="lp-button-ghost hidden px-3 py-2 text-sm sm:inline-flex"
            >
              Explore
            </Link>
            <Link
              href="/login"
              className="lp-button-secondary px-4 py-2 text-sm"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="lp-button-primary btn-fancy px-4 py-2 text-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative z-10">
        <div className="lp-shell grid gap-10 py-20 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:items-center lg:py-28">
          <div className="lp-fade-rise">
            <div className="lp-chip animate-border-glow px-4 py-2 text-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#79e5d2] opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#79e5d2]" />
              </span>
              AI personal brand builder
            </div>

            <h1 className="brand-display mt-8 max-w-4xl text-[3.4rem] leading-[0.95] tracking-[-0.05em] text-[#f8f3ea] sm:text-[4.4rem] lg:text-[5.6rem]">
              Build your personal brand.
              <span className="animate-gradient-text block bg-[linear-gradient(120deg,#79e5d2_0%,#b9fff1_30%,#8fa9ff_60%,#f3b276_100%)] bg-clip-text text-transparent">
                Deploy it like a product.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#a4b1ba] sm:text-xl">
              Paste a URL and LifePage turns scattered proof into a sharp public
              site. It crawls your work, structures the story, and publishes it
              as a brand page you can keep public, link-only, or private.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="lp-button-primary btn-fancy px-7 py-3.5 text-base"
              >
                Build my brand
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/explore"
                className="lp-button-secondary px-7 py-3.5 text-base"
              >
                <Search className="h-4 w-4" />
                Explore brands
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap gap-2.5 text-sm text-[#c9d2d9]">
              <span className="lp-chip px-3.5 py-2">Personal brands</span>
              <span className="lp-chip px-3.5 py-2">College applications</span>
              <span className="lp-chip px-3.5 py-2">Job applications</span>
              <span className="lp-chip px-3.5 py-2">Life documentation</span>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 text-sm text-[#8d9aa5]">
              <span className="lp-chip px-3 py-1.5">Free to start</span>
              <span className="lp-chip px-3 py-1.5">No credit card</span>
              <span className="lp-chip px-3 py-1.5">Built by {SITE_AUTHOR}</span>
            </div>
          </div>

          <div className="relative lg:pl-6">
            <div className="lp-panel glow-ring-teal rounded-[2rem] p-5 sm:p-6">
              <div className="grid gap-4">
                <div className="rounded-[1.5rem] border border-white/10 bg-[rgba(255,255,255,0.035)] p-4">
                  <div className="flex items-center justify-between text-xs text-[#a9b6be]">
                    <span className="lp-kicker text-[10px] text-[#79e5d2]">
                      Brand flow
                    </span>
                    <span>2 min launch</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {[
                      { icon: Link2, label: "Import proof", copy: "Website, GitHub, YouTube, Google Sites" },
                      { icon: Bot, label: "Shape the story", copy: "AI turns evidence into projects, timeline, and resume" },
                      { icon: Globe, label: "Deploy anywhere", copy: "/u/yourname or your own domain with access controls" },
                    ].map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.label}
                          className={`card-hover flex items-start gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3 stagger-${i + 1} lp-fade-rise`}
                        >
                          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl border border-[#79e5d2]/20 bg-[#79e5d2]/12">
                            <Icon className="h-4 w-4 text-[#79e5d2]" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#f4efe8]">
                              {item.label}
                            </p>
                            <p className="mt-1 text-sm leading-6 text-[#93a1ab]">
                              {item.copy}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-white/10 bg-[#0a1115]/90 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="lp-kicker text-[10px] text-[#94a2ad]">
                        Live preview
                      </p>
                      <p className="mt-2 brand-display text-2xl tracking-tight">
                        alexchen.com
                      </p>
                    </div>
                    <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
                      Public
                    </span>
                  </div>

                  <div className="mt-5 rounded-[1.5rem] border border-white/8 bg-[linear-gradient(160deg,rgba(121,229,210,0.09),rgba(255,255,255,0.02))] p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#79e5d2,#cffff6)] text-lg font-bold text-[#081116]">
                        A
                      </div>
                      <div>
                        <p className="text-base font-semibold text-[#f7f1e8]">
                          Alex Chen
                        </p>
                        <p className="text-sm text-[#91a0aa]">
                          Full-stack engineer building AI products
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-3">
                      <div className="lp-stat-tile p-4">
                        <p className="text-2xl font-semibold text-[#f7f1e8]">
                          12
                        </p>
                        <p className="mt-1 text-xs text-[#8e9ca6]">
                          Projects shipped
                        </p>
                      </div>
                      <div className="lp-stat-tile p-4">
                        <p className="text-2xl font-semibold text-[#f7f1e8]">
                          4
                        </p>
                        <p className="mt-1 text-xs text-[#8e9ca6]">
                          Years building
                        </p>
                      </div>
                      <div className="lp-stat-tile p-4">
                        <p className="text-2xl font-semibold text-[#f7f1e8]">
                          1
                        </p>
                        <p className="mt-1 text-xs text-[#8e9ca6]">
                          Resume export
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {["Hiring mode", "Admissions mode", "Custom domain"].map(
                        (label) => (
                          <span
                            key={label}
                            className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-xs text-[#d0d8de]"
                          >
                            {label}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { title: "Visibility", value: "Public, link-only, private" },
                    { title: "AI usage", value: "Kimi, Qwen, Auto" },
                    { title: "Deploy", value: "/u/yourname or custom domain" },
                  ].map((item) => (
                    <div key={item.title} className="lp-stat-tile p-4">
                      <p className="lp-kicker text-[10px] text-[#79e5d2]">
                        {item.title}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-[#d3dbe0]">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 pb-20">
        <div className="lp-shell">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="lp-kicker text-xs text-[#79e5d2]">
                Example portfolios
              </p>
              <h2 className="brand-display mt-3 text-4xl tracking-tight text-[#f8f3ea] md:text-5xl">
                See personal brands in the wild
              </h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-[#97a4ae]">
              Public pages read like a real product launch, not a link dump. Each
              one can ship to a direct URL or a custom domain.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.12fr_0.88fr_0.88fr]">
            {DEMO_PROFILES.map((p, index) => (
              <div
                key={p.username}
                className={`lp-panel card-hover group rounded-[1.75rem] ${
                  index === 0 ? "lg:row-span-2" : ""
                }`}
              >
                <div className="relative h-full p-5 sm:p-6">
                  <div
                    aria-hidden
                    className={`absolute inset-x-0 top-0 h-48 bg-gradient-to-br ${p.gradient} opacity-80 transition-opacity duration-300 group-hover:opacity-100`}
                  />
                  <div className="relative flex h-full flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-11 w-11 items-center justify-center rounded-2xl text-base font-bold text-[#081116] shadow-lg"
                          style={{ backgroundColor: p.accent, boxShadow: `0 8px 24px ${p.accent}40` }}
                        >
                          {p.name[0]}
                        </div>
                        <div>
                          <p className="text-base font-semibold text-[#f8f3ea]">
                            {p.name}
                          </p>
                          <p className="text-sm text-[#8e9aa4]">@{p.username}</p>
                        </div>
                      </div>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs ${
                          p.isPublic
                            ? "border-emerald-400/30 bg-emerald-400/12 text-emerald-200"
                            : "border-white/10 bg-white/5 text-[#95a2ac]"
                        }`}
                      >
                        <span className="inline-flex items-center gap-1">
                          {p.isPublic ? (
                            <Globe className="h-3.5 w-3.5" />
                          ) : (
                            <Lock className="h-3.5 w-3.5" />
                          )}
                          {p.isPublic ? "Public" : "Private"}
                        </span>
                      </span>
                    </div>

                    <div className="mt-10">
                      <p className="lp-kicker text-[10px] text-[#94a2ad]">
                        Brand headline
                      </p>
                      <p className="mt-3 brand-display text-2xl leading-tight tracking-tight text-[#f7f1e8]">
                        {p.headline}
                      </p>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2">
                      {p.skills.map((skill) => (
                        <span
                          key={skill}
                          className="animate-tag-pop rounded-full border border-white/12 bg-black/25 px-3 py-1.5 text-xs text-[#d0d8de] transition-colors hover:border-white/25 hover:text-white"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <div className="lp-stat-tile p-4">
                        <p className="stat-number text-2xl font-semibold text-[#f7f1e8]">
                          {p.stats.projects}
                        </p>
                        <p className="mt-1 text-xs text-[#8e9ca6]">Projects</p>
                      </div>
                      <div className="lp-stat-tile p-4">
                        <p className="stat-number text-2xl font-semibold text-[#f7f1e8]">
                          {p.stats.years}
                        </p>
                        <p className="mt-1 text-xs text-[#8e9ca6]">
                          Years building
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto pt-6">
                      {p.isPublic ? (
                        <Link
                          href={`/u/${p.username}`}
                          className="inline-flex items-center gap-2 text-sm font-medium text-[#f7f1e8] transition-colors hover:text-[#79e5d2]"
                        >
                          View portfolio
                          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </Link>
                      ) : (
                        <p className="text-sm text-[#8c98a1]">
                          Private mode keeps the page hidden from Explore.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <Link
              href="/explore"
              className="group inline-flex items-center gap-2 text-sm text-[#79e5d2] transition-colors hover:text-[#cffff6]"
            >
              Browse all public portfolios
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      <section className="relative z-10 border-t border-white/8 py-20">
        <div className="lp-shell">
          <div className="mb-10">
            <p className="lp-kicker text-xs text-[#79e5d2]">How it works</p>
            <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <h2 className="brand-display text-4xl tracking-tight text-[#f8f3ea] md:text-5xl">
                Three moves from raw links to a deployable brand site
              </h2>
              <p className="max-w-lg text-base leading-7 text-[#97a4ae]">
                The experience should feel closer to shipping a product than
                filling out a profile form.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {HOW_IT_WORKS.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className={`lp-panel card-hover rounded-[1.75rem] p-6 stagger-${i + 1} lp-fade-rise`}>
                  <div className="flex items-center justify-between">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl"
                      style={{
                        background: `${item.color}18`,
                        border: `1px solid ${item.color}30`,
                        boxShadow: `0 8px 24px ${item.color}20`,
                      }}
                    >
                      <Icon className="h-5 w-5" style={{ color: item.color }} />
                    </div>
                    <span className="lp-kicker text-[13px] font-black opacity-25" style={{ color: item.color }}>
                      {item.step}
                    </span>
                  </div>
                  <h3 className="mt-10 text-xl font-semibold text-[#f7f1e8]">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[#96a3ad]">
                    {item.desc}
                  </p>
                  {i < HOW_IT_WORKS.length - 1 && (
                    <div className="mt-8 h-px bg-gradient-to-r from-white/15 via-white/4 to-transparent" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative z-10 border-t border-white/8 py-20">
        <div className="lp-shell">
          <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="lp-kicker text-xs text-[#79e5d2]">Who it&apos;s for</p>
              <h2 className="brand-display mt-3 text-4xl tracking-tight text-[#f8f3ea] md:text-5xl">
                Built for people with a story, not just a resume
              </h2>
            </div>
            <p className="max-w-lg text-base leading-7 text-[#97a4ae]">
              LifePage covers the audiences that most portfolio tools flatten:
              creators, applicants, professionals, and people archiving their life.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {WHO_ITS_FOR.map((group, i) => {
              const Icon = group.icon;
              return (
                <div
                  key={group.title}
                  className={`lp-panel card-hover rounded-[1.75rem] p-6 stagger-${i + 1} lp-fade-rise`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-[#79e5d2]/20 bg-[#79e5d2]/8">
                      <Icon className="h-5 w-5 text-[#79e5d2]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[#f7f1e8]">
                        {group.title}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-[#98a5ae]">
                        {group.desc}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative z-10 py-20">
        <div className="lp-shell">
          <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="lp-kicker text-xs text-[#79e5d2]">Core product</p>
              <h2 className="brand-display mt-3 text-4xl tracking-tight text-[#f8f3ea] md:text-5xl">
                Everything needed to shape, host, and share a brand page
              </h2>
            </div>
            <p className="max-w-lg text-base leading-7 text-[#97a4ae]">
              The value is not just generation. It is the whole loop: import,
              structure, edit, export, host, and deploy.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className={`lp-panel card-hover rounded-[1.5rem] p-5 stagger-${(i % 6) + 1} lp-fade-rise`}>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#79e5d2]/20 bg-[#79e5d2]/8">
                    <Icon className="h-5 w-5 text-[#79e5d2]" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-[#f7f1e8]">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-[#97a4ae]">
                    {feature.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative z-10 border-t border-white/8 py-20">
        <div className="lp-shell">
          <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="lp-kicker text-xs text-[#79e5d2]">Pricing</p>
              <h2 className="brand-display mt-3 text-4xl tracking-tight text-[#f8f3ea] md:text-5xl">
                Small plans, clear credit logic
              </h2>
            </div>
            <p className="max-w-lg text-base leading-7 text-[#97a4ae]">
              Free gets advanced credits each month. Plus adds room. Pro removes
              the ceiling for heavy builders.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {PRICING.map((tier) => (
              <div
                key={tier.name}
                className={`lp-panel card-hover rounded-[1.75rem] p-6 ${
                  tier.name === "Plus"
                    ? "animate-pulse-glow border-[#79e5d2]/35 bg-[linear-gradient(180deg,rgba(121,229,210,0.14),rgba(255,255,255,0.03))]"
                    : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-[#f7f1e8]">
                      {tier.name}
                    </p>
                    <p className="mt-2 brand-display text-5xl tracking-tight text-[#f8f3ea]">
                      {tier.price}
                      <span className="ml-1 text-base font-medium text-[#95a2ac]">
                        /mo
                      </span>
                    </p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs ${
                    tier.name === "Plus"
                      ? "border-[#79e5d2]/35 bg-[#79e5d2]/12 text-[#79e5d2]"
                      : "border-white/10 bg-white/5 text-[#cbd3d9]"
                  }`}>
                    {tier.badge}
                  </span>
                </div>
                <p className="mt-8 text-sm font-medium text-[#f8f1e8]">
                  {tier.detail}
                </p>
                <p className="mt-3 text-sm leading-7 text-[#97a4ae]">
                  {tier.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 pb-20 pt-6">
        <div className="lp-shell">
          <div className="lp-panel glow-ring-teal rounded-[2rem] px-6 py-10 text-center sm:px-10 sm:py-12">
            <p className="lp-kicker text-xs text-[#79e5d2]">Launch</p>
            <h2 className="brand-display mt-4 text-4xl tracking-tight text-[#f8f3ea] md:text-5xl">
              Ready to launch your brand?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#97a4ae]">
              Turn your work into a polished brand site, export the resume, and
              publish it in minutes.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="lp-button-primary btn-fancy px-8 py-3.5 text-base"
              >
                Build my brand
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="lp-button-secondary px-8 py-3.5 text-base"
              >
                Sign In
              </Link>
              <Link
                href="#contact"
                className="lp-button-secondary px-8 py-3.5 text-base"
              >
                Contact us
              </Link>
            </div>
          </div>
        </div>
      </section>

      <ContactSection />

      <footer className="relative z-10 border-t border-white/8 py-8">
        <div className="lp-shell flex flex-col gap-4 text-sm text-[#8f9ca6] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#79e5d2,#cffff6)] text-[10px] font-black tracking-[0.2em] text-[#041117]">
              LP
            </div>
            <div>
              <p className="brand-display text-lg leading-none text-[#f7f1e8]">
                LifePage
              </p>
              <p className="mt-1 text-xs text-[#8f9ca6]">
                Brand builder for people with proof
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-xs uppercase tracking-[0.14em] text-[#8f9ca6]">
            <Link href="/explore" className="hover:text-white">Explore</Link>
            <Link href="#contact" className="hover:text-white">Contact</Link>
            <Link href="/login" className="hover:text-white">Sign In</Link>
            <Link href="/register" className="hover:text-white">Register</Link>
          </div>
          <p className="text-xs">
            Built by{" "}
            <a
              href={SITE_AUTHOR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#79e5d2] hover:text-[#cffff6]"
            >
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
