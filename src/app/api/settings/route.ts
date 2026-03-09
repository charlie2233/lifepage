import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
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

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const settings = await prisma.publicPageSettings.findUnique({
    where: { userId: session.user.id },
  });
  return NextResponse.json({ settings });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json() as unknown;
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const updateData: {
    isPublic?: boolean;
    visibility?: PublicPageVisibility;
    mode?: "hiring" | "admissions";
    theme?: PortfolioThemeId;
    themeConfig?: Prisma.InputJsonValue | typeof Prisma.JsonNull;
    resumeModel?: ResumeModelId;
    resumeModelConfig?: Prisma.InputJsonValue | typeof Prisma.JsonNull;
    customDomain?: string | null;
    customDomainNormalized?: string | null;
  } = {};

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
    const rawDomain = parsed.data.customDomain?.trim() ?? "";

    if (!rawDomain) {
      updateData.customDomain = null;
      updateData.customDomainNormalized = null;
    } else {
      try {
        const normalizedDomain = normalizeCustomDomain(rawDomain);
        updateData.customDomain = normalizedDomain;
        updateData.customDomainNormalized = normalizedDomain;
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Invalid custom domain." },
          { status: 400 }
        );
      }
    }
  }

  try {
    const settings = await prisma.publicPageSettings.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, ...updateData },
      update: updateData,
    });
    return NextResponse.json({ settings });
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
