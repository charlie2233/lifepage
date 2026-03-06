import Link from "next/link";
import { BriefcaseBusiness, FileText, GraduationCap } from "lucide-react";
import { buildPublicPageModeHref } from "@/lib/public-page";
import { buildPublicResumeHref } from "@/lib/public-resume";
import type { ResolvedPortfolioTheme } from "@/lib/portfolio-themes";

interface PublicPageNavProps {
  activeSection: "profile" | "resume";
  basePath: string;
  theme: ResolvedPortfolioTheme;
  mode: "hiring" | "admissions";
}

export function PublicPageNav({
  activeSection,
  basePath,
  theme,
  mode,
}: PublicPageNavProps) {
  const navStyle = {
    borderBottomColor: theme.navBorder,
    background: theme.navBackground,
  };
  const mutedStyle = { color: theme.muted };
  const modeButtonStyle = {
    borderColor: theme.outlineBorder,
    background: theme.outlineBackground,
    color: theme.outlineText,
  };
  const hiringActiveStyle = {
    borderColor: "transparent",
    background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentSoft})`,
    color: theme.isDark ? "#041117" : "#261408",
  };
  const admissionsActiveStyle = {
    borderColor: "transparent",
    background: `linear-gradient(135deg, ${theme.accentWarm}, ${theme.accentSoft})`,
    color: "#2a1203",
  };
  const resumeActiveStyle = {
    borderColor: "transparent",
    background: `linear-gradient(135deg, ${theme.accentSecondary}, ${theme.accentSoft})`,
    color: theme.isDark ? "#102038" : "#1d2340",
  };

  return (
    <nav
      className="relative z-10 border-b backdrop-blur-2xl"
      style={navStyle}
    >
      <div className="lp-shell flex items-center justify-between py-5">
        <Link href="/" className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-2xl text-[11px] font-black tracking-[0.24em] shadow-lg transition-transform hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentSoft})`,
              color: theme.isDark ? "#041117" : "#24140a",
              boxShadow: `0 8px 24px ${theme.accent}35`,
            }}
          >
            LP
          </div>
          <div>
            <p className="brand-display text-[1.35rem] leading-none tracking-tight">
              LifePage
            </p>
            <p className="lp-kicker mt-1 text-[10px]" style={mutedStyle}>
              {activeSection === "resume" ? "Public resume" : "Public profile"}
            </p>
          </div>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={buildPublicPageModeHref(basePath, "hiring")}
            className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-transform hover:scale-[1.03]"
            style={
              activeSection === "profile" && mode === "hiring"
                ? hiringActiveStyle
                : modeButtonStyle
            }
          >
            <BriefcaseBusiness className="h-4 w-4" />
            Hiring
          </Link>
          <Link
            href={buildPublicPageModeHref(basePath, "admissions")}
            className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-transform hover:scale-[1.03]"
            style={
              activeSection === "profile" && mode === "admissions"
                ? admissionsActiveStyle
                : modeButtonStyle
            }
          >
            <GraduationCap className="h-4 w-4" />
            Admissions
          </Link>
          <Link
            href={buildPublicResumeHref(basePath, mode)}
            className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-transform hover:scale-[1.03]"
            style={activeSection === "resume" ? resumeActiveStyle : modeButtonStyle}
          >
            <FileText className="h-4 w-4" />
            Resume
          </Link>
        </div>
      </div>
    </nav>
  );
}
