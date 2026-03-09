import { notFound } from "next/navigation";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { UserProfile } from "@prisma/client";
import { PublicPageNav } from "@/components/public-page-nav";
import type { PublicPageUser } from "@/lib/public-page";
import { buildPublicPageModeHref, resolvePublicPageMode } from "@/lib/public-page";
import { buildResumeData } from "@/lib/public-resume";
import { normalizeVisibility } from "@/lib/page-visibility";
import { resolvePortfolioTheme } from "@/lib/portfolio-themes";
import { resolveResumeModel, type ResolvedResumeModel } from "@/lib/resume-models";
import { ProfileJSONSchema } from "@/lib/schema";
import {
  ArrowUpRight,
  Download,
  ExternalLink,
  FileText,
  MapPin,
} from "lucide-react";

interface PublicResumePageProps {
  basePath: string;
  queryMode?: string;
  user: PublicPageUser;
  username: string;
}

function BulletMark({
  accent,
  style,
}: {
  accent: string;
  style: ResolvedResumeModel["bulletStyle"];
}) {
  if (style === "dash") {
    return (
      <span
        aria-hidden
        className="mt-[0.95rem] block h-px w-3 shrink-0 rounded-full"
        style={{ background: accent }}
      />
    );
  }

  if (style === "diamond") {
    return (
      <span
        aria-hidden
        className="mt-3 block h-2.5 w-2.5 shrink-0 rotate-45 rounded-[1px]"
        style={{ background: accent }}
      />
    );
  }

  return (
    <span
      aria-hidden
      className="mt-[0.75rem] block h-2.5 w-2.5 shrink-0 rounded-full"
      style={{ background: accent }}
    />
  );
}

