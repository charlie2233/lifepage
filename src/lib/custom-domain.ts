import { getAppBaseUrl } from "@/lib/runtime-env";

const HOST_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

function stripTrailingDot(value: string) {
  return value.replace(/\.+$/, "");
}

export function getRequestHostname(hostHeader: string | null | undefined) {
  if (!hostHeader) return null;
  const normalized = stripTrailingDot(hostHeader.trim().toLowerCase());
  if (!normalized) return null;

  if (normalized.startsWith("[")) {
    const end = normalized.indexOf("]");
    if (end === -1) return normalized;
    return normalized.slice(0, end + 1);
  }

  const [hostname] = normalized.split(":");
  return hostname || null;
}

export function getPrimaryAppHostname() {
  const appUrl = getAppBaseUrl();
  if (!appUrl) return null;

  try {
    return getRequestHostname(new URL(appUrl).host);
  } catch {
    return null;
  }
}

export function isInternalAppHostname(hostname: string) {
  const normalized = stripTrailingDot(hostname.trim().toLowerCase());
  if (!normalized) return false;
  if (LOOPBACK_HOSTS.has(normalized)) return true;
  if (normalized.endsWith(".workers.dev")) return true;

  const primaryHost = getPrimaryAppHostname();
  if (primaryHost && normalized === primaryHost) return true;

  return normalized.endsWith(".vercel.app");
}

export function normalizeCustomDomain(input: string) {
  const raw = input.trim().toLowerCase();
  if (!raw) {
    throw new Error("Enter a custom domain.");
  }

  const candidate = raw.includes("://") ? raw : `https://${raw}`;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error("Enter a valid domain like portfolio.example.com.");
  }

  if (url.username || url.password) {
    throw new Error("User info is not allowed in a custom domain.");
  }

  if (url.port) {
    throw new Error("Ports are not allowed in a custom domain.");
  }

  const hostname = getRequestHostname(url.host);
  if (!hostname) {
    throw new Error("Enter a valid domain like portfolio.example.com.");
  }

  if (isInternalAppHostname(hostname)) {
    throw new Error("Use an external domain, not the app's default hostname.");
  }

  const labels = hostname.split(".");
  if (labels.length < 2 || labels.some((label) => !HOST_LABEL.test(label))) {
    throw new Error("Enter a valid domain like portfolio.example.com.");
  }
  if (labels.length < 3) {
    throw new Error("Use a subdomain like portfolio.example.com. Apex domains are not supported yet.");
  }

  return hostname;
}
