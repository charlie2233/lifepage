import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  CloudflareSaasError,
  createCloudflareCustomHostname,
  findCloudflareCustomHostnameByHostname,
  getCloudflareSaasCapability,
  getCloudflareCustomHostname,
  refreshCloudflareCustomHostname,
  type CloudflareCustomHostname,
} from "@/lib/cloudflare-saas";
import { prisma } from "@/lib/db";
import {
  buildManagedCustomDomainState,
} from "@/lib/custom-domain-state";
import { isE2ETestMode } from "@/lib/e2e-mode";
import { logCustomDomainEvent } from "@/lib/custom-domain-observability";
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

function shouldSimulateMissingCloudflareSetup(req: Request) {
  return (
    isE2ETestMode() &&
    req.headers.get("x-e2e-cloudflare-saas")?.trim().toLowerCase() === "missing"
  );
}

function toVerifyUpdateData(
  data: ReturnType<typeof buildManagedCustomDomainState>
) {
  return {
    ...data,
    customDomainDiagnostics: data.customDomainDiagnostics,
  };
}

function buildStoredProviderHostname(
  hostname: string,
  settings?: {
    customDomainProviderId?: string | null;
    customDomainProviderStatus?: string | null;
    customDomainSslStatus?: string | null;
  } | null
) {
  if (!settings?.customDomainProviderId && !settings?.customDomainProviderStatus) {
    return null;
  }

  return {
    id: settings.customDomainProviderId ?? "stored-provider-id",
    hostname,
    status: settings.customDomainProviderStatus ?? null,
    ssl: {
      status: settings.customDomainSslStatus ?? null,
    },
  } as CloudflareCustomHostname;
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

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const cloudflareCapability = getCloudflareSaasCapability({
    forceMissing: shouldSimulateMissingCloudflareSetup(req),
  });

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

  if (!cloudflareCapability.configured) {
    const warning =
      "Verification is paused because Cloudflare for SaaS is not fully configured in this environment yet. The requested hostname is still saved locally.";
    const storedProviderHostname = buildStoredProviderHostname(
      settings.customDomainNormalized,
      settings
    );
    const updated = await prisma.publicPageSettings.update({
      where: { userId: session.user.id },
      data: toVerifyUpdateData(
        buildManagedCustomDomainState({
          hostname: settings.customDomainNormalized,
          providerHostname: storedProviderHostname,
          dnsVerified: false,
          dnsChecked: true,
          cloudflareConfigured: false,
          customDomainError: warning,
          lastCheckedAt: verifiedAt,
        })
      ),
    });

    logCustomDomainEvent("verify-paused", {
      userId: session.user.id,
      hostname: settings.customDomainNormalized,
      missingCloudflareConfig: cloudflareCapability.missing,
    });

    return NextResponse.json({
      settings: updated,
      verified: false,
      warning,
      cloudflareSaasConfigured: cloudflareCapability.configured,
      cloudflareSaasCnameTarget: cloudflareCapability.cnameTarget,
    });
  }

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
        logCustomDomainEvent("verify-provider-refresh-failed", {
          userId: session.user.id,
          hostname: settings.customDomainNormalized,
          providerId: providerHostname.id,
          message,
        });
        const updated = await prisma.publicPageSettings.update({
          where: { userId: session.user.id },
          data: toVerifyUpdateData(
            buildManagedCustomDomainState({
              hostname: settings.customDomainNormalized,
              providerHostname,
              dnsVerified: true,
              dnsChecked: true,
              cloudflareConfigured: cloudflareCapability.configured,
              customDomainError: message,
              lastCheckedAt: verifiedAt,
              forceError: true,
            })
          ),
        });

        return NextResponse.json(
          {
            settings: updated,
            verified: false,
            error: message,
            cloudflareSaasConfigured: cloudflareCapability.configured,
            cloudflareSaasCnameTarget: cloudflareCapability.cnameTarget,
          },
          { status }
        );
      }
    }

    const updated = await prisma.publicPageSettings.update({
      where: { userId: session.user.id },
      data: toVerifyUpdateData(
        buildManagedCustomDomainState({
          hostname: settings.customDomainNormalized,
          providerHostname,
          dnsVerified: dnsVerification.ok,
          dnsChecked: true,
          dnsObservedValues: dnsVerification.observedValues,
          cloudflareConfigured: cloudflareCapability.configured,
          customDomainError: dnsVerification.ok ? null : dnsVerification.error,
          lastCheckedAt: verifiedAt,
          forceError: !dnsVerification.ok,
        })
      ),
    });

    logCustomDomainEvent(dnsVerification.ok ? "verify-completed" : "verify-dns-mismatch", {
      userId: session.user.id,
      hostname: settings.customDomainNormalized,
      providerId: providerHostname.id,
      dnsVerified: dnsVerification.ok,
      observedValues: dnsVerification.observedValues,
      providerStatus: providerHostname.status ?? null,
      sslStatus: providerHostname.ssl?.status ?? null,
    });

    return NextResponse.json({
      settings: updated,
      verified: dnsVerification.ok,
      warning: dnsVerification.ok ? null : dnsVerification.error,
      cloudflareSaasConfigured: cloudflareCapability.configured,
      cloudflareSaasCnameTarget: cloudflareCapability.cnameTarget,
    });
  } catch (error) {
    const { message, status } = toVerifyErrorMessage(error);
    logCustomDomainEvent("verify-failed", {
      userId: session.user.id,
      hostname: settings.customDomainNormalized,
      message,
    });
    const updated = await prisma.publicPageSettings.update({
      where: { userId: session.user.id },
      data: toVerifyUpdateData(
        buildManagedCustomDomainState({
          hostname: settings.customDomainNormalized,
          dnsVerified: false,
          dnsChecked: true,
          cloudflareConfigured: cloudflareCapability.configured,
          customDomainError: message,
          lastCheckedAt: verifiedAt,
          forceError: true,
        })
      ),
    });

    return NextResponse.json(
      {
        settings: updated,
        verified: false,
        error: message,
        cloudflareSaasConfigured: cloudflareCapability.configured,
        cloudflareSaasCnameTarget: cloudflareCapability.cnameTarget,
      },
      { status }
    );
  }
}
