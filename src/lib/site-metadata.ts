import { getAppBaseUrl } from "@/lib/runtime-env";

function normalizeBaseUrl(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function getSiteUrl(hostname?: string | null) {
  if (hostname) {
    return new URL(`https://${hostname}`);
  }

  const appUrl = getAppBaseUrl();
  if (!appUrl) {
    return undefined;
  }

  return new URL(normalizeBaseUrl(appUrl));
}

export function getAbsoluteUrl(path: string, hostname?: string | null) {
  const siteUrl = getSiteUrl(hostname);
  if (!siteUrl) {
    return undefined;
  }

  return new URL(path, siteUrl);
}
