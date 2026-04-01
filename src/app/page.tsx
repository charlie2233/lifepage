import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import type { ProfileJSON } from "@/lib/schema";
import { PublicProfilePage } from "@/components/public-profile-page";
import { ContactSection } from "@/components/contact-section";
import { LandingPricing } from "@/components/landing-pricing";
import { StructuredData } from "@/components/structured-data";
import { TrackPageView } from "@/components/track-page-view";
import { isStripeBillingConfigured } from "@/lib/stripe-billing";
import {
  SITE_AUTHOR,
  SITE_AUTHOR_URL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  absoluteUrl,
} from "@/lib/site";
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
  Images,
  LayoutGrid,
  Link2,
  Lock,
  Palette,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const DEFAULT_METADATA: Metadata = {
  title: `${SITE_NAME} — ${SITE_TAGLINE}`,
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: absoluteUrl("/"),
  },
  openGraph: {
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    url: absoluteUrl("/"),
    images: [
      {
        url: absoluteUrl("/og-atrak-pages.svg"),
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} open graph image`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [absoluteUrl("/og-atrak-pages.svg")],
  },
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
    title: "Import real proof",
    desc: "Paste links from your site, GitHub, YouTube, Google Sites, or project pages and pull the work into one place.",
    color: "#00f5ff",
  },
  {
    step: "02",
    icon: Bot,
    title: "Shape the narrative",
    desc: "Atrak Pages reads the evidence, extracts the signal, and turns it into a portfolio story, resume, and positioning.",
    color: "#7c3aed",
  },
  {
    step: "03",
    icon: Sparkles,
    title: "Deploy your site",
    desc: "Publish a polished public brand page and resume at /u/yourname or your own domain, with real access controls.",
    color: "#f97316",
  },
];

const FEATURES: Array<{
  icon: LucideIcon;
  title: string;
  desc: string;
}> = [
  { icon: Search, title: "Evidence Import", desc: "Bring in multiple links, screenshots, and proof so the portfolio is grounded in real work." },
  { icon: Globe, title: "Deploy Anywhere", desc: "Launch on /u/yourname, a custom domain, or a shareable link-only page." },
  { icon: Lock, title: "Visibility Controls", desc: "Choose public, link-only, or private access depending on what you want to show." },
  { icon: BriefcaseBusiness, title: "Hiring Mode", desc: "Frame the page around projects, proof, impact, and recruiter-friendly scanning." },
  { icon: GraduationCap, title: "Admissions Mode", desc: "Shift the story toward growth, initiative, leadership, and long-term trajectory." },
  { icon: FileText, title: "Resume System", desc: "Publish a separate resume page and export a polished PDF when you need it." },
  { icon: Palette, title: "Portfolio Models", desc: "Choose from 30 preset portfolio directions or let the agent reshape the UI for you." },
  { icon: ChartColumn, title: "Narrative Outputs", desc: "Generate timelines, scripts, trees, and structured brand artifacts from the same evidence." },
  { icon: LayoutGrid, title: "Explore Feed", desc: "Browse public Atrak Pages launches and study how others frame their work and identity." },
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

const HERO_URL_EXAMPLES = [
  "https://your-site.com",
  "https://github.com/yourname",
  "https://youtube.com/@yourname",
  "https://docs.google.com/...",
];

const TRUST_PILLARS: Array<{
  icon: LucideIcon;
  title: string;
  desc: string;
}> = [
  {
    icon: Link2,
    title: "Grounded in real evidence",
    desc: "Atrak Pages works from URLs, screenshots, and public proof instead of asking you to write everything from scratch.",
  },
  {
    icon: Images,
    title: "Built for better first impressions",
    desc: "Every profile can show project visuals, proof tiles, a resume view, and a clean public link you can send immediately.",
  },
  {
    icon: ShieldCheck,
    title: "Trust signals stay visible",
    desc: "Public, link-only, and private states are explicit, and the page keeps the source material easy to audit.",
  },
];

const PRICING = [
  {
    id: "free",
    name: "Free",
    monthlyPriceUsd: 0,
    yearlyPriceUsd: 0,
    detail: "20 advanced AI credits each month",
    body: "Start building the site, the story, and the resume, then keep going on a lighter model after advanced credits run out.",
    badge: "Start here",
  },
  {
    id: "plus",
    name: "Plus",
    monthlyPriceUsd: 5,
    yearlyPriceUsd: 50,
    detail: "150 advanced AI credits each month",
    body: "For active students, applicants, and builders who want room to iterate without paying for unlimited usage.",
    badge: "Most practical",
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPriceUsd: 10,
    yearlyPriceUsd: 100,
    detail: "Unlimited advanced AI usage",
    body: "For constant editing, heavier agent workflows, and teams or creators who want the advanced route on every request.",
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
      title: "Portfolio not found — Atrak Pages",
      description: hostname
        ? `No public portfolio is connected to ${hostname}.`
        : DEFAULT_METADATA.description,
    };
  }

  const profile = user.generatedProfiles[0]?.data as unknown as
    | ProfileJSON
    | undefined;
  const currentOrigin = hostname ? `https://${hostname}` : absoluteUrl("/");

  return {
    title: `${user.name ?? user.username ?? "Portfolio"} — Atrak Pages`,
    description: profile?.headline ?? DEFAULT_METADATA.description,
    alternates: {
      canonical: currentOrigin,
    },
    openGraph: {
      type: "website",
      title: `${user.name ?? user.username ?? "Portfolio"} — ${SITE_NAME}`,
      description: profile?.headline ?? SITE_DESCRIPTION,
      url: currentOrigin,
      images: [
        {
          url: new URL("/og-atrak-pages.svg", currentOrigin).toString(),
          width: 1200,
          height: 630,
          alt: `${user.name ?? user.username ?? "Portfolio"} preview`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${user.name ?? user.username ?? "Portfolio"} — ${SITE_NAME}`,
      description: profile?.headline ?? SITE_DESCRIPTION,
      images: [new URL("/og-atrak-pages.svg", currentOrigin).toString()],
    },
  };
}

function LandingPage() {
  const stripeConfigured = isStripeBillingConfigured();
  const landingStructuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: SITE_DESCRIPTION,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    creator: {
      "@type": "Person",
      name: SITE_AUTHOR,
      url: SITE_AUTHOR_URL,
    },
    featureList: [
      "Import GitHub, website, video, and document URLs",
      "Generate a public portfolio page and resume view",
      "Capture screenshots and evidence for stronger credibility",
      "Share public pages or custom domains",
    ],
  };

  return (
    <>
      <TrackPageView event="landing_page_viewed" />
      <StructuredData data={landingStructuredData} />
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
            <div className="animate-pulse-glow flex h-10 w-10 items-center justify-center rounded-2xl border border-[#79e5d2]/30 bg-[linear-gradient(135deg,rgba(121,229,210,0.9),rgba(207,255,246,0.92))] text-[11px] font-black tracking-[0.24em] text-[#041117]">AP</div>
            <div>
              <p className="brand-display text-[1.35rem] leading-none tracking-tight">
                Atrak Pages
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
              AI personal brand studio
            </div>

            <h1 className="brand-display mt-8 max-w-4xl text-[3.4rem] leading-[0.95] tracking-[-0.05em] text-[#f8f3ea] sm:text-[4.4rem] lg:text-[5.6rem]">
              Turn proof of your work
              <span className="block">into a portfolio people trust.</span>
              <span className="animate-gradient-text block bg-[linear-gradient(120deg,#79e5d2_0%,#b9fff1_30%,#8fa9ff_60%,#f3b276_100%)] bg-clip-text text-transparent">
                Publish the page and the resume together.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#a4b1ba] sm:text-xl">
              Paste your site, GitHub, demos, or school project links. Atrak Pages
              crawls the proof, captures screenshots, writes the story, and ships
              a public portfolio plus a cleaner resume view you can share right away.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="lp-button-primary btn-fancy px-7 py-3.5 text-base"
              >
                Create my free page
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/explore"
                className="lp-button-secondary px-7 py-3.5 text-base"
              >
                <Search className="h-4 w-4" />
                See live examples
              </Link>
            </div>

            <p className="mt-4 max-w-xl text-sm leading-7 text-[#91a1ab]">
              Best first run: bring 3 links that show your best work. Atrak Pages
              does the first synthesis, and you keep editing from there.
            </p>

            <div className="mt-7 flex flex-wrap gap-2.5 text-sm text-[#c9d2d9]">
              <span className="lp-chip px-3.5 py-2">Internship portfolios</span>
              <span className="lp-chip px-3.5 py-2">Job applications</span>
              <span className="lp-chip px-3.5 py-2">Admissions storytelling</span>
              <span className="lp-chip px-3.5 py-2">Creator / founder intros</span>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 text-sm text-[#8d9aa5]">
              <span className="lp-chip px-3 py-1.5">Crawls real URLs</span>
              <span className="lp-chip px-3 py-1.5">Captures screenshots</span>
              <span className="lp-chip px-3 py-1.5">Exports resume PDF</span>
              <span className="lp-chip px-3 py-1.5">Built by {SITE_AUTHOR}</span>
            </div>
          </div>

          <div className="relative lg:pl-6">
            <div className="lp-panel glow-ring-teal rounded-[2rem] p-5 sm:p-6">
              <div className="grid gap-4">
                <div className="rounded-[1.5rem] border border-white/10 bg-[rgba(255,255,255,0.035)] p-4">
                  <div className="flex items-center justify-between text-xs text-[#a9b6be]">
                    <span className="lp-kicker text-[10px] text-[#79e5d2]">
                      First-run inputs
                    </span>
                    <span>What to paste first</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {HERO_URL_EXAMPLES.map((example, index) => (
                      <div
                        key={example}
                        className={`card-hover rounded-2xl border border-white/8 bg-black/20 px-4 py-3 stagger-${index + 1} lp-fade-rise`}
                      >
                        <p className="text-[11px] uppercase tracking-[0.16em] text-[#79e5d2]">
                          Example {index + 1}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[#d7dfe4]">
                          {example}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-2xl border border-[#79e5d2]/12 bg-[#79e5d2]/6 px-4 py-3 text-sm leading-6 text-[#b7c6cf]">
                    Strongest mix: one homepage, one project repo or case study,
                    and one proof-heavy page like a demo, docs, or YouTube channel.
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-white/10 bg-[#0a1115]/90 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="lp-kicker text-[10px] text-[#94a2ad]">
                        Live preview
                      </p>
                      <p className="mt-2 brand-display text-2xl tracking-tight">
                        /u/alexchen
                      </p>
                      <p className="mt-1 text-xs text-[#94a2ad]">
                        Portfolio page + separate resume view
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
                          18
                        </p>
                        <p className="mt-1 text-xs text-[#8e9ca6]">
                          Proof items
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {["Hiring mode", "Admissions mode", "Separate resume page"].map(
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
                    { title: "Evidence", value: "Screenshots and source links stay visible" },
                    { title: "Narrative", value: "Headline, case studies, and resume bullets" },
                    { title: "Share", value: "Public path, resume route, and custom domain" },
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

      <section className="relative z-10 pb-16">
        <div className="lp-shell">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="lp-kicker text-xs text-[#79e5d2]">Why it feels credible</p>
              <h2 className="brand-display mt-3 text-4xl tracking-tight text-[#f8f3ea] md:text-5xl">
                The page is built from proof, not just prompts
              </h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-[#97a4ae]">
              Atrak Pages is strongest when it makes the underlying work easier to trust:
              clear sources, visible screenshots, and a resume that matches the page.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {TRUST_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div key={pillar.title} className="lp-panel rounded-[1.6rem] p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#79e5d2]/20 bg-[#79e5d2]/8">
                    <Icon className="h-5 w-5 text-[#79e5d2]" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-[#f8f3ea]">
                    {pillar.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-[#97a4ae]">
                    {pillar.desc}
                  </p>
                </div>
              );
            })}
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
              Public pages should read like a considered launch, not a link dump.
              Each one can ship to a direct URL, a resume page, or a custom domain.
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
              Browse all public brand sites
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
              Atrak Pages is opinionated about audiences that most portfolio tools flatten:
              creators, applicants, professionals, and people documenting a life in motion.
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
              The value is not just generation. It is the full loop: import,
              structure, edit, present, export, host, and deploy.
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
              Free gets advanced credits each month. Plus adds room to iterate.
              Pro removes the ceiling for heavy builders and constant agent use.
            </p>
          </div>

          <LandingPricing plans={PRICING} stripeConfigured={stripeConfigured} />
        </div>
      </section>

      <section className="relative z-10 pb-20 pt-6">
        <div className="lp-shell">
          <div className="lp-panel glow-ring-teal rounded-[2rem] px-6 py-10 text-center sm:px-10 sm:py-12">
            <p className="lp-kicker text-xs text-[#79e5d2]">Launch</p>
            <h2 className="brand-display mt-4 text-4xl tracking-tight text-[#f8f3ea] md:text-5xl">
              Ready to turn your proof into a page worth sharing?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#97a4ae]">
              Bring a few real links, publish a sharper story, and leave with a
              portfolio page plus a resume that actually matches it.
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
                Talk to us
              </Link>
            </div>
          </div>
        </div>
      </section>

      <ContactSection />

      <footer className="relative z-10 border-t border-white/8 py-8">
        <div className="lp-shell flex flex-col gap-4 text-sm text-[#8f9ca6] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#79e5d2,#cffff6)] text-[10px] font-black tracking-[0.2em] text-[#041117]">AP</div>
            <div>
              <p className="brand-display text-lg leading-none text-[#f7f1e8]">
                Atrak Pages
              </p>
              <p className="mt-1 text-xs text-[#8f9ca6]">
                Personal brand builder for people with proof
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
    </>
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