function ResumeBulletList({
  accent,
  bulletStyle,
  items,
  textColor,
}: {
  accent: string;
  bulletStyle: ResolvedResumeModel["bulletStyle"];
  items: string[];
  textColor: string;
}) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item}
          className="flex items-start gap-3 text-sm leading-7"
          style={{ color: textColor }}
        >
          <BulletMark accent={accent} style={bulletStyle} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ResumeSection({
  accent,
  children,
  model,
  title,
}: {
  accent: string;
  children: ReactNode;
  model: ResolvedResumeModel;
  title: string;
}) {
  const isDividers = model.sectionStyle === "dividers";
  const isBands = model.sectionStyle === "bands";
  const style: CSSProperties = isDividers
    ? { borderTopColor: model.articleBorder }
    : {
        borderColor: model.articleBorder,
        background: isBands ? `${model.accentSoft}99` : model.articleBackground,
        borderLeftColor: isBands ? model.accent : model.articleBorder,
        borderLeftWidth: isBands ? 5 : 1,
      };

  return (
    <section
      className={
        isDividers
          ? "border-t pt-7 first:border-t-0 first:pt-0"
          : "rounded-[1.75rem] border p-6 first:mt-0 md:p-7"
      }
      style={style}
    >
      <p className="lp-kicker text-[11px]" style={{ color: accent }}>
        {title}
      </p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ResumeAsideCard({
  accent,
  children,
  title,
  background,
  borderColor,
}: {
  accent: string;
  children: ReactNode;
  title: string;
  background: string;
  borderColor: string;
}) {
  return (
    <div
      className="rounded-[1.5rem] border p-5"
      style={{ background, borderColor }}
    >
      <p className="lp-kicker text-[11px]" style={{ color: accent }}>
        {title}
      </p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function ResumeDocumentHeader({
  accent,
  meta,
  model,
  muted,
  name,
  headline,
}: {
  accent: string;
  meta: ReactNode;
  model: ResolvedResumeModel;
  muted: string;
  name: string;
  headline: string;
}) {
  if (model.headerLayout === "centered") {
    return (
      <header className="border-b pb-8 text-center" style={{ borderBottomColor: model.articleBorder }}>
        <p className="lp-kicker text-[11px]" style={{ color: accent }}>
          Resume
        </p>
        <h2 className="brand-display mt-3 text-[3rem] leading-[0.95] tracking-[-0.05em]">
          {name}
        </h2>
        <p className="mt-3 text-lg" style={{ color: accent }}>
          {headline}
        </p>
        <div className="mx-auto mt-5 max-w-xl text-sm leading-7" style={{ color: muted }}>
          {meta}
        </div>
      </header>
    );
  }

  if (model.headerLayout === "stacked") {
    return (
      <header className="border-b pb-8" style={{ borderBottomColor: model.articleBorder }}>
        <p className="lp-kicker text-[11px]" style={{ color: accent }}>
          Resume
        </p>
        <h2 className="brand-display mt-3 text-[3rem] leading-[0.95] tracking-[-0.05em]">
          {name}
        </h2>
        <p className="mt-3 text-lg" style={{ color: accent }}>
          {headline}
        </p>
        <div className="mt-4 max-w-2xl text-sm leading-7" style={{ color: muted }}>
          {meta}
        </div>
      </header>
    );
  }

  return (
    <header
      className="flex flex-col gap-6 border-b pb-8 lg:flex-row lg:items-start lg:justify-between"
      style={{ borderBottomColor: model.articleBorder }}
    >
      <div className="max-w-3xl">
        <p className="lp-kicker text-[11px]" style={{ color: accent }}>
          Resume
        </p>
        <h2 className="brand-display mt-3 text-[3rem] leading-[0.95] tracking-[-0.05em]">
          {name}
        </h2>
        <p className="mt-3 text-lg" style={{ color: accent }}>
          {headline}
        </p>
      </div>
      <div className="max-w-sm text-sm leading-7" style={{ color: muted }}>
        {meta}
      </div>
    </header>
  );
}

export function PublicResumePage({
  basePath,
  queryMode,
  user,
  username,
}: PublicResumePageProps) {
  const visibility = normalizeVisibility(user.publicPageSettings);
  if (visibility === "private") {
    notFound();
  }

  const resolvedTheme = resolvePortfolioTheme(
    user.publicPageSettings?.theme ?? user.profile?.theme ?? "obsidian",
    user.publicPageSettings?.themeConfig
  );
  const resolvedResumeModel = resolveResumeModel(
    user.publicPageSettings?.resumeModel,
    user.publicPageSettings?.resumeModelConfig
  );
  const mode = resolvePublicPageMode(queryMode, user.publicPageSettings?.mode);
  const userProfile: UserProfile | null = user.profile;

  const activeProfile = user.generatedProfiles[0];
  const parsedProfile = ProfileJSONSchema.safeParse(activeProfile?.data);

  const pageStyle: CSSProperties & Record<string, string> = {
    backgroundImage: resolvedTheme.pageBackground,
    color: resolvedTheme.text,
    fontFamily: resolvedResumeModel.bodyFontFamily,
    "--portfolio-display": resolvedResumeModel.displayFontFamily,
  };
  const panelStyle = {
    background: resolvedTheme.panelBackground,
    borderColor: resolvedTheme.panelBorder,
    boxShadow: resolvedTheme.panelShadow,
  };
  const outlineButtonStyle = {
    background: resolvedTheme.outlineBackground,
    borderColor: resolvedTheme.outlineBorder,
    color: resolvedTheme.outlineText,
  };
  const chipStyle = {
    background: resolvedTheme.chipBackground,
    borderColor: resolvedTheme.chipBorder,
    color: resolvedTheme.chipText,
  };
  const mutedStyle = { color: resolvedTheme.muted };
  const sideTileStyle = {
    background: resolvedTheme.statBackground,
    borderColor: resolvedTheme.statBorder,
    color: resolvedTheme.isDark ? resolvedTheme.text : "#2b221a",
  };
  const sheetStyle = {
    background: resolvedResumeModel.sheetBackground,
    borderColor: resolvedResumeModel.sheetBorder,
    boxShadow: resolvedTheme.panelShadow,
    color: resolvedResumeModel.sheetText,
  };
  const primaryButtonStyle = {
    borderColor: resolvedTheme.accentWarm,
    background: `linear-gradient(135deg, ${resolvedTheme.accentWarm}, ${resolvedTheme.accentSoft})`,
    color: "#2a1203",
  };
  const documentMuted = resolvedResumeModel.sheetMuted;
  const articleStyle = {
    borderColor: resolvedResumeModel.articleBorder,
    background: resolvedResumeModel.articleBackground,
  };

  if (!parsedProfile.success) {
    return (
      <div className="portfolio-body min-h-screen" style={pageStyle}>
        <PublicPageNav
          activeSection="resume"
          basePath={basePath}
          theme={resolvedTheme}
          mode={mode}
        />
        <div className="lp-shell py-16">
          <div
            className="rounded-[2rem] border px-8 py-12 text-center"
            style={sheetStyle}
          >
            <div
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[1.5rem] border"
              style={sideTileStyle}
            >
              <FileText className="h-6 w-6" style={{ color: resolvedResumeModel.accent }} />
            </div>
            <h1 className="brand-display text-4xl tracking-tight">
              Resume coming soon
            </h1>
            <p className="mt-3 text-base leading-7" style={{ color: documentMuted }}>
              @{username} has not published a full resume view yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const resume = buildResumeData({
    email: user.email,
    includeEmail: false,
    name: user.name ?? username,
    profile: parsedProfile.data,
    profileLinks: userProfile,
    username: user.username,
  });

  const metaParts = [
    resume.username ? `@${resume.username}` : null,
    resume.location ?? null,
    `${resolvedResumeModel.label} model`,
  ].filter(Boolean) as string[];
  const reviewLabel = mode === "admissions" ? "admissions review" : "hiring review";

  const metaBlock = (
    <>
      {resume.username && <p>@{resume.username}</p>}
      {resume.location && <p>{resume.location}</p>}
      {resume.links.map((link) => (
        <p key={link.url}>
          {link.label}: {link.url}
        </p>
      ))}
    </>
  );

  const mainSections = (
    <div className="space-y-6">
      <ResumeSection
        accent={resolvedResumeModel.accent}
        model={resolvedResumeModel}
        title="Summary"
      >
        <p className="text-base leading-8" style={{ color: resolvedResumeModel.sheetText }}>
          {resume.summary}
        </p>
      </ResumeSection>

      {resume.bullets.length > 0 && (
        <ResumeSection
          accent={resolvedResumeModel.accent}
          model={resolvedResumeModel}
          title="Selected impact"
        >
          <ResumeBulletList
            accent={resolvedResumeModel.accent}
            bulletStyle={resolvedResumeModel.bulletStyle}
            items={resume.bullets}
            textColor={resolvedResumeModel.sheetText}
          />
        </ResumeSection>
      )}

      {resolvedResumeModel.asideLayout === "hidden" && resume.skills.length > 0 && (
        <ResumeSection
          accent={resolvedResumeModel.accent}
          model={resolvedResumeModel}
          title="Skills"
        >
          <div className="flex flex-wrap gap-2">
            {resume.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full border px-3 py-1.5 text-xs"
                style={{
                  background: `${resolvedResumeModel.accentSoft}99`,
                  borderColor: `${resolvedResumeModel.accent}33`,
                  color: resolvedResumeModel.sheetText,
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        </ResumeSection>
      )}

      {resume.experiences.length > 0 && (
        <ResumeSection
          accent={resolvedResumeModel.accent}
          model={resolvedResumeModel}
          title="Experience"
        >
          <div className="space-y-5">
            {resume.experiences.map((experience, index) => (
              <article
                key={`${experience.role}-${experience.org}-${index}`}
                className="rounded-[1.5rem] border p-5"
                style={articleStyle}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: resolvedResumeModel.sheetText }}>
                      {experience.role}
                    </h3>
                    <p className="mt-1 text-sm" style={{ color: documentMuted }}>
                      {experience.org}
                    </p>
                  </div>
                  <p className="text-sm" style={{ color: documentMuted }}>
                    {experience.startDate ?? ""}
                    {experience.startDate || experience.endDate ? " - " : ""}
                    {experience.endDate ?? "Present"}
                  </p>
                </div>
                {experience.bullets.length > 0 && (
                  <div className="mt-4">
                    <ResumeBulletList
                      accent={resolvedResumeModel.accent}
                      bulletStyle={resolvedResumeModel.bulletStyle}
                      items={experience.bullets}
                      textColor={resolvedResumeModel.sheetText}
                    />
                  </div>
                )}
              </article>
            ))}
          </div>
        </ResumeSection>
      )}

      {resume.projects.length > 0 && (
        <ResumeSection
          accent={resolvedResumeModel.accent}
          model={resolvedResumeModel}
          title="Projects"
        >
          <div className="space-y-5">
            {resume.projects.map((project, index) => (
              <article
                key={`${project.title}-${index}`}
                className="rounded-[1.5rem] border p-5"
                style={articleStyle}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: resolvedResumeModel.sheetText }}>
                      {project.title}
                    </h3>
                    {project.tech.length > 0 && (
                      <p className="mt-2 text-sm" style={{ color: documentMuted }}>
                        {project.tech.join(", ")}
                      </p>
                    )}
                  </div>
                  {project.links.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {project.links.map((link) => (
                        <a
                          key={link.url}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm hover:underline"
                          style={{ color: resolvedResumeModel.accent }}
                        >
                          {link.label}
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <p className="mt-4 text-sm leading-7" style={{ color: resolvedResumeModel.sheetText }}>
                  {project.impact ?? project.approach ?? project.problem ?? ""}
                </p>
              </article>
            ))}
          </div>
        </ResumeSection>
      )}

      {resolvedResumeModel.asideLayout === "hidden" && resume.achievements.length > 0 && (
        <ResumeSection
          accent={resolvedResumeModel.accent}
          model={resolvedResumeModel}
          title="Highlights"
        >
          <div className="space-y-4">
            {resume.achievements.map((achievement) => (
              <div
                key={achievement.title}
                className="rounded-[1.4rem] border p-4"
                style={articleStyle}
              >
                <p className="text-sm font-medium" style={{ color: resolvedResumeModel.sheetText }}>
                  {achievement.title}
                </p>
                {achievement.context && (
                  <p className="mt-1 text-xs" style={{ color: documentMuted }}>
                    {achievement.context}
                  </p>
                )}
                {achievement.date && (
                  <p className="mt-2 text-xs" style={{ color: documentMuted }}>
                    {achievement.date}
                  </p>
                )}
              </div>
            ))}
          </div>
        </ResumeSection>
      )}
    </div>
  );

  const asidePanels = (
    <div className="space-y-4">
      <ResumeAsideCard
        accent={resolvedResumeModel.accent}
        background={resolvedResumeModel.articleBackground}
        borderColor={resolvedResumeModel.articleBorder}
        title="Links"
      >
        <div className="space-y-3">
          {resume.location && (
            <div className="rounded-[1.25rem] border p-4" style={articleStyle}>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" style={{ color: resolvedResumeModel.accent }} />
                <span className="text-sm" style={{ color: resolvedResumeModel.sheetText }}>
                  {resume.location}
                </span>
              </div>
            </div>
          )}
          {resume.links.length > 0 ? (
            resume.links.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-[1.25rem] border p-4"
                style={articleStyle}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium" style={{ color: resolvedResumeModel.sheetText }}>
                      {link.label}
                    </p>
                    <p className="mt-1 text-xs" style={{ color: documentMuted }}>
                      {link.url}
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4" style={{ color: resolvedResumeModel.accent }} />
                </div>
              </a>
            ))
          ) : (
            <div className="rounded-[1.25rem] border p-4" style={articleStyle}>
              <p className="text-sm" style={{ color: documentMuted }}>
                No external links published.
              </p>
            </div>
          )}
        </div>
      </ResumeAsideCard>

      {resume.skills.length > 0 && (
        <ResumeAsideCard
          accent={resolvedResumeModel.accent}
          background={resolvedResumeModel.articleBackground}
          borderColor={resolvedResumeModel.articleBorder}
          title="Skills"
        >
          <div className="flex flex-wrap gap-2">
            {resume.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full border px-3 py-1.5 text-xs"
                style={{
                  background: `${resolvedResumeModel.accentSoft}99`,
                  borderColor: `${resolvedResumeModel.accent}33`,
                  color: resolvedResumeModel.sheetText,
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        </ResumeAsideCard>
      )}

      {resume.achievements.length > 0 && (
        <ResumeAsideCard
          accent={resolvedResumeModel.accent}
          background={resolvedResumeModel.articleBackground}
          borderColor={resolvedResumeModel.articleBorder}
          title="Highlights"
        >
          <div className="space-y-3">
            {resume.achievements.map((achievement) => (
              <div
                key={achievement.title}
                className="rounded-[1.25rem] border p-4"
                style={articleStyle}
              >
                <p className="text-sm font-medium" style={{ color: resolvedResumeModel.sheetText }}>
                  {achievement.title}
                </p>
                {achievement.context && (
                  <p className="mt-1 text-xs" style={{ color: documentMuted }}>
                    {achievement.context}
                  </p>
                )}
                {achievement.date && (
                  <p className="mt-2 text-xs" style={{ color: documentMuted }}>
                    {achievement.date}
                  </p>
                )}
              </div>
            ))}
          </div>
        </ResumeAsideCard>
      )}
    </div>
  );

  const renderSheetBody = () => {
    if (resolvedResumeModel.asideLayout === "hidden") {
      return <div className="mt-8">{mainSections}</div>;
    }

    if (resolvedResumeModel.asideLayout === "top") {
      return (
        <>
          <div className="mt-8">{asidePanels}</div>
          <div className="mt-8">{mainSections}</div>
        </>
      );
    }

    if (resolvedResumeModel.asideLayout === "left") {
      return (
        <div className="mt-8 grid gap-8 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside>{asidePanels}</aside>
          <div>{mainSections}</div>
        </div>
      );
    }

    return (
      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div>{mainSections}</div>
        <aside>{asidePanels}</aside>
      </div>
    );
  };

  return (
    <div className="portfolio-body min-h-screen" style={pageStyle}>
      {resolvedTheme.isDark && (
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div
            className="absolute left-[8%] top-[8%] h-[24rem] w-[24rem] rounded-full blur-[120px]"
            style={{ background: `${resolvedTheme.glowPrimary}16` }}
          />
          <div
            className="absolute bottom-[10%] right-[10%] h-[20rem] w-[20rem] rounded-full blur-[120px]"
            style={{ background: `${resolvedTheme.glowSecondary}16` }}
          />
        </div>
      )}

      <PublicPageNav
        activeSection="resume"
        basePath={basePath}
        theme={resolvedTheme}
        mode={mode}
      />

      <div className="relative z-10">
        <div className="lp-shell py-14 md:py-20">
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)] lg:items-start">
            <div className="rounded-[2rem] border p-7 md:p-8" style={panelStyle}>
              <p className="lp-kicker text-[11px]" style={{ color: resolvedResumeModel.accent }}>
                Resume view
              </p>
              <h1 className="brand-display mt-4 text-[3.2rem] leading-[0.94] tracking-[-0.05em] md:text-[4.4rem]">
                {resume.name}
              </h1>
              <p className="mt-4 text-xl leading-8" style={{ color: resolvedResumeModel.accent }}>
                {resume.headline}
              </p>
              <p className="mt-6 max-w-2xl text-lg leading-8" style={mutedStyle}>
                Separate from the portfolio page, this resume-first view is tuned for {reviewLabel} using the {resolvedResumeModel.label} layout system.
              </p>
              {metaParts.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {metaParts.map((part) => (
                    <span
                      key={part}
                      className="rounded-full border px-3 py-1 text-xs"
                      style={chipStyle}
                    >
                      {part}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <aside className="grid gap-4">
              <div className="rounded-[2rem] border p-5" style={panelStyle}>
                <p className="lp-kicker text-[11px]" style={{ color: resolvedResumeModel.accent }}>
                  Actions
                </p>
                <div className="mt-4 space-y-3">
                  <a
                    href={`/api/resume?username=${encodeURIComponent(username)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold"
                    style={primaryButtonStyle}
                  >
                    <Download className="h-4 w-4" />
                    Download PDF
                  </a>
                  <Link
                    href={buildPublicPageModeHref(basePath, mode)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm"
                    style={outlineButtonStyle}
                  >
                    View portfolio
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="rounded-[2rem] border p-5" style={panelStyle}>
                <p className="lp-kicker text-[11px]" style={{ color: resolvedResumeModel.accent }}>
                  Resume model
                </p>
                <div className="mt-4 rounded-[1.5rem] border p-5" style={sideTileStyle}>
                  <p className="text-sm font-medium">{resolvedResumeModel.label}</p>
                  <p className="mt-2 text-xs leading-relaxed" style={mutedStyle}>
                    {resolvedResumeModel.description}
                  </p>
                  <p className="mt-3 text-xs" style={mutedStyle}>
                    {resolvedResumeModel.headerLayout} header · {resolvedResumeModel.asideLayout} aside · {resolvedResumeModel.sectionStyle} sections
                  </p>
                  <p className="mt-1 text-xs" style={mutedStyle}>
                    {resolvedResumeModel.displayFont}/{resolvedResumeModel.bodyFont}
                  </p>
                </div>
              </div>
            </aside>
          </section>

          <section className="mt-8 rounded-[2rem] border p-7 md:p-10" style={sheetStyle}>
            <ResumeDocumentHeader
              accent={resolvedResumeModel.accent}
              headline={resume.headline}
              meta={metaBlock}
              model={resolvedResumeModel}
              muted={documentMuted}
              name={resume.name}
            />
            {renderSheetBody()}
          </section>
        </div>
      </div>
    </div>
  );
}
