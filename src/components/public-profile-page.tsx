import { notFound } from "next/navigation";
import Image from "next/image";
import type { CSSProperties } from "react";
import type {
  EvidenceItem as PrismaEvidenceItem,
  UserProfile,
} from "@prisma/client";
import { PublicShareActions } from "@/components/public-share-actions";
import { PublicPageNav } from "@/components/public-page-nav";
import { StructuredData } from "@/components/structured-data";
import { TrackPageView } from "@/components/track-page-view";
import type { ProfileJSON } from "@/lib/schema";
import type { PublicPageUser } from "@/lib/public-page";
import { buildPublicPageModeHref, resolvePublicPageMode } from "@/lib/public-page";
import { normalizeVisibility } from "@/lib/page-visibility";
import { resolvePortfolioTheme } from "@/lib/portfolio-themes";
import { normalizeProjectMedia } from "@/lib/project-media";
import {
  ExternalLink,
  Github,
  Globe,
  Linkedin,
  Mail,
  MapPin,
  Phone,
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

function getHostnameLabel(value?: string | null) {
  if (!value) return null;

  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
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
  const proofGallery = evidenceItems.filter((item) => item.screenshot);
  const focusLabel =
    mode === "hiring"
      ? "Open for roles, collaborations, and product conversations."
      : "Organized for admissions readers who need proof, context, and trajectory.";
  const hasPublicContact =
    Boolean(userProfile?.contactNote) ||
    Boolean(userProfile?.contactEmail) ||
    Boolean(userProfile?.phone) ||
    Boolean(userProfile?.website) ||
    Boolean(userProfile?.github) ||
    Boolean(userProfile?.linkedin) ||
    Boolean(userProfile?.youtube);
  const contactNote =
    userProfile?.contactNote ??
    (mode === "hiring"
      ? "Reach out for roles, collaborations, or product conversations."
      : "Reach out for applications, mentorship, collaborations, or long-term opportunities.");
  const profileHref = buildPublicPageModeHref(basePath, mode);
  const resumeHref = buildPublicPageModeHref(
    basePath === "/" ? "/resume" : `${basePath}/resume`,
    mode
  );
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: user.name ?? username,
    alternateName: `@${username}`,
    description: profileData?.headline,
    url: profileHref,
    sameAs: [
      userProfile?.website,
      userProfile?.github,
      userProfile?.linkedin,
      userProfile?.youtube,
    ].filter(Boolean),
    knowsAbout: profileData?.skills?.map((skill) => skill.tag).slice(0, 12),
    hasPart: profileData?.projects?.slice(0, 4).map((project) => ({
      "@type": "CreativeWork",
      name: project.title,
      description: project.impact ?? project.problem ?? project.approach ?? "",
      url: project.links?.[0]?.url,
    })),
  };
  const formatContactHref = (value: string, type: "email" | "phone" | "url") => {
    if (type === "email") {
      return `mailto:${value}`;
    }

    if (type === "phone") {
      const normalizedPhone = value.replace(/[^\d+]/g, "");
      return normalizedPhone ? `tel:${normalizedPhone}` : "#";
    }

    return value;
  };

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
            Brand page coming soon
          </h1>
          <p className="mt-3 text-base leading-7" style={mutedStyle}>
            @{username} is still shaping this Atrak Pages profile and has not published the full story yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="portfolio-body min-h-screen" style={pageStyle}>
      <TrackPageView
        event="public_profile_viewed"
        metadata={{ username, mode }}
      />
      <StructuredData data={structuredData} />
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
              <div className="flex flex-wrap items-center gap-3">
                <span className="lp-kicker text-[11px]" style={accentStyle}>
                  {mode === "hiring" ? "Selected work" : "Admissions story"}
                </span>
                {userProfile?.location ? (
                  <span className="text-xs" style={mutedStyle}>
                    Based in {userProfile.location}
                  </span>
                ) : null}
                {visibility !== "public" ? (
                  <span className="rounded-full border px-3 py-1 text-xs" style={neutralBadgeStyle}>
                    {getVisibilityLabel(visibility)}
                  </span>
                ) : null}
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
              <p className={`mt-4 text-sm leading-7 ${heroCopyClass}`} style={mutedStyle}>
                Built from selected work, proof, and the execution story behind it.
              </p>

              <div className={`mt-8 flex flex-wrap gap-3 ${heroActionsClass}`}>
                {userProfile?.contactEmail && (
                  <a
                    href={formatContactHref(userProfile.contactEmail, "email")}
                    className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm"
                    style={outlineButtonStyle}
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </a>
                )}
                {userProfile?.phone && (
                  <a
                    href={formatContactHref(userProfile.phone, "phone")}
                    className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm"
                    style={outlineButtonStyle}
                  >
                    <Phone className="h-4 w-4" />
                    Call
                  </a>
                )}
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
                  Brand snapshot
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
                  Quick read
                </p>
                <div className="mt-4 space-y-3">
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
                      Best fit
                    </p>
                    <p className="mt-2 text-sm leading-7">
                      {focusLabel}
                    </p>
                  </div>
                  {profileData.skills?.length ? (
                    <div className="rounded-[1.25rem] border p-4" style={statTileStyle}>
                      <p className="text-xs uppercase tracking-[0.14em]" style={mutedStyle}>
                        Core stack
                      </p>
                      <p className="mt-2 text-sm leading-7">
                        {profileData.skills
                          .slice(0, 4)
                          .map((skill) => skill.tag)
                          .join(" · ")}
                      </p>
                    </div>
                  ) : null}
                  <div className="rounded-[1.25rem] border p-4" style={statTileStyle}>
                    <p className="text-xs uppercase tracking-[0.14em]" style={mutedStyle}>
                      Public path
                    </p>
                    <p className="mt-2 text-sm leading-7">
                      @{username}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border p-5" style={panelStyle}>
                <p className="lp-kicker text-[11px]" style={accentStyle}>
                  Share this page
                </p>
                <div className="mt-4 rounded-[1.25rem] border p-4" style={statTileStyle}>
                  <p className="text-xs uppercase tracking-[0.14em]" style={mutedStyle}>
                    Proof layer
                  </p>
                  <p className="mt-2 text-sm leading-7">
                    {proofGallery.length > 0
                      ? `${proofGallery.length} screenshot${proofGallery.length === 1 ? "" : "s"} and linked sources help a reader audit the work fast.`
                      : "Add screenshots or source links in the dashboard to make the page easier to audit at a glance."}
                  </p>
                </div>
                <PublicShareActions
                  alternateHref={resumeHref}
                  alternateLabel="Resume view"
                  copyEvent="profile_copy_link_clicked"
                  currentViewLabel="portfolio"
                  downloadHref={`/api/resume?username=${encodeURIComponent(username)}`}
                  helperText="Share the portfolio for a proof-rich first impression, copy a clean link, or jump to the recruiter-friendly resume view."
                  mutedColor={resolvedTheme.muted}
                  outlineButtonStyle={outlineButtonStyle}
                  shareLabel="Share portfolio"
                  shareText="Check out this Atrak Pages portfolio. It highlights real work, visible proof, and a companion resume view."
                  shareEvent="profile_share_clicked"
                />
              </div>
            </aside>
          </section>

          {profileData.skills?.length > 0 && (
            <section className="mt-10">
              <div className="rounded-[2rem] border p-6" style={panelStyle}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="lp-kicker text-[11px]" style={accentStyle}>
                      Capabilities
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
                      : "Structured around the arc of the work and what it reveals about the person behind it."}
                  </p>
                </div>

              <div className={projectGridClass}>
                {profileData.projects.map((project, index) => {
                  const normalizedProjectTitle = project.title.toLowerCase();
                  const evidence = evidenceItems.find((item) => {
                    const titleMatches =
                      item.title?.toLowerCase().includes(normalizedProjectTitle) ??
                      false;
                    const descriptionMatches =
                      item.description?.toLowerCase().includes(normalizedProjectTitle) ??
                      false;
                    if (titleMatches || descriptionMatches) {
                      return true;
                    }
                    if (!item.url) return false;
                    try {
                      const evidenceHost = new URL(item.url).hostname;
                      return project.links?.some((link) => {
                        try {
                          const linkHost = new URL(link.url).hostname;
                          return linkHost === evidenceHost || link.url.includes(evidenceHost);
                        } catch {
                          return link.url.includes(evidenceHost);
                        }
                      });
                    } catch {
                      return false;
                    }
                  });
                  const projectVideo = normalizeProjectMedia(project.media).find(
                    (item) => item.type === "video" && item.status === "ready"
                  );
                  const evidenceHost = getHostnameLabel(evidence?.url);
                  const primarySourceHost = getHostnameLabel(project.links?.[0]?.url ?? null);

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
                      {projectVideo ? (
                        <video
                          controls
                          playsInline
                          preload="none"
                          poster={projectVideo.posterUrl ?? undefined}
                          className={`w-full bg-black object-cover object-top ${
                            resolvedTheme.projectLayout === "feature"
                              ? "h-64"
                              : resolvedTheme.projectLayout === "stack"
                                ? "h-44"
                                : "h-52"
                          }`}
                          src={projectVideo.url}
                        />
                      ) : evidence?.screenshot ? (
                        <div
                          className={`relative w-full overflow-hidden ${
                            resolvedTheme.projectLayout === "feature"
                              ? "h-64"
                              : resolvedTheme.projectLayout === "stack"
                                ? "h-44"
                                : "h-52"
                          }`}
                        >
                          <Image
                            src={evidence.screenshot}
                            alt={project.title}
                            fill
                            sizes={
                              resolvedTheme.projectLayout === "feature"
                                ? "100vw"
                                : "(max-width: 1024px) 100vw, 50vw"
                            }
                            className="object-cover object-top"
                          />
                        </div>
                      ) : null}
                      <div className={projectCardPaddingClass}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <h3 className="text-2xl font-semibold tracking-tight">
                            {project.title}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {evidence ? (
                              <span className="rounded-full border px-3 py-1 text-[11px]" style={chipStyle}>
                                {evidenceHost ? `Proof from ${evidenceHost}` : "Proof linked"}
                              </span>
                            ) : null}
                            {project.links?.length ? (
                              <span className="rounded-full border px-3 py-1 text-[11px]" style={chipStyle}>
                                {project.links.length} source{project.links.length === 1 ? "" : "s"}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        {projectVideo ? (
                          <p className="mt-3 text-xs uppercase tracking-[0.18em]" style={accentStyle}>
                            Demo video
                          </p>
                        ) : null}
                        {project.impact ? (
                          <div className="mt-5 rounded-[1.2rem] border p-4" style={statTileStyle}>
                            <p className="lp-kicker text-[11px]" style={impactLabelStyle}>
                              Strongest outcome
                            </p>
                            <p className="mt-2 text-sm leading-7" style={impactTextStyle}>
                              {project.impact}
                            </p>
                          </div>
                        ) : null}
                        {evidence?.url ? (
                          <div className="mt-4 rounded-[1.1rem] border p-3" style={statTileStyle}>
                            <p className="text-xs uppercase tracking-[0.14em]" style={mutedStyle}>
                              Proof source
                            </p>
                            <a
                              href={evidence.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center gap-2 text-sm hover:underline"
                              style={accentStyle}
                            >
                              {evidence.title ?? evidenceHost ?? evidence.url}
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                            {evidenceHost ? (
                              <p className="mt-1 text-xs" style={mutedStyle}>
                                Source host: {evidenceHost}
                              </p>
                            ) : null}
                          </div>
                        ) : primarySourceHost ? (
                          <div className="mt-4 rounded-[1.1rem] border p-3" style={statTileStyle}>
                            <p className="text-xs uppercase tracking-[0.14em]" style={mutedStyle}>
                              Primary source
                            </p>
                            <p className="mt-2 text-sm" style={accentStyle}>
                              {primarySourceHost}
                            </p>
                          </div>
                        ) : null}
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
                          </div>
                        ) : (
                          <p className="mt-4 text-sm leading-7" style={mutedStyle}>
                            {project.impact ?? project.approach ?? project.problem}
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

          {profileData.experiences?.length > 0 && (
            <section className="mt-10">
              <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="lp-kicker text-[11px]" style={accentStyle}>
                    Experience
                  </p>
                  <h2 className="brand-display mt-2 text-4xl tracking-tight">
                    Selected Experience
                  </h2>
                </div>
                <p className="max-w-lg text-sm leading-7" style={mutedStyle}>
                  The execution history and responsibilities behind the public work.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {profileData.experiences.map((experience, index) => (
                  <article
                    key={`${experience.role}-${experience.org}-${index}`}
                    className="rounded-[1.75rem] border p-6"
                    style={panelStyle}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-semibold tracking-tight">
                          {experience.role}
                        </h3>
                        <p className="mt-1 text-sm" style={accentStyle}>
                          {experience.org}
                        </p>
                      </div>
                      {(experience.startDate || experience.endDate) && (
                        <p className="text-xs" style={mutedStyle}>
                          {experience.startDate ?? "Start"}
                          {experience.endDate ? ` - ${experience.endDate}` : " - Present"}
                        </p>
                      )}
                    </div>

                    {experience.bullets?.length > 0 && (
                      <ul className="mt-5 space-y-2">
                        {experience.bullets.map((bullet, bulletIndex) => (
                          <li
                            key={`${experience.role}-${bulletIndex}`}
                            className="flex gap-3 text-sm leading-7"
                            style={mutedStyle}
                          >
                            <span style={accentStyle}>•</span>
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}

          {profileData.timeline?.length > 0 && (
            <section className="mt-10">
              <div className="rounded-[2rem] border p-6 md:p-7" style={panelStyle}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="lp-kicker text-[11px]" style={accentStyle}>
                      Narrative arc
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
                  Signal
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

          {hasPublicContact && (
            <section className="mt-10">
              <div className="rounded-[2rem] border p-6 md:p-7" style={panelStyle}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="lp-kicker text-[11px]" style={accentStyle}>
                      Contact
                    </p>
                    <h2 className="brand-display mt-2 text-4xl tracking-tight">
                      Reach out
                    </h2>
                  </div>
                  <p className="max-w-lg text-sm leading-7" style={mutedStyle}>
                    This portfolio is meant to start real conversations, not just collect views.
                  </p>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                  <div className="rounded-[1.5rem] border p-5" style={statTileStyle}>
                    <p className="text-xs uppercase tracking-[0.14em]" style={mutedStyle}>
                      Best use
                    </p>
                    <p className="mt-3 text-sm leading-7" style={mutedStyle}>
                      {contactNote}
                    </p>
                    {userProfile?.location && (
                      <div
                        className="mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs"
                        style={chipStyle}
                      >
                        <MapPin className="h-3.5 w-3.5" />
                        {userProfile.location}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {userProfile?.contactEmail && (
                      <a
                        href={formatContactHref(userProfile.contactEmail, "email")}
                        className="rounded-[1.5rem] border p-5 transition-transform hover:-translate-y-0.5"
                        style={statTileStyle}
                      >
                        <Mail className="h-5 w-5" style={accentStyle} />
                        <p className="mt-4 text-sm font-semibold">Email</p>
                        <p className="mt-2 text-sm break-all" style={mutedStyle}>
                          {userProfile.contactEmail}
                        </p>
                      </a>
                    )}
                    {userProfile?.phone && (
                      <a
                        href={formatContactHref(userProfile.phone, "phone")}
                        className="rounded-[1.5rem] border p-5 transition-transform hover:-translate-y-0.5"
                        style={statTileStyle}
                      >
                        <Phone className="h-5 w-5" style={accentStyle} />
                        <p className="mt-4 text-sm font-semibold">Phone</p>
                        <p className="mt-2 text-sm" style={mutedStyle}>
                          {userProfile.phone}
                        </p>
                      </a>
                    )}
                    {userProfile?.website && (
                      <a
                        href={formatContactHref(userProfile.website, "url")}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-[1.5rem] border p-5 transition-transform hover:-translate-y-0.5"
                        style={statTileStyle}
                      >
                        <Globe className="h-5 w-5" style={accentStyle} />
                        <p className="mt-4 text-sm font-semibold">Website</p>
                        <p className="mt-2 text-sm break-all" style={mutedStyle}>
                          {userProfile.website}
                        </p>
                      </a>
                    )}
                    {(userProfile?.linkedin || userProfile?.github || userProfile?.youtube) && (
                      <div className="rounded-[1.5rem] border p-5" style={statTileStyle}>
                        <p className="text-sm font-semibold">Social</p>
                        <div className="mt-4 flex flex-wrap gap-3">
                          {userProfile.linkedin && (
                            <a
                              href={userProfile.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-sm hover:underline"
                              style={accentStyle}
                            >
                              <Linkedin className="h-4 w-4" />
                              LinkedIn
                            </a>
                          )}
                          {userProfile.github && (
                            <a
                              href={userProfile.github}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-sm hover:underline"
                              style={accentStyle}
                            >
                              <Github className="h-4 w-4" />
                              GitHub
                            </a>
                          )}
                          {userProfile.youtube && (
                            <a
                              href={userProfile.youtube}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-sm hover:underline"
                              style={accentStyle}
                            >
                              <Youtube className="h-4 w-4" />
                              YouTube
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {proofGallery.length > 0 && (
            <section className="mt-10 pb-16">
              <div className="mb-6">
                <p className="lp-kicker text-[11px]" style={accentStyle}>
                  Evidence
                </p>
                <h2 className="brand-display mt-2 text-4xl tracking-tight">
                  Proof Gallery
                </h2>
                <p className="mt-3 max-w-lg text-sm leading-7" style={mutedStyle}>
                  Screenshots and linked sources make the work easier to audit and easier to share.
                </p>
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
                    <div
                      className={`relative w-full overflow-hidden ${
                        resolvedTheme.proofLayout === "spotlight" && index === 0
                          ? "h-60"
                          : resolvedTheme.proofLayout === "mosaic" && index % 3 === 0
                            ? "h-56"
                            : "h-44"
                      }`}
                    >
                      <Image
                        src={item.screenshot!}
                        alt={item.title ?? "project screenshot"}
                        fill
                        sizes={
                          resolvedTheme.proofLayout === "mosaic"
                            ? "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                            : "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        }
                        className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-medium">
                        {item.title ?? "Evidence item"}
                      </p>
                      <p className="mt-1 text-xs" style={mutedStyle}>
                        {getHostnameLabel(item.url)
                          ? `Source: ${getHostnameLabel(item.url)}`
                          : "Open source proof"}
                      </p>
                      <p className="mt-2 text-xs" style={accentStyle}>
                        Open linked proof
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
          Built with Atrak Pages personal brand studio · Powered by AI ·{" "}
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
