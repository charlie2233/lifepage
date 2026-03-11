import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  CloudflareSaasError,
  createCloudflareCustomHostname,
  deleteCloudflareCustomHostname,
  extractCloudflareHostnameError,
  findCloudflareCustomHostnameByHostname,
  getCloudflareSaasCnameTarget,
  getCloudflareCustomHostname,
  isCloudflareSaasConfigured,
  type CloudflareCustomHostname,
} from "@/lib/cloudflare-saas";
import {
  buildCustomDomainVerificationRecord,
  deriveCustomDomainLifecycleState,
  normalizeCustomDomainProviderStatus,
  normalizeCustomDomainSslStatus,
} from "@/lib/custom-domain-lifecycle";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { normalizeCustomDomain } from "@/lib/custom-domain";
import type { PublicPageVisibility } from "@/lib/page-visibility";
import {
  PortfolioThemeConfigSchema,
  PortfolioThemeIdSchema,
  type PortfolioThemeId,
} from "@/lib/portfolio-themes";
import {
  ResumeModelConfigSchema,
  ResumeModelIdSchema,
  type ResumeModelId,
} from "@/lib/resume-models";
import { z } from "zod";

const schema = z.object({
  isPublic: z.boolean().optional(),
  visibility: z.enum(["public", "unlisted", "private"]).optional(),
  mode: z.enum(["hiring", "admissions"]).optional(),
  theme: PortfolioThemeIdSchema.optional(),
  themeConfig: PortfolioThemeConfigSchema.nullable().optional(),
  resumeModel: ResumeModelIdSchema.optional(),
  resumeModelConfig: ResumeModelConfigSchema.nullable().optional(),
  customDomain: z.union([z.string(), z.null()]).optional(),
});

type SettingsUpdateData = {
  isPublic?: boolean;
  visibility?: PublicPageVisibility;
  mode?: "hiring" | "admissions";
  theme?: PortfolioThemeId;
  themeConfig?: Prisma.InputJsonValue | typeof Prisma.JsonNull;
  resumeModel?: ResumeModelId;
  resumeModelConfig?: Prisma.InputJsonValue | typeof Prisma.JsonNull;
  customDomain?: string | null;
  customDomainNormalized?: string | null;
  customDomainStatus?: string;
  customDomainVerificationName?: string | null;
  customDomainVerificationValue?: string | null;
  customDomainProviderId?: string | null;
  customDomainProviderStatus?: string | null;
  customDomainSslStatus?: string | null;
  customDomainProviderError?: string | null;
  customDomainLastCheckedAt?: Date | null;
  customDomainError?: string | null;
};

function isProviderNotFound(error: unknown) {
  return error instanceof CloudflareSaasError && error.statusCode === 404;
}

function toUserFacingDomainError(error: unknown) {
  if (error instanceof CloudflareSaasError) {
    if (error.statusCode === 503) {
      return {
        status: 503,
        message:
          "Custom domains are unavailable until Cloudflare for SaaS is configured.",
      };
    }
    if (error.code === 1406 || error.statusCode === 409) {
      return {
        status: 409,
        message:
          "That custom domain is already connected in Cloudflare. Remove it there first or choose a different hostname.",
      };
    }

    return {
      status: error.statusCode && error.statusCode >= 400 ? error.statusCode : 502,
      message: error.message,
    };
  }

  return {
    status: 502,
    message:
      error instanceof Error ? error.message : "Cloudflare custom domain request failed.",
  };
}

function buildManagedCustomDomainUpdate(args: {
  hostname: string;
  providerHostname?: CloudflareCustomHostname | null;
  dnsVerified: boolean;
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
    dnsVerified: args.dnsVerified,
    providerStatus,
    sslStatus,
    providerError,
    forceError: args.forceError,
  });

  return {
    customDomain: args.hostname,
    customDomainNormalized: args.hostname,
    customDomainStatus: status,
    customDomainVerificationName: verification.name,
    customDomainVerificationValue: verification.value,
    customDomainProviderId: args.providerHostname?.id ?? null,
    customDomainProviderStatus: providerStatus,
    customDomainSslStatus: sslStatus,
    customDomainProviderError: providerError,
    customDomainLastCheckedAt: args.lastCheckedAt ?? null,
    customDomainError: args.customDomainError ?? providerError ?? null,
  } satisfies SettingsUpdateData;
}

