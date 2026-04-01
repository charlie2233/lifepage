import { getCloudflareSaasCnameTarget } from "@/lib/cloudflare-saas";

export const CUSTOM_DOMAIN_STATUSES = [
  "none",
  "configuration_required",
  "pending_verification",
  "verified",
  "active",
  "error",
] as const;

export type CustomDomainStatus = (typeof CUSTOM_DOMAIN_STATUSES)[number];

export const CUSTOM_DOMAIN_DNS_STATUSES = [
  "not_started",
  "configuration_required",
  "pending",
  "verified",
  "error",
] as const;

export type CustomDomainDnsStatus =
  (typeof CUSTOM_DOMAIN_DNS_STATUSES)[number];

export function normalizeCustomDomainStatus(
  value?: string | null
): CustomDomainStatus {
  return CUSTOM_DOMAIN_STATUSES.includes(value as CustomDomainStatus)
    ? (value as CustomDomainStatus)
    : "none";
}

export function normalizeCustomDomainDnsStatus(
  value?: string | null
): CustomDomainDnsStatus {
  return CUSTOM_DOMAIN_DNS_STATUSES.includes(value as CustomDomainDnsStatus)
    ? (value as CustomDomainDnsStatus)
    : "not_started";
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
  cloudflareConfigured?: boolean;
  dnsVerified: boolean;
  providerStatus?: string | null;
  sslStatus?: string | null;
  providerError?: string | null;
  forceError?: boolean;
}) {
  if (args.cloudflareConfigured === false) {
    return "configuration_required" satisfies CustomDomainStatus;
  }

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

export function deriveCustomDomainDnsStatus(args: {
  cloudflareConfigured?: boolean;
  dnsVerified: boolean;
  checked?: boolean;
  forceError?: boolean;
}) {
  if (args.cloudflareConfigured === false) {
    return "configuration_required" satisfies CustomDomainDnsStatus;
  }

  if (args.dnsVerified) {
    return "verified" satisfies CustomDomainDnsStatus;
  }

  if (args.forceError) {
    return "error" satisfies CustomDomainDnsStatus;
  }

  if (args.checked) {
    return "pending" satisfies CustomDomainDnsStatus;
  }

  return "not_started" satisfies CustomDomainDnsStatus;
}

export interface CustomDomainDiagnostics {
  launchScope: "subdomain_only";
  requestedHostname: string;
  providerConfigured: boolean;
  lifecycleStatus: CustomDomainStatus;
  dnsStatus: CustomDomainDnsStatus;
  verification: {
    type: "CNAME";
    name: string;
    value: string | null;
  };
  dns: {
    checkedAt: string | null;
    observedValues: string[];
  };
  provider: {
    id: string | null;
    status: string | null;
    error: string | null;
  };
  ssl: {
    status: string | null;
  };
  nextAction: string;
}

export function getCustomDomainNextAction(args: {
  cloudflareConfigured: boolean;
  lifecycleStatus: CustomDomainStatus;
  dnsStatus: CustomDomainDnsStatus;
  providerStatus?: string | null;
  sslStatus?: string | null;
  providerError?: string | null;
  verificationValue?: string | null;
  requestedHostname: string;
}) {
  if (!args.cloudflareConfigured) {
    return "LifePage saved the requested hostname locally, but provisioning is paused until the Cloudflare for SaaS setup is completed for this environment.";
  }

  if (args.lifecycleStatus === "active") {
    return "No action is needed. The hostname and certificate are active.";
  }

  if (args.providerError) {
    return "Review the Cloudflare provider error below, correct the issue, and run Verify DNS again.";
  }

  if (args.dnsStatus === "error" || args.lifecycleStatus === "pending_verification") {
    return `Create a single CNAME record for ${args.requestedHostname} that points to ${args.verificationValue ?? "the required target"}, remove conflicting records, and run Verify DNS again.`;
  }

  if (args.dnsStatus === "verified" && args.sslStatus !== "active") {
    return "DNS is correct. Wait for Cloudflare certificate issuance and validation to finish, then verify again if the status does not update.";
  }

  if (args.providerStatus && args.providerStatus !== "active") {
    return "Cloudflare has the hostname but has not marked it active yet. Keep the DNS record in place and retry verification after propagation.";
  }

  return "Verify the DNS record after saving the hostname.";
}

export function buildCustomDomainDiagnostics(args: {
  cloudflareConfigured: boolean;
  requestedHostname: string;
  lifecycleStatus: CustomDomainStatus;
  dnsStatus: CustomDomainDnsStatus;
  verificationName: string;
  verificationValue: string | null;
  observedValues?: string[];
  lastCheckedAt?: Date | null;
  providerId?: string | null;
  providerStatus?: string | null;
  providerError?: string | null;
  sslStatus?: string | null;
}) {
  return {
    launchScope: "subdomain_only",
    requestedHostname: args.requestedHostname,
    providerConfigured: args.cloudflareConfigured,
    lifecycleStatus: args.lifecycleStatus,
    dnsStatus: args.dnsStatus,
    verification: {
      type: "CNAME" as const,
      name: args.verificationName,
      value: args.verificationValue,
    },
    dns: {
      checkedAt: args.lastCheckedAt?.toISOString() ?? null,
      observedValues: args.observedValues ?? [],
    },
    provider: {
      id: args.providerId ?? null,
      status: args.providerStatus ?? null,
      error: args.providerError ?? null,
    },
    ssl: {
      status: args.sslStatus ?? null,
    },
    nextAction: getCustomDomainNextAction({
      cloudflareConfigured: args.cloudflareConfigured,
      lifecycleStatus: args.lifecycleStatus,
      dnsStatus: args.dnsStatus,
      providerStatus: args.providerStatus,
      sslStatus: args.sslStatus,
      providerError: args.providerError,
      verificationValue: args.verificationValue,
      requestedHostname: args.requestedHostname,
    }),
  } satisfies CustomDomainDiagnostics;
}
