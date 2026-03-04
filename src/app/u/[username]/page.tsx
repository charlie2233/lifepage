import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ProfileJSON } from "@/lib/schema";
import type { EvidenceItem as PrismaEvidenceItem, UserProfile } from "@/generated/prisma";
import Link from "next/link";

interface Props {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ mode?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      generatedProfiles: {
        where: { isActive: true },
        take: 1,
      },
    },
  });
  if (!user) return { title: "Not found" };
  const profile = user.generatedProfiles[0]?.data as unknown as
    | ProfileJSON
    | undefined;
  return {
    title: `${user.name ?? username} — LifePage`,
    description: profile?.headline ?? `Portfolio of ${username}`,
  };
}

export default async function PublicProfilePage({
  params,
  searchParams,
}: Props) {
  const { username } = await params;
  const { mode: queryMode } = await searchParams;

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      generatedProfiles: {
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      publicPageSettings: true,
      evidenceItems: {
        where: { visible: true },
        orderBy: { createdAt: "desc" },
      },
      profile: true,
    },
  });

  if (!user) notFound();

  const settings = user.publicPageSettings;
  if (settings && !settings.isPublic) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold">This page is private</h1>
        </div>
      </div>
    );
  }

  const profileData = user.generatedProfiles[0]?.data as unknown as
    | ProfileJSON
    | undefined;
  const theme = settings?.theme ?? user.profile?.theme ?? "obsidian";
  const mode = ((queryMode ?? settings?.mode ?? "hiring") as string) as
    | "hiring"
    | "admissions";
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
          <div className="text-6xl mb-4">🚧</div>
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
      {/* Nav */}
      <nav className={`border-b ${border} px-6 py-4 flex items-center justify-between`}>
        <Link href="/" className="text-lg font-bold">
          Life<span className={accent}>Page</span>
        </Link>
        <div className="flex items-center gap-3">
          <a
            href={`/u/${username}?mode=hiring`}
            className={`text-xs px-3 py-1.5 rounded-full border ${
              mode === "hiring"
                ? `${accentBg} text-white border-transparent`
                : `border-gray-300 ${muted}`
            }`}
          >
            💼 Hiring
          </a>
          <a
            href={`/u/${username}?mode=admissions`}
            className={`text-xs px-3 py-1.5 rounded-full border ${
              mode === "admissions"
                ? "bg-purple-600 text-white border-transparent"
                : `border-gray-300 ${muted}`
            }`}
          >
            🎓 Admissions
          </a>
          <a
            href="/api/resume"
            className={`text-xs px-3 py-1.5 rounded-full border ${border} ${muted}`}
          >
            📄 Resume
          </a>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* HERO */}
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

          {/* Proof stats */}
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
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className={`text-4xl font-bold ${accent}`}>{s.value}</div>
                <div className={`text-sm ${muted} mt-1`}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Links */}
          {userProfile && (
            <div className="flex justify-center flex-wrap gap-3">
              {userProfile.github && (
                <a
                  href={userProfile.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 border ${border} px-4 py-2 rounded-full text-sm ${muted} transition-colors`}
                >
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
                  YouTube
                </a>
              )}
            </div>
          )}
        </section>

        {/* SKILLS */}
        {profileData.skills?.length > 0 && (
          <section className="mb-16">
            <h2 className={`text-2xl font-bold mb-6`}>Skills</h2>
            <div className="flex flex-wrap gap-3">
              {profileData.skills.map((s) => (
                <span key={s.tag} className={`${card} rounded-full px-4 py-2 text-sm`}>
                  {s.tag}
                  <span className={`${muted} ml-2 text-xs capitalize`}>
                    {s.level}
                  </span>
                </span>
              ))}
            </div>
          </section>
        )}

        {/* PROJECTS */}
        {profileData.projects?.length > 0 && (
          <section className="mb-16">
            <h2 className={`text-2xl font-bold mb-6`}>
              {mode === "hiring" ? "Case Studies" : "Projects & Work"}
            </h2>
            <div className="space-y-6">
              {profileData.projects.map((p) => {
                const ev = evidenceItems.find((e) => {
                  if (!e.url) return false;
                  try {
                    const evHost = new URL(e.url).hostname;
                    return p.links?.some((l) => l.url.includes(evHost));
                  } catch {
                    return false;
                  }
                });
                return (
                  <div key={p.title} className={`${card} rounded-2xl overflow-hidden`}>
                    {ev?.screenshot && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={ev.screenshot}
                        alt={p.title}
                        className="w-full h-48 object-cover object-top"
                      />
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-semibold mb-3">{p.title}</h3>
                      {mode === "hiring" ? (
                        <div className="space-y-3">
                          {p.problem && (
                            <div>
                              <span className={`text-xs font-mono ${accent} uppercase`}>
                                Problem
                              </span>
                              <p className={`${muted} text-sm mt-1`}>{p.problem}</p>
                            </div>
                          )}
                          {p.approach && (
                            <div>
                              <span className={`text-xs font-mono ${accent} uppercase`}>
                                Approach
                              </span>
                              <p className={`${muted} text-sm mt-1`}>{p.approach}</p>
                            </div>
                          )}
                          {p.impact && (
                            <div>
                              <span className="text-xs font-mono text-green-400 uppercase">
                                Impact
                              </span>
                              <p className="text-green-400 text-sm mt-1">{p.impact}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className={`${muted} text-sm`}>
                          {p.approach ?? p.problem}
                        </p>
                      )}
                      {p.tech?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {p.tech.map((t) => (
                            <span key={t} className={`text-xs ${card} px-2 py-1 rounded`}>
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                      {p.links?.length > 0 && (
                        <div className="flex gap-3 mt-4">
                          {p.links.map((l) => (
                            <a
                              key={l.url}
                              href={l.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`text-xs ${accent} hover:underline`}
                            >
                              {l.label} ↗
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

        {/* TIMELINE */}
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
                        {entry.milestones.map((m, i) => (
                          <li key={i} className={`text-sm ${muted}`}>
                            • {m}
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

        {/* ACHIEVEMENTS */}
        {profileData.achievements?.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Achievements</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {profileData.achievements.map((a) => (
                <div key={a.title} className={`${card} rounded-xl p-5`}>
                  <div className="text-2xl mb-2">🏆</div>
                  <h4 className="font-semibold">{a.title}</h4>
                  {a.context && (
                    <p className={`text-sm ${muted} mt-1`}>{a.context}</p>
                  )}
                  {a.date && (
                    <p className={`text-xs ${muted} mt-2`}>{a.date}</p>
                  )}
                  {a.proof && (
                    <a
                      href={a.proof}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-xs ${accent} hover:underline mt-2 block`}
                    >
                      View proof ↗
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* EVIDENCE GALLERY */}
        {evidenceItems.filter((e) => e.screenshot).length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Proof Gallery</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {evidenceItems
                .filter((e) => e.screenshot)
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

      {/* Footer */}
      <footer className={`border-t ${border} py-8 px-6 text-center text-xs ${muted}`}>
        <p>
          Built with LifePage · Powered by AI ·{" "}
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
