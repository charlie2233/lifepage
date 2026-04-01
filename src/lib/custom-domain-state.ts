import type { CloudflareCustomHostname } from "@/lib/cloudflare-saas";
import { extractCloudflareHostnameError } from "@/lib/cloudflare-saas";
import {
  buildCustomDomainDiagnostics,
  buildCustomDomainVerificationRecord,
  deriveCustomDomainDnsStatus,
  deriveCustomDomainLifecycleState,
  normalizeCustomDomainProviderStatus,
  normalizeCustomDomainSslStatus,
} from "@/lib/custom-domain-lifecycle";

export function buildManagedCustomDomainState(args: {
  hostname: string;
  providerHostname?: CloudflareCustomHostname | null;
  dnsVerified: boolean;
  dnsChecked?: boolean;
  dnsObservedValues?: string[];
  cloudflareConfigured: boolean;
  customDomainError?: string | null;
  lastCheckedAt?: Date | null;
  forceError?: boolean;
}) {
  const verification = buildCustomDomainVerificationRecord(args.hostname);
  const providerError = extractCloudflareHostnameError(args.providerHostname);
  const providerStatus = normalizeCustomDomainProviderStatus(
    args.providerHostname?.status
  );
  const sslStatus = normalizeCustomDomainSslStatus(
    args.providerHostname?.ssl?.status
  );
  const status = deriveCustomDomainLifecycleState({
    cloudflareConfigured: args.cloudflareConfigured,
    dnsVerified: args.dnsVerified,
    providerStatus,
    sslStatus,
    providerError,
    forceError: args.forceError,
  });
  const dnsStatus = deriveCustomDomainDnsStatus({
    cloudflareConfigured: args.cloudflareConfigured,
    dnsVerified: args.dnsVerified,
    checked: args.dnsChecked ?? Boolean(args.lastCheckedAt),
    forceError: args.forceError,
  });

  return {
    customDomain: args.hostname,
    customDomainNormalized: args.hostname,
    customDomainStatus: status,
    customDomainDnsStatus: dnsStatus,
    customDomainVerificationName: verification.name,
    customDomainVerificationValue: verification.value,
    customDomainProviderId: args.providerHostname?.id ?? null,
    customDomainProviderStatus: providerStatus,
    customDomainSslStatus: sslStatus,
    customDomainProviderError: providerError,
    customDomainLastCheckedAt: args.lastCheckedAt ?? null,
    customDomainError: args.customDomainError ?? providerError ?? null,
    customDomainDiagnostics: buildCustomDomainDiagnostics({
      cloudflareConfigured: args.cloudflareConfigured,
      requestedHostname: args.hostname,
      lifecycleStatus: status,
      dnsStatus,
      verificationName: verification.name,
      verificationValue: verification.value,
      observedValues: args.dnsObservedValues,
      lastCheckedAt: args.lastCheckedAt,
      providerId: args.providerHostname?.id ?? null,
      providerStatus,
      providerError,
      sslStatus,
    }),
  };
}

export function buildClearedCustomDomainState() {
  return {
    customDomain: null,
    customDomainNormalized: null,
    customDomainStatus: "none",
    customDomainDnsStatus: "not_started",
    customDomainVerificationName: null,
    customDomainVerificationValue: null,
    customDomainProviderId: null,
    customDomainProviderStatus: null,
    customDomainSslStatus: null,
    customDomainProviderError: null,
    customDomainLastCheckedAt: null,
    customDomainError: null,
    customDomainDiagnostics: null,
  };
}
