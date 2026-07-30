import {
  getE2ECustomDomainFixture,
  isFakeCloudflareEnabled,
} from "@/lib/e2e-mode";

const CLOUDFLARE_API_ROOT = "https://api.cloudflare.com/client/v4";
export const CLOUDFLARE_SAAS_REQUIRED_ENV_NAMES = [
  "CLOUDFLARE_API_TOKEN",
  "CLOUDFLARE_SAAS_ZONE_ID",
  "CLOUDFLARE_SAAS_CNAME_TARGET",
  "CLOUDFLARE_SAAS_FALLBACK_ORIGIN",
] as const;

interface CloudflareApiError {
  code?: number;
  message?: string;
}

interface CloudflareEnvelope<T> {
  success?: boolean;
  errors?: CloudflareApiError[];
  messages?: CloudflareApiError[];
  result?: T;
}

export interface CloudflareCustomHostname {
  id: string;
  hostname: string;
  status?: string | null;
  verification_errors?: string[] | null;
  custom_origin_server?: string | null;
  custom_metadata?: Record<string, string> | null;
  ownership_verification?: {
    type?: string | null;
    name?: string | null;
    value?: string | null;
  } | null;
  ownership_verification_http?: {
    http_url?: string | null;
    http_body?: string | null;
  } | null;
  ssl?: {
    status?: string | null;
    method?: string | null;
    type?: string | null;
    validation_errors?: Array<string | { message?: string | null }> | null;
  } | null;
}

type FakeCloudflareState = {
  nextId: number;
  hostnames: Map<string, CloudflareCustomHostname>;
};

export class CloudflareSaasError extends Error {
  statusCode?: number;
  code?: number;
  errors: CloudflareApiError[];

  constructor(message: string, args?: {
    statusCode?: number;
    code?: number;
    errors?: CloudflareApiError[];
  }) {
    super(message);
    this.name = "CloudflareSaasError";
    this.statusCode = args?.statusCode;
    this.code = args?.code;
    this.errors = args?.errors ?? [];
  }
}

function normalizeHostname(value?: string | null) {
  return value?.trim().toLowerCase() || null;
}

function getFakeCloudflareState(): FakeCloudflareState {
  const globalForFakeCloudflare = globalThis as typeof globalThis & {
    __lifepageFakeCloudflare?: FakeCloudflareState;
  };

  if (!globalForFakeCloudflare.__lifepageFakeCloudflare) {
    globalForFakeCloudflare.__lifepageFakeCloudflare = {
      nextId: 1,
      hostnames: new Map(),
    };
  }

  return globalForFakeCloudflare.__lifepageFakeCloudflare;
}

function cloneCustomHostname(
  hostname: CloudflareCustomHostname
): CloudflareCustomHostname {
  return JSON.parse(JSON.stringify(hostname)) as CloudflareCustomHostname;
}

function buildFakeCustomHostname(args: {
  id: string;
  hostname: string;
  userId: string;
  status?: string;
  sslStatus?: string;
}) {
  return {
    id: args.id,
    hostname: args.hostname,
    status: args.status ?? "pending",
    custom_origin_server: getCloudflareSaasFallbackOrigin(),
    custom_metadata: { userId: args.userId },
    ssl: {
      status: args.sslStatus ?? "initializing",
      method: "http",
      type: "dv",
      validation_errors: null,
    },
    verification_errors: null,
  } satisfies CloudflareCustomHostname;
}

export function getCloudflareSaasCnameTarget() {
  return normalizeHostname(process.env.CLOUDFLARE_SAAS_CNAME_TARGET);
}

export function getCloudflareSaasFallbackOrigin() {
  return normalizeHostname(process.env.CLOUDFLARE_SAAS_FALLBACK_ORIGIN);
}

export interface CloudflareSaasCapability {
  configured: boolean;
  cnameTarget: string | null;
  fallbackOrigin: string | null;
  missing: string[];
}

