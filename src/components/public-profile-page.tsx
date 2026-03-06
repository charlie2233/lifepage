import { notFound } from "next/navigation";
import Link from "next/link";
import type { ProfileJSON } from "@/lib/schema";
import type { EvidenceItem as PrismaEvidenceItem, UserProfile } from "@/generated/prisma";
import type { PublicPageUser } from "@/lib/public-page";
import { buildPublicPageModeHref, resolvePublicPageMode } from "@/lib/public-page";
import { normalizeVisibility } from "@/lib/page-visibility";
import {
  BriefcaseBusiness,
  ExternalLink,
  FileText,
  Github,
  GraduationCap,
  Linkedin,
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
  const theme = settings?.theme ?? user.profile?.theme ?? "obsidian";
  const mode = resolvePublicPageMode(queryMode, settings?.mode);
  const isObsidian = theme === "obsidian";

  const bg = isObsidian ? "bg-[#0d0d0d]" : "bg-[#faf9f7]";
  const text = isObsidian ? "text-white" : "text-[#1a1a1a]";
  const muted = isObsidian ? "text-gray-400" : "text-gray-500";
  const accent = isObsidian ? "text-[#00f5ff]" : "text-blue-600";
  const accentBg = isObsidian ? "bg-[#00f5ff]" : "bg-blue-600";
  const card = isObsidian
    ? "bg-white/5 border border-white/10"
    : "bg-white border border-gray-200 shadow-sm";
  const border = isObsidian ? "border-white/10" : "border-gray-200";

  if (!profileData) {
    return (
      <div className={`min-h-screen ${bg} ${text} flex items-center justify-center`}>
        <div className="text-center">
          <div
            className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border ${
              isObsidian ? "border-white/10 bg-white/5" : "border-gray-200 bg-white"
            }`}
          >
            <Sparkles className={`h-7 w-7 ${accent}`} />
          </div>
          <h1 className="text-2xl font-bold mb-2">Profile coming soon</h1>
          <p className={muted}>@{username} is building their LifePage</p>
        </div>
      </div>
    );
  }

  const userProfile: UserProfile | null = user.profile;
  const evidenceItems: PrismaEvidenceItem[] = user.evidenceItems;

  return (
    <div className={`min-h-screen ${bg} ${text}`}>
      <nav className={`border-b ${border} px-6 py-4 flex items-center justify-between`}>
        <Link href="/" className="text-lg font-bold">
          Life<span className={accent}>Page</span>
        </Link>
        <div className="flex items-center gap-3">
          <a
            href={buildPublicPageModeHref(basePath, "hiring")}
            className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${
              mode === "hiring"
                ? `${accentBg} text-white border-transparent`
                : `border-gray-300 ${muted}`
            }`}
          >
            <BriefcaseBusiness className="h-3.5 w-3.5" />
            Hiring
          </a>
          <a
            href={buildPublicPageModeHref(basePath, "admissions")}
            className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${
              mode === "admissions"
                ? "bg-purple-600 text-white border-transparent"
                : `border-gray-300 ${muted}`
            }`}
          >
            <GraduationCap className="h-3.5 w-3.5" />
            Admissions
          </a>
          <a
            href={`/api/resume?username=${encodeURIComponent(username)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${border} ${muted}`}
          >
            <FileText className="h-3.5 w-3.5" />
            Resume
          </a>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <section className="text-center mb-20">
          <h1 className={`text-5xl md:text-6xl font-bold mb-4 ${isObsidian ? "" : "font-serif"}`}>
            {user.name ?? username}
          </h1>
          <p className={`text-xl md:text-2xl ${accent} font-medium mb-6`}>
            {profileData.headline}
          </p>
          <p className={`text-lg ${muted} max-w-2xl mx-auto leading-relaxed mb-10`}>
            {profileData.about}
          </p>

          <div className="flex justify-center gap-8 mb-10">
            {[
              {
                label: "Projects Shipped",
                value: profileData.stats?.projectsShipped ?? 0,
              },
              {
                label: "Years Building",
                value: profileData.stats?.yearsBuilding ?? 0,
              },
              {
                label: "Competitions",
                value: profileData.stats?.competitions ?? 0,
              },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className={`text-4xl font-bold ${accent}`}>{stat.value}</div>
                <div className={`text-sm ${muted} mt-1`}>{stat.label}</div>
              </div>
            ))}
          </div>

          {userProfile && (
            <div className="flex justify-center flex-wrap gap-3">
              {userProfile.github && (
                <a
                  href={userProfile.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 border ${border} px-4 py-2 rounded-full text-sm ${muted} transition-colors`}
                >
                  <Github className="h-4 w-4" />
                  GitHub
                </a>
              )}
              {userProfile.linkedin && (
                <a
                  href={userProfile.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 border ${border} px-4 py-2 rounded-full text-sm ${muted} transition-colors`}
                >
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                </a>
              )}
              {userProfile.youtube && (
                <a
                  href={userProfile.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 border ${border} px-4 py-2 rounded-full text-sm ${muted} transition-colors`}
                >
                  <Youtube className="h-4 w-4" />
                  YouTube
                </a>
              )}
            </div>
          )}
        </section>

        {profileData.skills?.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Skills</h2>
            <div className="flex flex-wrap gap-3">
              {profileData.skills.map((skill) => (
                <span key={skill.tag} className={`${card} rounded-full px-4 py-2 text-sm`}>
                  {skill.tag}
                  <span className={`${muted} ml-2 text-xs capitalize`}>
                    {skill.level}
                  </span>
                </span>
              ))}
            </div>
          </section>
        )}

        {profileData.projects?.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">
              {mode === "hiring" ? "Case Studies" : "Projects & Work"}
            </h2>
            <div className="space-y-6">
              {profileData.projects.map((project) => {
                const evidence = evidenceItems.find((item) => {
                  if (!item.url) return false;
                  try {
                    const evidenceHost = new URL(item.url).hostname;
                    return project.links?.some((link) => link.url.includes(evidenceHost));
                  } catch {
                    return false;
                  }
                });

                return (
                  <div key={project.title} className={`${card} rounded-2xl overflow-hidden`}>
                    {evidence?.screenshot && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={evidence.screenshot}
                        alt={project.title}
                        className="w-full h-48 object-cover object-top"
                      />
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-semibold mb-3">{project.title}</h3>
                      {mode === "hiring" ? (
                        <div className="space-y-3">
                          {project.problem && (
                            <div>
                              <span className={`text-xs font-mono ${accent} uppercase`}>
                                Problem
                              </span>
                              <p className={`${muted} text-sm mt-1`}>{project.problem}</p>
                            </div>
                          )}
                          {project.approach && (
                            <div>
                              <span className={`text-xs font-mono ${accent} uppercase`}>
                                Approach
                              </span>
                              <p className={`${muted} text-sm mt-1`}>{project.approach}</p>
                            </div>
                          )}
                          {project.impact && (
                            <div>
                              <span className="text-xs font-mono text-green-400 uppercase">
                                Impact
                              </span>
                              <p className="text-green-400 text-sm mt-1">{project.impact}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className={`${muted} text-sm`}>
                          {project.approach ?? project.problem}
                        </p>
                      )}
                      {project.tech?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {project.tech.map((tech) => (
                            <span key={tech} className={`text-xs ${card} px-2 py-1 rounded`}>
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                      {project.links?.length > 0 && (
                        <div className="flex gap-3 mt-4">
                          {project.links.map((link) => (
                            <a
                              key={link.url}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`text-xs ${accent} hover:underline`}
                            >
                              <span className="inline-flex items-center gap-1">
                                {link.label}
                                <ExternalLink className="h-3 w-3" />
                              </span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {profileData.timeline?.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Journey</h2>
            <div className="relative">
              <div
                className={`absolute left-4 top-0 bottom-0 w-px ${
                  isObsidian ? "bg-white/10" : "bg-gray-200"
                }`}
              />
              <div className="space-y-8">
                {profileData.timeline.map((entry) => (
                  <div key={entry.year} className="flex gap-6 pl-12 relative">
                    <div
                      className={`absolute left-2 top-1 w-5 h-5 rounded-full border-2 ${
                        isObsidian
                          ? "border-[#00f5ff] bg-[#0d0d0d]"
                          : "border-blue-600 bg-white"
                      }`}
                    />
                    <div>
                      <div className={`font-mono text-sm ${accent} mb-2`}>
                        {entry.year}
                      </div>
                      <ul className="space-y-1">
                        {entry.milestones.map((milestone, index) => (
                          <li key={index} className={`text-sm ${muted}`}>
                            • {milestone}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {profileData.achievements?.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Achievements</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {profileData.achievements.map((achievement) => (
                <div key={achievement.title} className={`${card} rounded-xl p-5`}>
                  <div
                    className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${
                      isObsidian
                        ? "bg-white/5 border border-white/10"
                        : "bg-amber-50 border border-amber-100"
                    }`}
                  >
                    <Trophy
                      className={`h-[18px] w-[18px] ${
                        isObsidian ? "text-[#00f5ff]" : "text-amber-500"
                      }`}
                    />
                  </div>
                  <h4 className="font-semibold">{achievement.title}</h4>
                  {achievement.context && (
                    <p className={`text-sm ${muted} mt-1`}>{achievement.context}</p>
                  )}
                  {achievement.date && (
                    <p className={`text-xs ${muted} mt-2`}>{achievement.date}</p>
                  )}
                  {achievement.proof && (
                    <a
                      href={achievement.proof}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-xs ${accent} hover:underline mt-2 block`}
                    >
                      <span className="inline-flex items-center gap-1">
                        View proof
                        <ExternalLink className="h-3 w-3" />
                      </span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {evidenceItems.filter((item) => item.screenshot).length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Proof Gallery</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {evidenceItems
                .filter((item) => item.screenshot)
                .map((item) => (
                  <a
                    key={item.id}
                    href={item.url ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${card} rounded-xl overflow-hidden group hover:scale-[1.02] transition-transform`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.screenshot!}
                      alt={item.title ?? "project screenshot"}
                      className="w-full h-32 object-cover object-top"
                    />
                    <div className="p-3">
                      <p className="text-xs font-medium truncate">{item.title}</p>
                    </div>
                  </a>
                ))}
            </div>
          </section>
        )}
      </div>

      <footer className={`border-t ${border} py-8 px-6 text-center text-xs ${muted}`}>
        <p>
          Built with LifePage personal brand builder · Powered by AI ·{" "}
          <a
            href="https://atrak.dev"
            target="_blank"
            rel="noopener noreferrer"
            className={`${accent} hover:underline`}
          >
            atrak.dev
          </a>
        </p>
      </footer>
    </div>
  );
}
