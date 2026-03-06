import { cache } from "react";
import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { normalizeCustomDomain } from "@/lib/custom-domain";
import { isVisibilityAccessible, normalizeVisibility } from "@/lib/page-visibility";

export const publicPageInclude = {
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
} satisfies Prisma.UserInclude;

export type PublicPageUser = Prisma.UserGetPayload<{
  include: typeof publicPageInclude;
}>;

export const getPublicPageUserByUsername = cache(async (username: string) => {
  return prisma.user.findFirst({
    where: {
      username,
      publicPageSettings: {
        is: {
          visibility: {
            not: "private",
          },
        },
      },
    },
    include: publicPageInclude,
  });
});

export const getPublicPageUserByCustomDomain = cache(async (hostname: string) => {
  let normalizedHostname: string;
  try {
    normalizedHostname = normalizeCustomDomain(hostname);
  } catch {
    return null;
  }

  return prisma.user.findFirst({
    where: {
      publicPageSettings: {
        is: {
          customDomainNormalized: normalizedHostname,
          visibility: {
            not: "private",
          },
        },
      },
    },
    include: publicPageInclude,
  });
});

export function resolvePublicPageMode(
  queryMode: string | undefined,
  savedMode: string | undefined
): "hiring" | "admissions" {
  if (queryMode === "hiring" || queryMode === "admissions") {
    return queryMode;
  }

  return savedMode === "admissions" ? "admissions" : "hiring";
}

export function buildPublicPageModeHref(
  basePath: string,
  mode: "hiring" | "admissions"
) {
  const pathname = basePath === "/" ? "" : basePath;
  return `${pathname || "/"}?mode=${mode}`;
}

export function canAccessPortfolio(settings?: {
  isPublic?: boolean | null;
  visibility?: string | null;
} | null) {
  return isVisibilityAccessible(normalizeVisibility(settings));
}
