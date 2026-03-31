import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { getSiteUrl } from "@/lib/site-metadata";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  if (!siteUrl) {
    return [];
  }

  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    {
      url: new URL("/", siteUrl).toString(),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: new URL("/explore", siteUrl).toString(),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  try {
    const users = await prisma.user.findMany({
      where: {
        username: { not: null },
        publicPageSettings: { is: { isPublic: true } },
      },
      select: {
        username: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 200,
    });

    for (const user of users) {
      if (!user.username) continue;

      entries.push({
        url: new URL(`/u/${user.username}`, siteUrl).toString(),
        lastModified: user.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      });
      entries.push({
        url: new URL(`/u/${user.username}/resume`, siteUrl).toString(),
        lastModified: user.updatedAt,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  } catch (error) {
    console.warn("Falling back to static sitemap entries:", error);
  }

  return entries;
}