export function getCloudflareSaasCapability(args?: { forceMissing?: boolean }) {
  const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim() || null;
  const zoneId = process.env.CLOUDFLARE_SAAS_ZONE_ID?.trim() || null;
  const cnameTarget = getCloudflareSaasCnameTarget();
  const fallbackOrigin = getCloudflareSaasFallbackOrigin();

  const missing = [
    ...(apiToken ? [] : ["CLOUDFLARE_API_TOKEN"]),
    ...(zoneId ? [] : ["CLOUDFLARE_SAAS_ZONE_ID"]),
    ...(cnameTarget ? [] : ["CLOUDFLARE_SAAS_CNAME_TARGET"]),
    ...(fallbackOrigin ? [] : ["CLOUDFLARE_SAAS_FALLBACK_ORIGIN"]),
  ];

  if (isFakeCloudflareEnabled()) {
    return {
      configured:
        !args?.forceMissing && Boolean(cnameTarget && fallbackOrigin),
      cnameTarget,
      fallbackOrigin,
      missing: args?.forceMissing ? [...CLOUDFLARE_SAAS_REQUIRED_ENV_NAMES] : missing,
    } satisfies CloudflareSaasCapability;
  }

  return {
    configured: !args?.forceMissing && missing.length === 0,
    cnameTarget,
    fallbackOrigin,
    missing: args?.forceMissing ? [...CLOUDFLARE_SAAS_REQUIRED_ENV_NAMES] : missing,
  } satisfies CloudflareSaasCapability;
}

export function isCloudflareSaasConfigured(args?: { forceMissing?: boolean }) {
  return getCloudflareSaasCapability(args).configured;
}

function getCloudflareSaasConfig() {
  const capability = getCloudflareSaasCapability();
  const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim();
  const zoneId = process.env.CLOUDFLARE_SAAS_ZONE_ID?.trim();

  if (!capability.configured || !apiToken || !zoneId) {
    throw new CloudflareSaasError(
      "Cloudflare for SaaS is not configured. Set CLOUDFLARE_API_TOKEN, CLOUDFLARE_SAAS_ZONE_ID, CLOUDFLARE_SAAS_CNAME_TARGET, and CLOUDFLARE_SAAS_FALLBACK_ORIGIN.",
      { statusCode: 503 }
    );
  }

  return {
    apiToken,
    zoneId,
    cnameTarget: capability.cnameTarget,
    fallbackOrigin: capability.fallbackOrigin,
  };
}

function buildCloudflareErrorMessage(
  fallback: string,
  errors: CloudflareApiError[] | undefined
) {
  const detail = (errors ?? [])
    .map((error) => error.message?.trim())
    .filter((message): message is string => Boolean(message))
    .join(" ");

  return detail ? `${fallback} ${detail}` : fallback;
}

