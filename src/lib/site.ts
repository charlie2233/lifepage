import { getAppBaseUrl } from "@/lib/runtime-env";

export const SITE_NAME = "Atrak Pages";
export const SITE_AUTHOR = "atrak.dev";
export const SITE_AUTHOR_URL = "https://atrak.dev";
export const SITE_TAGLINE = "AI Personal Brand Builder";
export const SITE_DESCRIPTION =
  "Turn real proof of your work into a portfolio, resume, and shareable public page with AI-guided storytelling.";

export function getSiteUrl() {
  return getAppBaseUrl() ?? "http://localhost:3000";
}

export function absoluteUrl(path = "/") {
  return new URL(path, getSiteUrl()).toString();
}
