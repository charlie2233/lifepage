import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { normalizeCustomDomain } from "@/lib/custom-domain";
import { isCustomDomainActive } from "@/lib/custom-domain-lifecycle";
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

export const getPublicPageUserByUsername = unstable_cache(
  async (username: string) => {
    try {
      const user = await prisma.user.findFirst({
        where: { username },
        include: publicPageInclude,
      });

      return user && canAccessPortfolio(user.publicPageSettings) ? user : null;
    } catch (error) {
      console.warn("Falling back from public page username lookup:", error);
      return null;
    }
  },
  ["public-page-by-username"],
  { revalidate: 300 }
);

export const getPublicPageUserByCustomDomain = unstable_cache(
  async (hostname: string) => {
    let normalizedHostname: string;
    try {
      normalizedHostname = normalizeCustomDomain(hostname);
    } catch {
      return null;
    }

    try {
      const user = await prisma.user.findFirst({
        where: {
          publicPageSettings: {
            is: {
              customDomainNormalized: normalizedHostname,
              customDomainStatus: "active",
            },
          },
        },
        include: publicPageInclude,
      });

      return user && canAccessCustomDomainPortfolio(user.publicPageSettings)
        ? user
        : null;
    } catch (error) {
      console.warn("Falling back from public page custom-domain lookup:", error);
      return null;
    }
  },
  ["public-page-by-custom-domain"],
  { revalidate: 300 }
);

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

export function canAccessCustomDomainPortfolio(
  settings?: {
    isPublic?: boolean | null;
    visibility?: string | null;
    customDomainNormalized?: string | null;
    customDomainStatus?: string | null;
  } | null
) {
  return canAccessPortfolio(settings) && isCustomDomainActive(settings);
}