async function cloudflareRequest<T>(path: string, init?: RequestInit) {
  const { apiToken } = getCloudflareSaasConfig();
  const response = await fetch(`${CLOUDFLARE_API_ROOT}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as
    | CloudflareEnvelope<T>
    | null;

  if (!response.ok || !payload?.success || payload.result === undefined) {
    const errors = payload?.errors ?? [];
    throw new CloudflareSaasError(
      buildCloudflareErrorMessage(
        "Cloudflare custom hostname request failed.",
        errors
      ),
      {
        statusCode: response.status,
        code: errors[0]?.code,
        errors,
      }
    );
  }

  return payload.result;
}

function toCreatePayload(args: { hostname: string; userId: string }) {
  const { fallbackOrigin } = getCloudflareSaasConfig();
  return {
    hostname: args.hostname,
    ssl: {
      method: "http",
      type: "dv",
    },
    custom_origin_server: fallbackOrigin,
    custom_metadata: {
      userId: args.userId,
    },
  };
}

export async function createCloudflareCustomHostname(args: {
  hostname: string;
  userId: string;
}) {
  if (isFakeCloudflareEnabled()) {
    const fixture = getE2ECustomDomainFixture(args.hostname);
    if (fixture?.createConflict) {
      throw new CloudflareSaasError(
        "That custom domain is already connected in Cloudflare.",
        {
          statusCode: 409,
          code: 1406,
        }
      );
    }

    const state = getFakeCloudflareState();
    const existing = state.hostnames.get(args.hostname);
    if (existing) {
      const ownerUserId = existing.custom_metadata?.userId ?? null;
      if (ownerUserId && ownerUserId !== args.userId) {
        throw new CloudflareSaasError(
          "That custom domain is already connected in Cloudflare.",
          {
            statusCode: 409,
            code: 1406,
          }
        );
      }

      return cloneCustomHostname(existing);
    }

    const created = buildFakeCustomHostname({
      id: `e2e-host-${state.nextId++}`,
      hostname: args.hostname,
      userId: args.userId,
      status: "pending",
      sslStatus: "initializing",
    });
    state.hostnames.set(args.hostname, created);
    return cloneCustomHostname(created);
  }

  return cloudflareRequest<CloudflareCustomHostname>(
    `/zones/${getCloudflareSaasConfig().zoneId}/custom_hostnames`,
    {
      method: "POST",
      body: JSON.stringify(toCreatePayload(args)),
    }
  );
}

export async function getCloudflareCustomHostname(id: string) {
  if (isFakeCloudflareEnabled()) {
    const state = getFakeCloudflareState();
    const matched = Array.from(state.hostnames.values()).find(
      (hostname) => hostname.id === id
    );
    if (!matched) {
      throw new CloudflareSaasError("Custom hostname not found.", {
        statusCode: 404,
      });
    }

    return cloneCustomHostname(matched);
  }

  return cloudflareRequest<CloudflareCustomHostname>(
    `/zones/${getCloudflareSaasConfig().zoneId}/custom_hostnames/${id}`
  );
}

export async function refreshCloudflareCustomHostname(id: string) {
  if (isFakeCloudflareEnabled()) {
    const state = getFakeCloudflareState();
    const matched = Array.from(state.hostnames.values()).find(
      (hostname) => hostname.id === id
    );
    if (!matched) {
      throw new CloudflareSaasError("Custom hostname not found.", {
        statusCode: 404,
      });
    }

    const fixture = getE2ECustomDomainFixture(matched.hostname);
    matched.status = fixture?.refreshStatus ?? "active";
    matched.ssl = {
      status: fixture?.refreshSslStatus ?? "active",
      method: "http",
      type: "dv",
      validation_errors: null,
    };
    matched.verification_errors = null;
    state.hostnames.set(matched.hostname, matched);
    return cloneCustomHostname(matched);
  }

  return cloudflareRequest<CloudflareCustomHostname>(
    `/zones/${getCloudflareSaasConfig().zoneId}/custom_hostnames/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        ssl: {
          method: "http",
          type: "dv",
        },
      }),
    }
  );
}

export async function findCloudflareCustomHostnameByHostname(hostname: string) {
  if (isFakeCloudflareEnabled()) {
    const state = getFakeCloudflareState();
    const matched = state.hostnames.get(hostname.trim().toLowerCase()) ?? null;
    return matched ? cloneCustomHostname(matched) : null;
  }

  const result = await cloudflareRequest<CloudflareCustomHostname[]>(
    `/zones/${getCloudflareSaasConfig().zoneId}/custom_hostnames?hostname=${encodeURIComponent(
      hostname
    )}`
  );

  return (
    result.find(
      (item) => item.hostname?.trim().toLowerCase() === hostname.trim().toLowerCase()
    ) ?? null
  );
}

export async function deleteCloudflareCustomHostname(id: string) {
  if (isFakeCloudflareEnabled()) {
    const state = getFakeCloudflareState();
    const matched = Array.from(state.hostnames.entries()).find(
      ([, hostname]) => hostname.id === id
    );
    if (!matched) {
      return;
    }

    state.hostnames.delete(matched[0]);
    return;
  }

  try {
    await cloudflareRequest<CloudflareCustomHostname | { id?: string }>(
      `/zones/${getCloudflareSaasConfig().zoneId}/custom_hostnames/${id}`,
      {
        method: "DELETE",
      }
    );
  } catch (error) {
    if (error instanceof CloudflareSaasError && error.statusCode === 404) {
      return;
    }
    throw error;
  }
}

export function extractCloudflareHostnameError(
  customHostname?: CloudflareCustomHostname | null
) {
  if (!customHostname) {
    return null;
  }

  const verificationErrors = customHostname.verification_errors ?? [];
  const sslValidationErrors = (customHostname.ssl?.validation_errors ?? [])
    .map((entry) => (typeof entry === "string" ? entry : entry.message?.trim()))
    .filter((message): message is string => Boolean(message));
  const combined = [...verificationErrors, ...sslValidationErrors]
    .map((message) => message.trim())
    .filter(Boolean);

  return combined.length > 0 ? combined.join(" ") : null;
}
