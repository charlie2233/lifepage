import { getPrimaryAppHostname } from "@/lib/custom-domain";

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
  return (
    process.env.CUSTOM_DOMAIN_TARGET_HOST?.trim().toLowerCase() ??
    getPrimaryAppHostname() ??
    null
  );
}

export function buildCustomDomainVerificationRecord(hostname: string) {
  return {
    name: hostname,
    value: getManagedCustomDomainTargetHost(),
  };
}
