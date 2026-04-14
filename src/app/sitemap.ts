import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { absoluteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const routes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/explore"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/upgrade"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  try {
    const users = await prisma.user.findMany({
      where: {
        username: { not: null },
        publicPageSettings: {
          is: {
            visibility: "public",
          },
        },
      },
      select: {
        username: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 250,
    });

    return routes.concat(
      users.flatMap((user) => {
        if (!user.username) {
          return [];
        }

        return [
          {
            url: absoluteUrl(`/u/${user.username}`),
            lastModified: user.updatedAt,
            changeFrequency: "weekly" as const,
            priority: 0.7,
          },
          {
            url: absoluteUrl(`/u/${user.username}/resume`),
            lastModified: user.updatedAt,
            changeFrequency: "weekly" as const,
            priority: 0.5,
          },
        ];
      })
    );
  } catch (error) {
    console.warn("Sitemap generation fallback:", error);
    return routes;
  }
}
