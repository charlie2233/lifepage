import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, ArrowUpRight, Compass, Globe, Sparkles } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { prisma } from "@/lib/db";
import { getDemoExploreProfiles } from "@/lib/demo-public-pages";
import { resolvePortfolioTheme } from "@/lib/portfolio-themes";
import { SITE_NAME, absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Explore Personal Brands",
  description:
    "Browse public personal brand sites, proof-driven portfolios, and resume-ready launches built with LifePage.",
  alternates: {
    canonical: absoluteUrl("/explore"),
  },
  openGraph: {
    title: `Explore Personal Brands — ${SITE_NAME}`,
    description:
      "Browse public personal brand sites, proof-driven portfolios, and resume-ready launches built with LifePage.",
    url: absoluteUrl("/explore"),
    images: [absoluteUrl("/og-lifepage.svg")],
  },
};

export const revalidate = 600;

interface ProfileData {
  headline?: string;
  skills?: Array<{ tag: string }>;
  stats?: {
    projectsShipped?: number;
    yearsBuilding?: number;
    competitions?: number;
  };
}

export default async function ExplorePage() {
  let profiles: Array<{
    username: string;
    name: string;
    avatar: string | null;
    headline: string | null;
    skills: string[];
    stats: ProfileData["stats"];
    theme: string;
    screenshot: string | null;
    joinedAt: Date;
  }> = [];

  try {
    const users = await prisma.user.findMany({
      where: {
        publicPageSettings: { is: { isPublic: true } },
        generatedProfiles: { some: { isActive: true } },
      },
      select: {
        username: true,
        name: true,
        avatar: true,
        createdAt: true,
        generatedProfiles: {
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { data: true },
        },
        publicPageSettings: {
          select: { theme: true },
        },
        evidenceItems: {
          where: { visible: true },
          orderBy: { createdAt: "asc" },
          take: 1,
          select: { screenshot: true, title: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 48,
    });

    profiles = users
      .filter((user) => user.username)
      .map((user) => {
        const data = (user.generatedProfiles[0]?.data ?? {}) as ProfileData;
        return {
          username: user.username!,
          name: user.name ?? user.username!,
          avatar: user.avatar,
          headline: data.headline ?? null,
          skills: (data.skills ?? []).slice(0, 4).map((skill) => skill.tag),
          stats: data.stats ?? {},
          theme: user.publicPageSettings?.theme ?? "obsidian",
          screenshot: user.evidenceItems[0]?.screenshot ?? null,
          joinedAt: user.createdAt,
        };
      });
  } catch (error) {
    console.warn("Falling back from explore profile lookup:", error);
  }

  if (profiles.length === 0) {
    profiles = getDemoExploreProfiles();
  }

  return (
    <div className="lp-page text-white">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 left-[12%] h-[24rem] w-[24rem] rounded-full bg-[#79e5d2]/10 blur-[120px]" />
        <div className="absolute bottom-[8%] right-[10%] h-[22rem] w-[22rem] rounded-full bg-[#8fa9ff]/10 blur-[120px]" />
      </div>

      <nav className="relative z-10 border-b border-white/8 bg-[#091015]/70 backdrop-blur-2xl">
        <div className="lp-shell flex items-center justify-between py-5">
          <Link href="/" className="flex items-center gap-3">
            <BrandMark className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#79e5d2,#cffff6)] text-[#041117]" />
            <div>
              <p className="brand-display text-[1.35rem] leading-none tracking-tight">
                LifePage
              </p>
              <p className="lp-kicker mt-1 text-[10px] text-[#94a2ad]">
                Public brand pages
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 md:gap-3">
            <span className="hidden rounded-full border border-[#79e5d2]/20 bg-[#79e5d2]/10 px-3 py-1.5 text-sm text-[#79e5d2] sm:inline-flex">
              Explore
            </span>
            <Link
              href="/"
              className="lp-button-ghost hidden px-3 py-2 text-sm sm:inline-flex"
            >
              Home
            </Link>
            <Link
              href="/login"
              className="lp-button-secondary px-4 py-2 text-sm"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="lp-button-primary px-4 py-2 text-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <div className="relative z-10">
        <div className="lp-shell py-14 md:py-20">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)] lg:items-end">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#79e5d2]">
                <Compass className="h-3.5 w-3.5" />
                <span className="lp-kicker text-[11px]">Explore launches</span>
              </div>
              <h1 className="brand-display mt-4 text-5xl tracking-tight text-[#f8f3ea] md:text-6xl">
                Browse public brand sites that already feel shipped
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-[#99a6af]">
                Discover creators, engineers, designers, students, and applicants
                who turned scattered work into a sharper public story with LifePage.
              </p>
            </div>

            <div className="lp-panel rounded-[1.75rem] p-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="lp-stat-tile p-4">
                  <p className="lp-kicker text-[10px] text-[#79e5d2]">
                    Live pages
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-[#f8f3ea]">
                    {profiles.length}
                  </p>
                </div>
                <div className="lp-stat-tile p-4">
                  <p className="lp-kicker text-[10px] text-[#79e5d2]">
                    Access
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[#d4dce2]">
                    Public launches only
                  </p>
                </div>
                <div className="lp-stat-tile p-4">
                  <p className="lp-kicker text-[10px] text-[#79e5d2]">
                    Format
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[#d4dce2]">
                    Story, proof, resume-ready framing
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {profiles.length === 0 ? (
          <div className="lp-shell pb-20">
            <div className="lp-panel rounded-[2rem] px-6 py-20 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[1.5rem] border border-[#79e5d2]/20 bg-[#79e5d2]/10">
                <Sparkles className="h-7 w-7 text-[#79e5d2]" />
              </div>
              <h2 className="brand-display text-4xl tracking-tight text-[#f8f3ea]">
                No public launches yet
              </h2>
              <p className="mx-auto mt-3 max-w-md text-base leading-7 text-[#97a4ae]">
                Be the first to turn your work into a live brand site.
              </p>
              <Link
                href="/register"
                className="lp-button-primary mt-8 px-6 py-3.5 text-base"
              >
                Build my brand
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="lp-shell pb-20">
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {profiles.map((profile) => {
                const cardTheme = resolvePortfolioTheme(profile.theme);
                const launchYear = profile.joinedAt.getFullYear();
                return (
                  <Link
                    key={profile.username}
                    href={`/u/${profile.username}`}
                    className="lp-panel group flex flex-col rounded-[1.75rem] overflow-hidden"
                  >
                    {profile.screenshot ? (
                      <div className="h-52 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={profile.screenshot}
                          alt={`${profile.name}'s portfolio`}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
                        />
                      </div>
                    ) : (
                      <div
                        className="relative flex h-52 items-end overflow-hidden px-6 py-5"
                        style={{ background: cardTheme.previewBackground }}
                      >
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_48%)]" />
                        <div className="relative">
                          <p className="lp-kicker text-[10px] text-[#c7d2d9]">
                            Public launch
                          </p>
                          <p className="mt-2 brand-display text-3xl tracking-tight text-[#f8f3ea]">
                            {profile.name}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-[#f7f1e8]">
                            {profile.name}
                          </p>
                          <p className="mt-1 text-sm text-[#8f9ca5]">
                            @{profile.username}
                          </p>
                        </div>
                        <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
                          <span className="inline-flex items-center gap-1">
                            <Globe className="h-3.5 w-3.5" />
                            Public
                          </span>
                        </span>
                      </div>

                      {profile.headline && (
                        <p className="mt-4 text-sm leading-7 text-[#98a5ae]">
                          {profile.headline}
                        </p>
                      )}

                      {profile.skills.length > 0 && (
                        <div className="mt-5 flex flex-wrap gap-2">
                          {profile.skills.map((skill) => (
                            <span
                              key={skill}
                              className="rounded-full border px-3 py-1.5 text-xs"
                              style={{
                                borderColor: cardTheme.chipBorder,
                                background: cardTheme.chipBackground,
                                color: cardTheme.chipText,
                              }}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-6 grid grid-cols-3 gap-3">
                        <div
                          className="lp-stat-tile p-3"
                          style={{
                            borderColor: cardTheme.statBorder,
                            background: cardTheme.statBackground,
                          }}
                        >
                          <p className="text-lg font-semibold text-[#f8f3ea]">
                            {profile.stats?.projectsShipped ?? 0}
                          </p>
                          <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-[#87949e]">
                            Projects
                          </p>
                        </div>
                        <div
                          className="lp-stat-tile p-3"
                          style={{
                            borderColor: cardTheme.statBorder,
                            background: cardTheme.statBackground,
                          }}
                        >
                          <p className="text-lg font-semibold text-[#f8f3ea]">
                            {profile.stats?.yearsBuilding ?? 0}
                          </p>
                          <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-[#87949e]">
                            Years
                          </p>
                        </div>
                        <div
                          className="lp-stat-tile p-3"
                          style={{
                            borderColor: cardTheme.statBorder,
                            background: cardTheme.statBackground,
                          }}
                        >
                          <p className="text-lg font-semibold text-[#f8f3ea]">
                            {launchYear}
                          </p>
                          <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-[#87949e]">
                            Joined
                          </p>
                        </div>
                      </div>

                      <div className="mt-auto pt-6">
                        <span className="inline-flex items-center gap-2 text-sm font-medium text-[#f7f1e8] group-hover:text-[#79e5d2]">
                          Open brand site
                          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="mt-12 border-t border-white/8 pt-8 text-center">
              <p className="text-sm text-[#97a4ae]">
                Want your launch here?
              </p>
              <Link
                href="/register"
                className="lp-button-primary mt-4 px-6 py-3.5 text-base"
              >
                Build your brand
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </div>

      <footer className="relative z-10 border-t border-white/8 py-8">
        <div className="lp-shell text-center text-xs text-[#8f9ca6]">
          Built by{" "}
          <a
            href="https://atrak.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#79e5d2] hover:text-[#cffff6]"
          >
            atrak.dev
          </a>{" "}
          · LifePage
        </div>
      </footer>
    </div>
  );
}
