import { createElement, type ReactElement } from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { normalizeVisibility } from "@/lib/page-visibility";
import { ProfileJSONSchema } from "@/lib/schema";
import {
  ResumePdfDocument,
  type ResumePdfData,
} from "@/lib/resume-pdf";

export const runtime = "nodejs";

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "resume";
}

function buildResumeFilename(name: string) {
  return `${slugify(name)}-resume.pdf`;
}

function buildResumeData(args: {
  email?: string | null;
  includeEmail: boolean;
  name: string;
  profile: ReturnType<typeof ProfileJSONSchema.parse>;
  profileLinks: {
    github?: string | null;
    linkedin?: string | null;
    location?: string | null;
    website?: string | null;
    youtube?: string | null;
  } | null;
  username?: string | null;
}): ResumePdfData {
  const { email, includeEmail, name, profile, profileLinks, username } = args;

  const links = [
    profileLinks?.website
      ? { label: "Website", url: profileLinks.website }
      : null,
    profileLinks?.github
      ? { label: "GitHub", url: profileLinks.github }
      : null,
    profileLinks?.linkedin
      ? { label: "LinkedIn", url: profileLinks.linkedin }
      : null,
    profileLinks?.youtube
      ? { label: "YouTube", url: profileLinks.youtube }
      : null,
  ].filter((link): link is NonNullable<typeof link> => Boolean(link));

  return {
    name,
    headline: profile.headline,
    summary: profile.resume.summary || profile.about,
    username,
    email: includeEmail ? email ?? null : null,
    location: profileLinks?.location ?? null,
    links,
    skills: profile.skills.map((skill) => skill.tag),
    bullets: profile.resume.bullets.slice(0, 6),
    experiences: profile.experiences,
    projects: profile.projects.slice(0, 4),
    achievements: profile.achievements.slice(0, 4),
  };
}

export async function GET(req: Request) {
  const session = await auth();
  const { searchParams } = new URL(req.url);
  const requestedUsername = searchParams.get("username");

  const user = requestedUsername
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
              location: true,
              website: true,
              youtube: true,
            },
          },
          publicPageSettings: {
            select: { isPublic: true, visibility: true },
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
                location: true,
                website: true,
                youtube: true,
              },
            },
            publicPageSettings: {
              select: { isPublic: true, visibility: true },
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

  if (!user) {
    return requestedUsername
      ? NextResponse.json({ error: "Not found" }, { status: 404 })
      : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isOwner = session?.user?.id === user.id;
  if (
    requestedUsername &&
    normalizeVisibility(user.publicPageSettings) === "private"
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const activeProfile = user.generatedProfiles[0];
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
      email: user.email,
      includeEmail: isOwner,
      name: user.name ?? user.username ?? "LifePage User",
      profile: parsedProfile.data,
      profileLinks: user.profile,
      username: user.username,
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
