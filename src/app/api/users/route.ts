import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  // Return all users whose public page settings allow public visibility
  const users = await prisma.user.findMany({
    where: {
      publicPageSettings: { isPublic: true },
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
        select: { theme: true, mode: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const profiles = users
    .filter((u) => u.username)
    .map((u) => {
      const data = u.generatedProfiles[0]?.data as Record<string, unknown> | null;
      return {
        username: u.username,
        name: u.name,
        avatar: u.avatar,
        headline: (data?.headline as string) ?? null,
        skills: ((data?.skills as Array<{ tag: string }>) ?? [])
          .slice(0, 4)
          .map((s) => s.tag),
        stats: (data?.stats as { projectsShipped?: number; yearsBuilding?: number }) ?? {},
        theme: u.publicPageSettings?.theme ?? "obsidian",
        mode: u.publicPageSettings?.mode ?? "hiring",
        joinedAt: u.createdAt,
      };
    });

  return NextResponse.json({ profiles });
}
