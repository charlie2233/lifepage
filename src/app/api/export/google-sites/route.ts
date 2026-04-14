import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProfileJSONSchema } from "@/lib/schema";
import { buildGoogleSitesHtml } from "@/lib/google-sites-export";
import { getAppBaseUrl } from "@/lib/runtime-env";

export const runtime = "nodejs";

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "portfolio";
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      username: true,
      profile: {
        select: {
          contactEmail: true,
          website: true,
          github: true,
          linkedin: true,
          phone: true,
          youtube: true,
        },
      },
      publicPageSettings: {
        select: { mode: true },
      },
      generatedProfiles: {
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { data: true },
      },
    },
  });

  const activeProfile = user?.generatedProfiles[0];
  if (!user || !activeProfile) {
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

  const requestHeaders = await headers();
  const inferredBaseUrl = (() => {
    const host =
      requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
    if (!host) return null;

    const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
    return `${protocol}://${host}`.replace(/\/$/, "");
  })();
  const appBaseUrl = getAppBaseUrl() ?? inferredBaseUrl;
  const links = [
    user.profile?.contactEmail
      ? { label: "Email", url: `mailto:${user.profile.contactEmail}` }
      : null,
    user.profile?.website
      ? { label: "Website", url: user.profile.website }
      : null,
    user.profile?.github
      ? { label: "GitHub", url: user.profile.github }
      : null,
    user.profile?.linkedin
      ? { label: "LinkedIn", url: user.profile.linkedin }
      : null,
    user.profile?.youtube
      ? { label: "YouTube", url: user.profile.youtube }
      : null,
    user.profile?.phone
      ? { label: "Phone", url: `tel:${user.profile.phone.replace(/[^\d+]/g, "")}` }
      : null,
    user.username && appBaseUrl
      ? { label: "Atrak Pages", url: `${appBaseUrl}/u/${user.username}` }
      : null,
  ].filter((link): link is NonNullable<typeof link> => Boolean(link));

  const html = buildGoogleSitesHtml({
    name: user.name ?? user.username ?? "Atrak Pages User",
    headline: parsedProfile.data.headline,
    about: parsedProfile.data.about,
    mode: (user.publicPageSettings?.mode as "hiring" | "admissions") ?? "hiring",
    username: user.username,
    links,
    skills: parsedProfile.data.skills.map((skill) => skill.tag),
    experiences: parsedProfile.data.experiences,
    projects: parsedProfile.data.projects,
    achievements: parsedProfile.data.achievements,
  });

  return new NextResponse(html, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${slugify(user.name ?? user.username ?? "portfolio")}-google-sites.html"`,
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
