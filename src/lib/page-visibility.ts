export type PublicPageVisibility = "public" | "unlisted" | "private";

export function normalizeVisibility(settings?: {
  isPublic?: boolean | null;
  visibility?: string | null;
} | null): PublicPageVisibility {
  if (settings?.visibility === "public" || settings?.visibility === "unlisted" || settings?.visibility === "private") {
    return settings.visibility;
  }

  return settings?.isPublic ? "public" : "private";
}

export function isVisibilityAccessible(visibility: PublicPageVisibility) {
  return visibility !== "private";
}

export function isVisibilityDiscoverable(visibility: PublicPageVisibility) {
  return visibility === "public";
}