async function resolveCustomHostnameForUser(args: {
  hostname: string;
  userId: string;
  providerId?: string | null;
  allowUnownedLookup?: boolean;
}) {
  let providerHostname: CloudflareCustomHostname | null = null;

  if (args.providerId) {
    try {
      providerHostname = await getCloudflareCustomHostname(args.providerId);
      if (
        providerHostname.hostname.trim().toLowerCase() !==
        args.hostname.trim().toLowerCase()
      ) {
        providerHostname = null;
      }
    } catch (error) {
      if (!isProviderNotFound(error)) {
        throw error;
      }
    }
  }

  if (!providerHostname) {
    const matched = await findCloudflareCustomHostnameByHostname(args.hostname);
    if (matched) {
      const ownerUserId = matched.custom_metadata?.userId ?? null;
      if (ownerUserId && ownerUserId !== args.userId) {
        throw new CloudflareSaasError(
          "That custom domain is already connected to another portfolio.",
          {
            statusCode: 409,
            code: 1406,
          }
        );
      }
      if (!ownerUserId && !args.allowUnownedLookup) {
        throw new CloudflareSaasError(
          "That custom domain already exists in Cloudflare and needs manual cleanup before it can be reused.",
          {
            statusCode: 409,
            code: 1406,
          }
        );
      }
      providerHostname = matched;
    }
  }

  return providerHostname;
}

