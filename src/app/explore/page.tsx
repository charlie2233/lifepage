import { prisma } from "@/lib/db";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, ArrowUpRight, Compass, Globe, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Explore Personal Brands — LifePage",
  description: "Browse public personal brand sites built and deployed with LifePage.",
};

// Always dynamically rendered — needs DB access
export const dynamic = "force-dynamic";

interface ProfileData {
  headline?: string;
  skills?: Array<{ tag: string }>;
  stats?: { projectsShipped?: number; yearsBuilding?: number; competitions?: number };
}

export default async function ExplorePage() {
  const users = await prisma.user.findMany({
    where: {
      publicPageSettings: { is: { visibility: "public" } },
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

  const profiles = users
    .filter((u) => u.username)
    .map((u) => {
      const data = (u.generatedProfiles[0]?.data ?? {}) as ProfileData;
      return {
        username: u.username!,
        name: u.name ?? u.username!,
        avatar: u.avatar,
        headline: data.headline ?? null,
        skills: (data.skills ?? []).slice(0, 4).map((s) => s.tag),
        stats: data.stats ?? {},
        theme: u.publicPageSettings?.theme ?? "obsidian",
        screenshot: u.evidenceItems[0]?.screenshot ?? null,
        joinedAt: u.createdAt,
      };
    });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Background glow */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] rounded-full bg-[#00f5ff]/6 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-[#7c3aed]/6 blur-[100px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-10 py-5 border-b border-white/8 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#00f5ff] flex items-center justify-center">
            <span className="text-black font-black text-xs">LP</span>
          </div>
          <span className="text-xl font-bold tracking-tight">
            Life<span className="text-[#00f5ff]">Page</span>
          </span>
        </Link>
        <div className="flex items-center gap-2 md:gap-3">
          <span className="hidden sm:inline-flex text-sm text-[#00f5ff] border-b border-[#00f5ff]/40 pb-0.5">Explore</span>
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

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-xs font-mono text-gray-500 uppercase tracking-widest mb-3">
            <Compass className="h-3.5 w-3.5 text-[#00f5ff]" />
            Public brand pages
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3">
            Explore <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f5ff] to-[#7c3aed]">Personal Brands</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl">
            Discover creators, engineers, and designers who turned their work into live personal brand sites with LifePage.
          </p>
        </div>

        {/* Profiles grid */}
        {profiles.length === 0 ? (
          <div className="text-center py-24">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#00f5ff]/20 bg-[#00f5ff]/8">
              <Sparkles className="h-7 w-7 text-[#00f5ff]" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No public brand pages yet</h2>
            <p className="text-gray-400 mb-8">Be the first to launch yours.</p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-[#00f5ff] text-black px-6 py-3 rounded-xl font-bold hover:bg-[#00e5ef] transition-colors"
            >
              Build my brand
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {profiles.map((p) => {
              const isObsidian = p.theme === "obsidian";
              return (
                <Link
                  key={p.username}
                  href={`/u/${p.username}`}
                  className="group relative flex flex-col rounded-2xl border border-white/10 overflow-hidden hover:border-[#00f5ff]/30 hover:-translate-y-1 transition-all duration-200 bg-white/3 hover:bg-white/5"
                >
                  {/* Screenshot banner */}
                  {p.screenshot ? (
                    <div className="w-full h-36 overflow-hidden flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.screenshot}
                        alt={`${p.name}'s portfolio`}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div
                      className={`w-full h-36 flex-shrink-0 flex items-center justify-center text-4xl ${
                        isObsidian
                          ? "bg-gradient-to-br from-[#00f5ff]/10 to-[#7c3aed]/10"
                          : "bg-gradient-to-br from-blue-500/10 to-purple-500/10"
                      }`}
                    >
                      {p.name[0]}
                    </div>
                  )}

                  {/* Card body */}
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-sm">{p.name}</p>
                        <p className="text-xs text-gray-500">@{p.username}</p>
                      </div>
                      {/* Public badge */}
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-green-500/30 text-green-400 bg-green-500/10 flex-shrink-0 ml-2">
                        <Globe className="h-3 w-3" />
                        Public
                      </span>
                    </div>

                    {p.headline && (
                      <p className="text-xs text-gray-400 mb-3 line-clamp-2 leading-relaxed">{p.headline}</p>
                    )}

                    {p.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {p.skills.map((s) => (
                          <span key={s} className="text-xs bg-white/6 border border-white/10 rounded-md px-2 py-0.5 text-gray-300">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-auto">
                      {p.stats.projectsShipped != null && (
                        <span><b className="text-white">{p.stats.projectsShipped}</b> projects</span>
                      )}
                      {p.stats.yearsBuilding != null && (
                        <span><b className="text-white">{p.stats.yearsBuilding}</b> yrs</span>
                      )}
                      <span className="ml-auto inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 text-[#00f5ff] transition-opacity">
                        View
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* CTA at bottom */}
        <div className="mt-16 text-center border-t border-white/8 pt-12">
          <p className="text-gray-400 mb-4">Want your brand here?</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-[#00f5ff] text-black px-6 py-3 rounded-xl font-bold hover:bg-[#00e5ef] transition-all shadow-xl shadow-[#00f5ff]/20"
          >
            Build your brand
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <footer className="relative z-10 border-t border-white/8 py-6 px-6 text-center text-xs text-gray-600 mt-4">
        Built by{" "}
        <a href="https://atrak.dev" target="_blank" rel="noopener noreferrer" className="text-[#00f5ff]/70 hover:text-[#00f5ff]">
          atrak.dev
        </a>{" "}
        · LifePage
      </footer>
    </div>
  );
}
