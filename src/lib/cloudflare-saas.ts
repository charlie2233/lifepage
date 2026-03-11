const CLOUDFLARE_API_ROOT = "https://api.cloudflare.com/client/v4";

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

export function getCloudflareSaasCnameTarget() {
  return normalizeHostname(process.env.CLOUDFLARE_SAAS_CNAME_TARGET);
}

export function getCloudflareSaasFallbackOrigin() {
  return normalizeHostname(process.env.CLOUDFLARE_SAAS_FALLBACK_ORIGIN);
}

export function isCloudflareSaasConfigured() {
  return Boolean(
    process.env.CLOUDFLARE_API_TOKEN &&
      process.env.CLOUDFLARE_SAAS_ZONE_ID &&
      getCloudflareSaasCnameTarget() &&
      getCloudflareSaasFallbackOrigin()
  );
}

function getCloudflareSaasConfig() {
  const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim();
  const zoneId = process.env.CLOUDFLARE_SAAS_ZONE_ID?.trim();
  const cnameTarget = getCloudflareSaasCnameTarget();
  const fallbackOrigin = getCloudflareSaasFallbackOrigin();

  if (!apiToken || !zoneId || !cnameTarget || !fallbackOrigin) {
    throw new CloudflareSaasError(
      "Cloudflare for SaaS is not configured. Set CLOUDFLARE_API_TOKEN, CLOUDFLARE_SAAS_ZONE_ID, CLOUDFLARE_SAAS_CNAME_TARGET, and CLOUDFLARE_SAAS_FALLBACK_ORIGIN.",
      { statusCode: 503 }
    );
  }

  return { apiToken, zoneId, cnameTarget, fallbackOrigin };
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
  return cloudflareRequest<CloudflareCustomHostname>(
    `/zones/${getCloudflareSaasConfig().zoneId}/custom_hostnames`,
    {
      method: "POST",
      body: JSON.stringify(toCreatePayload(args)),
    }
  );
}

export async function getCloudflareCustomHostname(id: string) {
  return cloudflareRequest<CloudflareCustomHostname>(
    `/zones/${getCloudflareSaasConfig().zoneId}/custom_hostnames/${id}`
  );
}

export async function refreshCloudflareCustomHostname(id: string) {
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
