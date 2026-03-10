import { getCloudflareSaasCnameTarget } from "@/lib/cloudflare-saas";

export const CUSTOM_DOMAIN_STATUSES = [
  "none",
  "pending_verification",
  "verified",
  "active",
  "error",
] as const;

export type CustomDomainStatus = (typeof CUSTOM_DOMAIN_STATUSES)[number];

export function normalizeCustomDomainStatus(
  value?: string | null
): CustomDomainStatus {
  return CUSTOM_DOMAIN_STATUSES.includes(value as CustomDomainStatus)
    ? (value as CustomDomainStatus)
    : "none";
}

export function isCustomDomainActive(settings?: {
  customDomainNormalized?: string | null;
  customDomainStatus?: string | null;
} | null) {
  return (
    normalizeCustomDomainStatus(settings?.customDomainStatus) === "active" &&
    Boolean(settings?.customDomainNormalized)
  );
}

export function getManagedCustomDomainTargetHost() {
  return getCloudflareSaasCnameTarget();
}

export function buildCustomDomainVerificationRecord(hostname: string) {
  return {
    name: hostname,
    value: getManagedCustomDomainTargetHost(),
  };
}

function normalizeProviderState(value?: string | null) {
  const normalized = value?.trim().toLowerCase().replace(/\s+/g, "_");
  return normalized || null;
}

export function normalizeCustomDomainProviderStatus(value?: string | null) {
  return normalizeProviderState(value);
}

export function normalizeCustomDomainSslStatus(value?: string | null) {
  return normalizeProviderState(value);
}

export function deriveCustomDomainLifecycleState(args: {
  dnsVerified: boolean;
  providerStatus?: string | null;
  sslStatus?: string | null;
  providerError?: string | null;
  forceError?: boolean;
}) {
  const providerStatus = normalizeCustomDomainProviderStatus(args.providerStatus);
  const sslStatus = normalizeCustomDomainSslStatus(args.sslStatus);

  if (providerStatus === "active" && sslStatus === "active") {
    return "active" satisfies CustomDomainStatus;
  }

  if (
    args.forceError ||
    Boolean(args.providerError) ||
    providerStatus === "deleted" ||
    providerStatus === "blocked" ||
    sslStatus === "deleted" ||
    sslStatus === "validation_timed_out"
  ) {
    return "error" satisfies CustomDomainStatus;
  }

  if (args.dnsVerified) {
    return "verified" satisfies CustomDomainStatus;
  }

  return "pending_verification" satisfies CustomDomainStatus;
}
