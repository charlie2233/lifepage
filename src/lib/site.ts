export const SITE_NAME = "LifePage";
export const SITE_AUTHOR = "atrak.dev";
export const SITE_AUTHOR_URL = "https://atrak.dev";
export const SITE_TAGLINE = "AI Personal Brand Builder";
export const SITE_DESCRIPTION =
  "Turn real proof of your work into a portfolio, resume, and shareable public page with AI-guided storytelling.";

function normalizeBaseUrl(candidate?: string | null) {
  if (!candidate) {
    return "http://localhost:3000";
  }

  try {
    return new URL(candidate).origin;
  } catch {
    return "http://localhost:3000";
  }
}

export function getSiteUrl() {
  return normalizeBaseUrl(
    process.env.AUTH_URL ??
      process.env.NEXTAUTH_URL ??
      process.env.NEXT_PUBLIC_SITE_URL
  );
}

export function absoluteUrl(path = "/") {
  return new URL(path, getSiteUrl()).toString();
}
