import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import type { EvidenceItem as PrismaEvidenceItem, UserProfile } from "@/generated/prisma";
import { PublicPageNav } from "@/components/public-page-nav";
import type { ProfileJSON } from "@/lib/schema";
import type { PublicPageUser } from "@/lib/public-page";
import { resolvePublicPageMode } from "@/lib/public-page";
import { normalizeVisibility } from "@/lib/page-visibility";
import { resolvePortfolioTheme } from "@/lib/portfolio-themes";
import {
  ExternalLink,
  Github,
  Globe,
  Linkedin,
  MapPin,
  Sparkles,
  Trophy,
  Youtube,
} from "lucide-react";

interface PublicProfilePageProps {
  basePath: string;
  queryMode?: string;
  user: PublicPageUser;
  username: string;
}

function getVisibilityLabel(visibility: string) {
  if (visibility === "unlisted") {
    return "Link-only";
  }

  return visibility === "private" ? "Private" : "Public";
}

export function PublicProfilePage({
  basePath,
  queryMode,
  user,
  username,
}: PublicProfilePageProps) {
  const settings = user.publicPageSettings;
  const visibility = normalizeVisibility(settings);
  if (visibility === "private") {
    notFound();
  }

  const profileData = user.generatedProfiles[0]?.data as unknown as
    | ProfileJSON
    | undefined;
  const resolvedTheme = resolvePortfolioTheme(
    settings?.theme ?? user.profile?.theme ?? "obsidian",
    settings?.themeConfig
  );
  const mode = resolvePublicPageMode(queryMode, settings?.mode);

  const userProfile: UserProfile | null = user.profile;
  const evidenceItems: PrismaEvidenceItem[] = user.evidenceItems;

  const pageStyle: CSSProperties & Record<string, string> = {
    backgroundImage: resolvedTheme.pageBackground,
    color: resolvedTheme.text,
    fontFamily: resolvedTheme.bodyFontFamily,
    "--portfolio-display": resolvedTheme.displayFontFamily,
  };
  const panelStyle = {
    background: resolvedTheme.panelBackground,
    borderColor: resolvedTheme.panelBorder,
    boxShadow: resolvedTheme.panelShadow,
  };
  const statTileStyle = {
    background: resolvedTheme.statBackground,
    borderColor: resolvedTheme.statBorder,
  };
  const mutedStyle = { color: resolvedTheme.muted };
  const accentStyle = { color: resolvedTheme.accent };
  const chipStyle = {
    background: resolvedTheme.chipBackground,
    borderColor: resolvedTheme.chipBorder,
    color: resolvedTheme.chipText,
  };
  const outlineButtonStyle = {
    background: resolvedTheme.outlineBackground,
    borderColor: resolvedTheme.outlineBorder,
    color: resolvedTheme.outlineText,
  };
  const neutralBadgeStyle = {
    background: resolvedTheme.outlineBackground,
    borderColor: resolvedTheme.outlineBorder,
    color: resolvedTheme.outlineText,
  };
  const publicBadgeStyle = {
    borderColor: `${resolvedTheme.accent}55`,
    background: `${resolvedTheme.accent}16`,
    color: resolvedTheme.isDark ? resolvedTheme.accentSoft : resolvedTheme.accent,
  };
  const trophyTileStyle = {
    borderColor: resolvedTheme.panelBorder,
    background: resolvedTheme.isDark
      ? "rgba(255,255,255,0.05)"
      : resolvedTheme.accentSoft,
  };
  const impactLabelStyle = { color: resolvedTheme.accentWarm };
  const impactTextStyle = {
    color: resolvedTheme.isDark ? resolvedTheme.accentSoft : resolvedTheme.accent,
  };
  const heroSectionClass =
    resolvedTheme.heroLayout === "centered"
      ? "grid gap-6"
      : resolvedTheme.heroLayout === "editorial"
        ? "grid gap-6 xl:grid-cols-[minmax(0,1.18fr)_minmax(320px,0.82fr)] xl:items-start"
        : "grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:items-start";
  const heroCardClass =
    resolvedTheme.heroLayout === "centered" ? "text-center" : "";
  const heroCopyClass =
    resolvedTheme.heroLayout === "centered"
      ? "mx-auto max-w-3xl"
      : resolvedTheme.heroLayout === "editorial"
        ? "max-w-3xl"
        : "max-w-2xl";
  const heroActionsClass =
    resolvedTheme.heroLayout === "centered" ? "justify-center" : "";
  const heroAsideClass =
    resolvedTheme.heroLayout === "centered" ? "grid gap-4 md:grid-cols-2" : "grid gap-4";
  const projectGridClass =
    resolvedTheme.projectLayout === "grid"
      ? "grid gap-5 lg:grid-cols-2"
      : resolvedTheme.projectLayout === "feature"
        ? "grid gap-5"
        : "grid gap-4";
  const projectCardPaddingClass =
    resolvedTheme.projectLayout === "feature"
      ? "p-7 md:p-8"
      : resolvedTheme.projectLayout === "stack"
        ? "p-5"
        : "p-6";
  const proofGridClass =
    resolvedTheme.proofLayout === "mosaic"
      ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3";

  if (!profileData) {
    return (
      <div
        className="portfolio-body min-h-screen flex items-center justify-center"
        style={pageStyle}
      >
        <div
          className="mx-6 max-w-lg rounded-[2rem] border px-8 py-12 text-center"
          style={panelStyle}
        >
          <div
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[1.5rem] border"
            style={statTileStyle}
          >
            <Sparkles className="h-7 w-7" style={accentStyle} />
          </div>
          <h1 className="brand-display text-4xl tracking-tight">
            Profile coming soon
          </h1>
          <p className="mt-3 text-base leading-7" style={mutedStyle}>
            @{username} is still building their LifePage.
          </p>
        </div>
      </div>
    );
  }

  const proofGallery = evidenceItems.filter((item) => item.screenshot);

  return (
    <div className="portfolio-body min-h-screen" style={pageStyle}>
      {resolvedTheme.isDark && (
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div
            className="absolute left-[6%] top-[8%] h-[26rem] w-[26rem] rounded-full blur-[120px]"
            style={{ background: `${resolvedTheme.glowPrimary}18` }}
          />
          <div
            className="absolute bottom-[8%] right-[10%] h-[22rem] w-[22rem] rounded-full blur-[120px]"
            style={{ background: `${resolvedTheme.glowSecondary}18` }}
          />
        </div>
      )}

      <PublicPageNav
        activeSection="profile"
        basePath={basePath}
        theme={resolvedTheme}
        mode={mode}
      />

      <div className="relative z-10">
        <div className="lp-shell py-14 md:py-20">
          <section className={heroSectionClass}>
            <div className={`rounded-[2rem] border p-7 md:p-8 ${heroCardClass}`} style={panelStyle}>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full border px-3 py-1 text-xs"
                  style={
                    visibility === "public"
                      ? publicBadgeStyle
                      : neutralBadgeStyle
                  }
                >
                  {getVisibilityLabel(visibility)}
                </span>
                <span className="rounded-full border px-3 py-1 text-xs" style={chipStyle}>
                  {mode === "hiring" ? "Hiring view" : "Admissions view"}
                </span>
                <span className="rounded-full border px-3 py-1 text-xs" style={chipStyle}>
                  Theme: {resolvedTheme.label}
                </span>
              </div>

              <h1 className="brand-display mt-6 text-[3.4rem] leading-[0.92] tracking-[-0.05em] md:text-[4.6rem]">
                {user.name ?? username}
              </h1>
              <p className={`mt-4 text-xl leading-8 ${heroCopyClass}`} style={accentStyle}>
                {profileData.headline}
              </p>
              <p className={`mt-6 text-lg leading-8 ${heroCopyClass}`} style={mutedStyle}>
                {profileData.about}
              </p>

              <div className={`mt-8 flex flex-wrap gap-3 ${heroActionsClass}`}>
                {userProfile?.github && (
                  <a
                    href={userProfile.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm"
                    style={outlineButtonStyle}
                  >
                    <Github className="h-4 w-4" />
                    GitHub
                  </a>
                )}
                {userProfile?.linkedin && (
                  <a
                    href={userProfile.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm"
                    style={outlineButtonStyle}
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </a>
                )}
                {userProfile?.youtube && (
                  <a
                    href={userProfile.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm"
                    style={outlineButtonStyle}
                  >
                    <Youtube className="h-4 w-4" />
                    YouTube
                  </a>
                )}
                {userProfile?.website && (
                  <a
                    href={userProfile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm"
                    style={outlineButtonStyle}
                  >
                    <Globe className="h-4 w-4" />
                    Website
                  </a>
                )}
              </div>
            </div>

            <aside className={heroAsideClass}>
              <div className="rounded-[2rem] border p-5" style={panelStyle}>
                <p className="lp-kicker text-[11px]" style={accentStyle}>
                  Snapshot
                </p>
                {resolvedTheme.statsLayout === "pills" ? (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {[
                      { label: "Projects", value: profileData.stats?.projectsShipped ?? 0 },
                      { label: "Years", value: profileData.stats?.yearsBuilding ?? 0 },
                      { label: "Competitions", value: profileData.stats?.competitions ?? 0 },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-full border px-4 py-3"
                        style={statTileStyle}
                      >
                        <p className="text-lg font-semibold">{stat.value}</p>
                        <p className="mt-1 text-[11px]" style={mutedStyle}>{stat.label}</p>
                      </div>
                    ))}
                  </div>
                ) : resolvedTheme.statsLayout === "band" ? (
                  <div className="mt-4 overflow-hidden rounded-[1.25rem] border" style={statTileStyle}>
                    {[
                      { label: "Projects", value: profileData.stats?.projectsShipped ?? 0 },
                      { label: "Years", value: profileData.stats?.yearsBuilding ?? 0 },
                      { label: "Competitions", value: profileData.stats?.competitions ?? 0 },
                    ].map((stat, index, array) => (
                      <div
                        key={stat.label}
                        className="flex items-center justify-between px-4 py-3"
                        style={{
                          borderBottom: index < array.length - 1 ? `1px solid ${resolvedTheme.statBorder}` : undefined,
                        }}
                      >
                        <p className="text-sm font-medium">{stat.label}</p>
                        <p className="text-lg font-semibold">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {[
                      { label: "Projects", value: profileData.stats?.projectsShipped ?? 0 },
                      { label: "Years", value: profileData.stats?.yearsBuilding ?? 0 },
                      { label: "Competitions", value: profileData.stats?.competitions ?? 0 },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-[1.25rem] border p-4"
                        style={statTileStyle}
                      >
                        <p className="text-2xl font-semibold">{stat.value}</p>
                        <p className="mt-1 text-xs" style={mutedStyle}>{stat.label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-[2rem] border p-5" style={panelStyle}>
                <p className="lp-kicker text-[11px]" style={accentStyle}>
                  Profile details
                </p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-[1.25rem] border p-4" style={statTileStyle}>
                    <p className="text-xs uppercase tracking-[0.14em]" style={mutedStyle}>
                      Username
                    </p>
                    <p className="mt-2 text-base font-medium">@{username}</p>
                  </div>
                  {userProfile?.location && (
                    <div
                      className="flex items-center gap-3 rounded-[1.25rem] border p-4"
                      style={statTileStyle}
                    >
                      <MapPin className="h-4 w-4" style={accentStyle} />
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em]" style={mutedStyle}>
                          Location
                        </p>
                        <p className="mt-1 text-sm">{userProfile.location}</p>
                      </div>
                    </div>
                  )}
                  <div className="rounded-[1.25rem] border p-4" style={statTileStyle}>
                    <p className="text-xs uppercase tracking-[0.14em]" style={mutedStyle}>
                      Current emphasis
                    </p>
                    <p className="mt-2 text-sm leading-7">
                      {mode === "hiring"
                        ? "Structured proof, impact, and project clarity."
                        : "Story, growth, and trajectory across time."}
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </section>

          {profileData.skills?.length > 0 && (
            <section className="mt-10">
              <div className="rounded-[2rem] border p-6" style={panelStyle}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="lp-kicker text-[11px]" style={accentStyle}>
                      Skill stack
                    </p>
                    <h2 className="brand-display mt-2 text-4xl tracking-tight">
                      Skills
                    </h2>
                  </div>
                  <p className="max-w-lg text-sm leading-7" style={mutedStyle}>
                    A compact read on the tools and strengths that shape the work.
                  </p>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  {profileData.skills.map((skill) => (
                    <span
                      key={skill.tag}
                      className="rounded-full border px-4 py-2 text-sm"
                      style={chipStyle}
                    >
                      {skill.tag}
                      <span className="ml-2 text-xs capitalize" style={mutedStyle}>
                        {skill.level}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </section>
          )}

          {profileData.projects?.length > 0 && (
            <section className="mt-10">
              <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="lp-kicker text-[11px]" style={accentStyle}>
                    Work
                  </p>
                  <h2 className="brand-display mt-2 text-4xl tracking-tight">
                    {mode === "hiring" ? "Case Studies" : "Projects & Work"}
                  </h2>
                </div>
                <p className="max-w-lg text-sm leading-7" style={mutedStyle}>
                  {mode === "hiring"
                    ? "Structured around the problem, approach, and measurable outcome."
                    : "Structured around the arc of the work and what it says about the person."}
                </p>
              </div>

              <div className={projectGridClass}>
                {profileData.projects.map((project, index) => {
                  const evidence = evidenceItems.find((item) => {
                    if (!item.url) return false;
                    try {
                      const evidenceHost = new URL(item.url).hostname;
                      return project.links?.some((link) =>
                        link.url.includes(evidenceHost)
                      );
                    } catch {
                      return false;
                    }
                  });

                  return (
                    <article
                      key={project.title}
                      className="overflow-hidden rounded-[1.75rem] border"
                      style={{
                        ...panelStyle,
                        ...(resolvedTheme.projectLayout === "feature" && index === 0
                          ? { boxShadow: `0 28px 90px ${resolvedTheme.accent}18` }
                          : null),
                      }}
                    >
                      {evidence?.screenshot && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={evidence.screenshot}
                          alt={project.title}
                          className={`w-full object-cover object-top ${
                            resolvedTheme.projectLayout === "feature"
                              ? "h-64"
                              : resolvedTheme.projectLayout === "stack"
                                ? "h-44"
                                : "h-52"
                          }`}
                        />
                      )}
                      <div className={projectCardPaddingClass}>
                        <h3 className="text-2xl font-semibold tracking-tight">
                          {project.title}
                        </h3>
                        {mode === "hiring" ? (
                          <div className="mt-5 space-y-4">
                            {project.problem && (
                              <div>
                                <p className="lp-kicker text-[11px]" style={accentStyle}>
                                  Problem
                                </p>
                                <p className="mt-2 text-sm leading-7" style={mutedStyle}>
                                  {project.problem}
                                </p>
                              </div>
                            )}
                            {project.approach && (
                              <div>
                                <p className="lp-kicker text-[11px]" style={accentStyle}>
                                  Approach
                                </p>
                                <p className="mt-2 text-sm leading-7" style={mutedStyle}>
                                  {project.approach}
                                </p>
                              </div>
                            )}
                            {project.impact && (
                              <div>
                                <p className="lp-kicker text-[11px]" style={impactLabelStyle}>
                                  Impact
                                </p>
                                <p className="mt-2 text-sm leading-7" style={impactTextStyle}>
                                  {project.impact}
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="mt-4 text-sm leading-7" style={mutedStyle}>
                            {project.approach ?? project.problem}
                          </p>
                        )}

                        {project.tech?.length > 0 && (
                          <div className="mt-5 flex flex-wrap gap-2">
                            {project.tech.map((tech) => (
                              <span
                                key={tech}
                                className="rounded-full border px-3 py-1.5 text-xs"
                                style={chipStyle}
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}

                        {project.links?.length > 0 && (
                          <div className="mt-5 flex flex-wrap gap-3">
                            {project.links.map((link) => (
                              <a
                                key={link.url}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm hover:underline"
                                style={accentStyle}
                              >
                                {link.label}
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {profileData.timeline?.length > 0 && (
            <section className="mt-10">
              <div className="rounded-[2rem] border p-6 md:p-7" style={panelStyle}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="lp-kicker text-[11px]" style={accentStyle}>
                      Journey
                    </p>
                    <h2 className="brand-display mt-2 text-4xl tracking-tight">
                      Timeline
                    </h2>
                  </div>
                  <p className="max-w-lg text-sm leading-7" style={mutedStyle}>
                    A documentary-style view of how the work and the person evolved.
                  </p>
                </div>

                {resolvedTheme.timelineLayout === "minimal" ? (
                  <div className="mt-8 space-y-4">
                    {profileData.timeline.map((entry) => (
                      <div
                        key={entry.year}
                        className="rounded-[1.35rem] border p-4"
                        style={statTileStyle}
                      >
                        <p className="brand-display text-2xl tracking-tight" style={accentStyle}>
                          {entry.year}
                        </p>
                        <p className="mt-2 text-sm leading-7" style={mutedStyle}>
                          {entry.milestones.join(" · ")}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : resolvedTheme.timelineLayout === "rail" ? (
                  <div className="relative mt-8 pl-6">
                    <div
                      className="absolute bottom-0 left-2 top-0 w-px"
                      style={{ background: resolvedTheme.statBorder }}
                    />
                    <div className="space-y-6">
                      {profileData.timeline.map((entry) => (
                        <div key={entry.year} className="relative">
                          <div
                            className="absolute left-[-1.1rem] top-2 h-3 w-3 rounded-full border-2"
                            style={{
                              background: resolvedTheme.accent,
                              borderColor: resolvedTheme.accentSoft,
                            }}
                          />
                          <div className="rounded-[1.35rem] border p-5" style={statTileStyle}>
                            <p className="brand-display text-3xl tracking-tight" style={accentStyle}>
                              {entry.year}
                            </p>
                            <ul className="mt-3 space-y-2">
                              {entry.milestones.map((milestone, index) => (
                                <li key={index} className="text-sm leading-7" style={mutedStyle}>
                                  {milestone}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-8 space-y-5">
                    {profileData.timeline.map((entry) => (
                      <div
                        key={entry.year}
                        className="flex gap-4 rounded-[1.5rem] border p-5"
                        style={statTileStyle}
                      >
                        <div className="min-w-[4.5rem]">
                          <p className="brand-display text-3xl tracking-tight" style={accentStyle}>
                            {entry.year}
                          </p>
                        </div>
                        <ul className="space-y-2">
                          {entry.milestones.map((milestone, index) => (
                            <li key={index} className="text-sm leading-7" style={mutedStyle}>
                              {milestone}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {profileData.achievements?.length > 0 && (
            <section className="mt-10">
              <div className="mb-6">
                <p className="lp-kicker text-[11px]" style={accentStyle}>
                  Wins
                </p>
                <h2 className="brand-display mt-2 text-4xl tracking-tight">
                  Achievements
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {profileData.achievements.map((achievement) => (
                  <div
                    key={achievement.title}
                    className="rounded-[1.75rem] border p-5"
                    style={panelStyle}
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border" style={trophyTileStyle}>
                      <Trophy className="h-5 w-5" style={accentStyle} />
                    </div>
                    <h3 className="text-lg font-semibold">{achievement.title}</h3>
                    {achievement.context && (
                      <p className="mt-2 text-sm leading-7" style={mutedStyle}>
                        {achievement.context}
                      </p>
                    )}
                    {achievement.date && (
                      <p className="mt-3 text-xs" style={mutedStyle}>
                        {achievement.date}
                      </p>
                    )}
                    {achievement.proof && (
                      <a
                        href={achievement.proof}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-2 text-sm hover:underline"
                        style={accentStyle}
                      >
                        View proof
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {proofGallery.length > 0 && (
            <section className="mt-10 pb-16">
              <div className="mb-6">
                <p className="lp-kicker text-[11px]" style={accentStyle}>
                  Proof
                </p>
                <h2 className="brand-display mt-2 text-4xl tracking-tight">
                  Proof Gallery
                </h2>
              </div>

              <div className={proofGridClass}>
                {proofGallery.map((item, index) => (
                  <a
                    key={item.id}
                    href={item.url ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group overflow-hidden rounded-[1.5rem] border ${
                      resolvedTheme.proofLayout === "spotlight" && index === 0
                        ? "sm:col-span-2"
                        : resolvedTheme.proofLayout === "mosaic" && index % 3 === 0
                          ? "lg:col-span-2"
                          : ""
                    }`}
                    style={panelStyle}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.screenshot!}
                      alt={item.title ?? "project screenshot"}
                      className={`w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.04] ${
                        resolvedTheme.proofLayout === "spotlight" && index === 0
                          ? "h-60"
                          : resolvedTheme.proofLayout === "mosaic" && index % 3 === 0
                            ? "h-56"
                            : "h-44"
                      }`}
                    />
                    <div className="p-4">
                      <p className="text-sm font-medium">
                        {item.title ?? "Evidence item"}
                      </p>
                      <p className="mt-1 text-xs" style={mutedStyle}>
                        Open source proof
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <footer
        className="border-t py-8"
        style={{ borderTopColor: resolvedTheme.footerBorder }}
      >
        <div className="lp-shell text-center text-xs" style={mutedStyle}>
          Built with LifePage personal brand builder · Powered by AI ·{" "}
          <a
            href="https://atrak.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
            style={accentStyle}
          >
            atrak.dev
          </a>
        </div>
      </footer>
    </div>
  );
}
