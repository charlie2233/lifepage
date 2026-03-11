import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  CloudflareSaasError,
  createCloudflareCustomHostname,
  extractCloudflareHostnameError,
  findCloudflareCustomHostnameByHostname,
  getCloudflareSaasCnameTarget,
  getCloudflareCustomHostname,
  isCloudflareSaasConfigured,
  refreshCloudflareCustomHostname,
  type CloudflareCustomHostname,
} from "@/lib/cloudflare-saas";
import {
  buildCustomDomainVerificationRecord,
  deriveCustomDomainLifecycleState,
  normalizeCustomDomainProviderStatus,
  normalizeCustomDomainSslStatus,
} from "@/lib/custom-domain-lifecycle";
import { prisma } from "@/lib/db";
import { verifyCustomDomainDns } from "@/lib/domain-verification";

function isProviderNotFound(error: unknown) {
  return error instanceof CloudflareSaasError && error.statusCode === 404;
}

function toVerifyErrorMessage(error: unknown) {
  if (error instanceof CloudflareSaasError) {
    return {
      status: error.statusCode && error.statusCode >= 400 ? error.statusCode : 502,
      message: error.statusCode === 503
        ? "Custom domains are unavailable until Cloudflare for SaaS is configured."
        : error.message,
    };
  }

  return {
    status: 502,
    message:
      error instanceof Error ? error.message : "Domain verification failed.",
  };
}

function buildManagedCustomDomainUpdate(args: {
  hostname: string;
  providerHostname?: CloudflareCustomHostname | null;
  dnsVerified: boolean;
  customDomainError?: string | null;
  lastCheckedAt: Date;
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

  return {
    customDomainStatus: deriveCustomDomainLifecycleState({
      dnsVerified: args.dnsVerified,
      providerStatus,
      sslStatus,
      providerError,
      forceError: args.forceError,
    }),
    customDomainVerificationName: verification.name,
    customDomainVerificationValue: verification.value,
    customDomainProviderId: args.providerHostname?.id ?? null,
    customDomainProviderStatus: providerStatus,
    customDomainSslStatus: sslStatus,
    customDomainProviderError: providerError,
    customDomainLastCheckedAt: args.lastCheckedAt,
    customDomainError: args.customDomainError ?? providerError ?? null,
  };
}

async function resolveProviderHostname(args: {
  hostname: string;
  providerId?: string | null;
  userId: string;
}) {
  let providerHostname: CloudflareCustomHostname | null = null;

  if (args.providerId) {
    try {
      providerHostname = await getCloudflareCustomHostname(args.providerId);
    } catch (error) {
      if (!isProviderNotFound(error)) {
        throw error;
      }
    }
  }

  if (!providerHostname) {
    providerHostname = await findCloudflareCustomHostnameByHostname(args.hostname);
    const ownerUserId = providerHostname?.custom_metadata?.userId ?? null;
    if (providerHostname && ownerUserId && ownerUserId !== args.userId) {
      throw new CloudflareSaasError(
        "That custom domain is already connected to another portfolio.",
        {
          statusCode: 409,
          code: 1406,
        }
      );
    }
  }

  if (!providerHostname) {
    providerHostname = await createCloudflareCustomHostname({
      hostname: args.hostname,
      userId: args.userId,
    });
  }

  return providerHostname;
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isCloudflareSaasConfigured()) {
    return NextResponse.json(
      {
        error:
          "Custom domains are unavailable until Cloudflare for SaaS is configured.",
        cloudflareSaasConfigured: false,
        cloudflareSaasCnameTarget: getCloudflareSaasCnameTarget(),
      },
      { status: 503 }
    );
  }

  const settings = await prisma.publicPageSettings.findUnique({
    where: { userId: session.user.id },
  });

  if (!settings?.customDomainNormalized) {
    return NextResponse.json(
      { error: "Save a custom domain first." },
      { status: 400 }
    );
  }

  const verifiedAt = new Date();

  try {
    let providerHostname = await resolveProviderHostname({
      hostname: settings.customDomainNormalized,
      providerId: settings.customDomainProviderId,
      userId: session.user.id,
    });
    const dnsVerification = await verifyCustomDomainDns(
      settings.customDomainNormalized
    );

    if (dnsVerification.ok) {
      try {
        providerHostname = await refreshCloudflareCustomHostname(
          providerHostname.id
        );
      } catch (error) {
        const { message, status } = toVerifyErrorMessage(error);
        const updated = await prisma.publicPageSettings.update({
          where: { userId: session.user.id },
          data: buildManagedCustomDomainUpdate({
            hostname: settings.customDomainNormalized,
            providerHostname,
            dnsVerified: true,
            customDomainError: message,
            lastCheckedAt: verifiedAt,
            forceError: true,
          }),
        });

        return NextResponse.json(
          {
            settings: updated,
            verified: false,
            error: message,
            cloudflareSaasConfigured: isCloudflareSaasConfigured(),
            cloudflareSaasCnameTarget: getCloudflareSaasCnameTarget(),
          },
          { status }
        );
      }
    }

    const updated = await prisma.publicPageSettings.update({
      where: { userId: session.user.id },
      data: buildManagedCustomDomainUpdate({
        hostname: settings.customDomainNormalized,
        providerHostname,
        dnsVerified: dnsVerification.ok,
        customDomainError: dnsVerification.ok ? null : dnsVerification.error,
        lastCheckedAt: verifiedAt,
        forceError: !dnsVerification.ok,
      }),
    });

    return NextResponse.json({
      settings: updated,
      verified: dnsVerification.ok,
      error: dnsVerification.ok ? null : dnsVerification.error,
      cloudflareSaasConfigured: isCloudflareSaasConfigured(),
      cloudflareSaasCnameTarget: getCloudflareSaasCnameTarget(),
    });
  } catch (error) {
    const { message, status } = toVerifyErrorMessage(error);
    const updated = await prisma.publicPageSettings.update({
      where: { userId: session.user.id },
      data: buildManagedCustomDomainUpdate({
        hostname: settings.customDomainNormalized,
        dnsVerified: false,
        customDomainError: message,
        lastCheckedAt: verifiedAt,
        forceError: true,
      }),
    });

    return NextResponse.json(
      {
        settings: updated,
        verified: false,
        error: message,
        cloudflareSaasConfigured: isCloudflareSaasConfigured(),
        cloudflareSaasCnameTarget: getCloudflareSaasCnameTarget(),
      },
      { status }
    );
  }
}