async function updateExistingDomainErrorState(args: {
  userId: string;
  message: string;
}) {
  return prisma.publicPageSettings.update({
    where: { userId: args.userId },
    data: {
      customDomainProviderError: args.message,
      customDomainError: args.message,
    },
  });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.publicPageSettings.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({
    settings,
    cloudflareSaasConfigured: isCloudflareSaasConfigured(),
    cloudflareSaasCnameTarget: getCloudflareSaasCnameTarget(),
  });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existingSettings = await prisma.publicPageSettings.findUnique({
    where: { userId: session.user.id },
  });
  const body = (await req.json().catch(() => null)) as unknown;
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const updateData: SettingsUpdateData = {};

  const resolvedVisibility =
    parsed.data.visibility ??
    (parsed.data.isPublic === undefined
      ? undefined
      : parsed.data.isPublic
        ? "public"
        : "private");

  if (resolvedVisibility !== undefined) {
    updateData.visibility = resolvedVisibility;
    updateData.isPublic = resolvedVisibility === "public";
  }

  if (parsed.data.mode !== undefined) updateData.mode = parsed.data.mode;
  if (parsed.data.theme !== undefined) updateData.theme = parsed.data.theme;
  if (Object.prototype.hasOwnProperty.call(parsed.data, "themeConfig")) {
    updateData.themeConfig =
      parsed.data.themeConfig === null
        ? Prisma.JsonNull
        : (parsed.data.themeConfig as Prisma.InputJsonValue);
  }
  if (parsed.data.resumeModel !== undefined) {
    updateData.resumeModel = parsed.data.resumeModel;
  }
  if (Object.prototype.hasOwnProperty.call(parsed.data, "resumeModelConfig")) {
    updateData.resumeModelConfig =
      parsed.data.resumeModelConfig === null
        ? Prisma.JsonNull
        : (parsed.data.resumeModelConfig as Prisma.InputJsonValue);
  }

  if (Object.prototype.hasOwnProperty.call(parsed.data, "customDomain")) {
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

    const rawDomain = parsed.data.customDomain?.trim() ?? "";

    if (!rawDomain) {
      if (existingSettings?.customDomainProviderId) {
        try {
          await deleteCloudflareCustomHostname(existingSettings.customDomainProviderId);
        } catch (error) {
          const { message, status } = toUserFacingDomainError(error);
          if (existingSettings) {
            await updateExistingDomainErrorState({
              userId: session.user.id,
              message,
            });
          }
          return NextResponse.json({ error: message }, { status });
        }
      } else if (existingSettings?.customDomainNormalized) {
        try {
          const existingProvider = await resolveCustomHostnameForUser({
            hostname: existingSettings.customDomainNormalized,
            userId: session.user.id,
            allowUnownedLookup: true,
          });
          if (existingProvider) {
            await deleteCloudflareCustomHostname(existingProvider.id);
          }
        } catch (error) {
          const { message, status } = toUserFacingDomainError(error);
          if (existingSettings) {
            await updateExistingDomainErrorState({
              userId: session.user.id,
              message,
            });
          }
          return NextResponse.json({ error: message }, { status });
        }
      }

      Object.assign(updateData, {
        customDomain: null,
        customDomainNormalized: null,
        customDomainStatus: "none",
        customDomainVerificationName: null,
        customDomainVerificationValue: null,
        customDomainProviderId: null,
        customDomainProviderStatus: null,
        customDomainSslStatus: null,
        customDomainProviderError: null,
        customDomainLastCheckedAt: null,
        customDomainError: null,
      } satisfies SettingsUpdateData);
    } else {
      let normalizedDomain: string;
      try {
        normalizedDomain = normalizeCustomDomain(rawDomain);
      } catch (error) {
        return NextResponse.json(
          {
            error:
              error instanceof Error ? error.message : "Invalid custom domain.",
          },
          { status: 400 }
        );
      }

      const duplicateDomain = await prisma.publicPageSettings.findFirst({
        where: {
          customDomainNormalized: normalizedDomain,
          NOT: { userId: session.user.id },
        },
        select: { id: true },
      });

      if (duplicateDomain) {
        return NextResponse.json(
          { error: "That custom domain is already connected to another portfolio." },
          { status: 409 }
        );
      }

      const replacingExistingDomain =
        existingSettings?.customDomainNormalized &&
        existingSettings.customDomainNormalized !== normalizedDomain;

      if (replacingExistingDomain && existingSettings.customDomainProviderId) {
        try {
          await deleteCloudflareCustomHostname(existingSettings.customDomainProviderId);
        } catch (error) {
          const { message, status } = toUserFacingDomainError(error);
          await updateExistingDomainErrorState({
            userId: session.user.id,
            message,
          });
          return NextResponse.json({ error: message }, { status });
        }
      } else if (replacingExistingDomain && existingSettings.customDomainNormalized) {
        try {
          const existingProvider = await resolveCustomHostnameForUser({
            hostname: existingSettings.customDomainNormalized,
            userId: session.user.id,
            allowUnownedLookup: true,
          });
          if (existingProvider) {
            await deleteCloudflareCustomHostname(existingProvider.id);
          }
        } catch (error) {
          const { message, status } = toUserFacingDomainError(error);
          await updateExistingDomainErrorState({
            userId: session.user.id,
            message,
          });
          return NextResponse.json({ error: message }, { status });
        }
      }

      try {
        let providerHostname = await resolveCustomHostnameForUser({
          hostname: normalizedDomain,
          userId: session.user.id,
          providerId:
            replacingExistingDomain || existingSettings?.customDomainNormalized !== normalizedDomain
              ? null
              : existingSettings?.customDomainProviderId,
          allowUnownedLookup:
            existingSettings?.customDomainNormalized === normalizedDomain,
        });

        if (!providerHostname) {
          providerHostname = await createCloudflareCustomHostname({
            hostname: normalizedDomain,
            userId: session.user.id,
          });
        }

        Object.assign(
          updateData,
          buildManagedCustomDomainUpdate({
            hostname: normalizedDomain,
            providerHostname,
            dnsVerified: false,
          })
        );
      } catch (error) {
        const { message, status } = toUserFacingDomainError(error);
        Object.assign(
          updateData,
          buildManagedCustomDomainUpdate({
            hostname: normalizedDomain,
            dnsVerified: false,
            customDomainError: message,
            forceError: true,
          })
        );

        try {
          const settings = await prisma.publicPageSettings.upsert({
            where: { userId: session.user.id },
            create: { userId: session.user.id, ...updateData },
            update: updateData,
          });
          return NextResponse.json({ settings, error: message }, { status });
        } catch {
          return NextResponse.json({ error: message }, { status });
        }
      }
    }
  }

  try {
    const settings = await prisma.publicPageSettings.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, ...updateData },
      update: updateData,
    });
    return NextResponse.json({
      settings,
      cloudflareSaasConfigured: isCloudflareSaasConfigured(),
      cloudflareSaasCnameTarget: getCloudflareSaasCnameTarget(),
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "That custom domain is already connected to another portfolio." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to save settings." },
      { status: 500 }
    );
  }
}
