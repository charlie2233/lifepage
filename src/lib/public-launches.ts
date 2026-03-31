import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { getDemoExploreProfiles } from "@/lib/demo-public-pages";

interface ProfileData {
  headline?: string;
  skills?: Array<{ tag: string }>;
  stats?: {
    projectsShipped?: number;
    yearsBuilding?: number;
    competitions?: number;
  };
}

export interface ExploreProfileCardData {
  username: string;
  name: string;
  avatar: string | null;
  headline: string | null;
  skills: string[];
  stats: ProfileData["stats"];
  theme: string;
  screenshot: string | null;
  joinedAt: Date;
}

const getCachedPublicLaunches = unstable_cache(
  async (): Promise<ExploreProfileCardData[]> => {
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
            select: { screenshot: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 48,
      });

      return users
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
      return [];
    }
  },
  ["public-launches"],
  { revalidate: 300 }
);

export async function getPublicLaunches() {
  const profiles = await getCachedPublicLaunches();
  return profiles.length > 0 ? profiles : getDemoExploreProfiles();
}
