import { createElement, type ReactElement } from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDemoPublicPageUser } from "@/lib/demo-public-pages";
import { normalizeVisibility } from "@/lib/page-visibility";
import { buildResumeData, buildResumeFilename } from "@/lib/public-resume";
import { ProfileJSONSchema } from "@/lib/schema";
import {
  ResumePdfDocument,
} from "@/lib/resume-pdf";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await auth();
  const { searchParams } = new URL(req.url);
  const requestedUsername = searchParams.get("username");

  let user = null;
  try {
    user = requestedUsername
      ? await prisma.user.findUnique({
          where: { username: requestedUsername },
          select: {
            id: true,
            email: true,
            name: true,
            username: true,
            profile: {
              select: {
                github: true,
                linkedin: true,
                contactEmail: true,
                location: true,
                phone: true,
                website: true,
                youtube: true,
              },
            },
            publicPageSettings: {
              select: { isPublic: true },
            },
            generatedProfiles: {
              where: { isActive: true },
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { data: true },
            },
          },
        })
      : session?.user?.id
        ? await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
              id: true,
              email: true,
              name: true,
              username: true,
              profile: {
                select: {
                  github: true,
                  linkedin: true,
                  contactEmail: true,
                  location: true,
                  phone: true,
                  website: true,
                  youtube: true,
                },
              },
              publicPageSettings: {
                select: { isPublic: true },
              },
              generatedProfiles: {
                where: { isActive: true },
                orderBy: { createdAt: "desc" },
                take: 1,
                select: { data: true },
              },
            },
          })
        : null;
  } catch (error) {
    console.error("Failed to load resume source user:", error);
  }

  const resolvedUser =
    user ??
    (requestedUsername ? await getDemoPublicPageUser(requestedUsername) : null);

  if (!resolvedUser) {
    return requestedUsername
      ? NextResponse.json({ error: "Not found" }, { status: 404 })
      : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isOwner = session?.user?.id === resolvedUser.id;
  if (
    requestedUsername &&
    normalizeVisibility(resolvedUser.publicPageSettings) === "private"
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const activeProfile = resolvedUser.generatedProfiles[0];
  if (!activeProfile) {
    return NextResponse.json(
      { error: "No profile generated yet" },
      { status: 404 }
    );
  }

  const parsedProfile = ProfileJSONSchema.safeParse(activeProfile.data);
  if (!parsedProfile.success) {
    return NextResponse.json(
      { error: "Generated profile is invalid" },
      { status: 500 }
    );
  }

  try {
    const resumeData = buildResumeData({
      email: resolvedUser.email,
      includeEmail: isOwner,
      name: resolvedUser.name ?? resolvedUser.username ?? "Atrak Pages User",
      publicContactEmail: resolvedUser.profile?.contactEmail,
      profile: parsedProfile.data,
      profileLinks: resolvedUser.profile,
      username: resolvedUser.username,
    });

    const document = createElement(ResumePdfDocument, {
      resume: resumeData,
    }) as unknown as ReactElement<DocumentProps>;
    const buffer = await renderToBuffer(document);
    const filename = buildResumeFilename(resumeData.name);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Content-Type": "application/pdf",
      },
    });
  } catch (error) {
    console.error("Resume export error:", error);
    return NextResponse.json(
      { error: "Failed to generate resume PDF" },
      { status: 500 }
    );
  }
}
