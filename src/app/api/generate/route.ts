import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getBillingSnapshot, reserveAiModel } from "@/lib/billing";
import { prisma } from "@/lib/db";
import { generateProfileFromCrawl, generateProfileFromText } from "@/lib/ai";
import { recordProductEvent } from "@/lib/product-analytics";
import type { CrawlResult } from "@/lib/crawler";

interface RequestBody {
  links?: {
    github?: string;
    linkedin?: string;
    youtube?: string;
    drive?: string;
  };
  userInfo?: {
    name?: string;
    bio?: string;
    tags?: string;
  };
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { links, userInfo } = (await req.json()) as RequestBody;

    const evidenceItems = await prisma.evidenceItem.findMany({
      where: { userId: session.user.id, visible: true },
    });
    await recordProductEvent({
      event: "generate_profile_started",
      path: "/dashboard",
      userId: session.user.id,
      metadata: {
        evidenceCount: evidenceItems.length,
        hasBio: Boolean(userInfo?.bio?.trim()),
      },
    });

    let profileData;

    if (evidenceItems.length > 0) {
      const aiReservation = await reserveAiModel(session.user.id, {
        task: "profile",
      });
      const crawlResults: CrawlResult[] = evidenceItems.map((item) => ({
        url: item.url ?? "",
        title: item.title ?? "",
        description: item.description ?? "",
        ogImage: null,
        headings: [],
        links: [],
        bodyText: item.rawContent ?? item.description ?? "",
        screenshot: item.screenshot ?? null,
        crawlStatus: item.screenshot ? "ready" : "partial",
        screenshotStatus: item.screenshot ? "ready" : "unavailable",
        screenshotError: null,
        metadata: (item.metadata as Record<string, string>) ?? {},
      }));

      profileData = await generateProfileFromCrawl(crawlResults, {
        name: userInfo?.name,
        githubUrl: links?.github,
        linkedinUrl: links?.linkedin,
      }, aiReservation.model, aiReservation.clientConfig, aiReservation.maxTokens);
    } else if (userInfo?.bio) {
      const aiReservation = await reserveAiModel(session.user.id, {
        task: "profile",
      });
      profileData = await generateProfileFromText(userInfo.bio, {
        name: userInfo?.name,
      }, aiReservation.model, aiReservation.clientConfig, aiReservation.maxTokens);
    } else {
      await recordProductEvent({
        event: "generate_profile_failed",
        path: "/dashboard",
        userId: session.user.id,
        metadata: {
          evidenceCount: evidenceItems.length,
          reason: "no_input",
        },
      });
      return NextResponse.json(
        {
          error:
            "Add at least one evidence source or a short bio before generating your first profile.",
        },
        { status: 400 }
      );
    }

    await prisma.generatedProfile.updateMany({
      where: { userId: session.user.id, isActive: true },
      data: { isActive: false },
    });

    const profile = await prisma.generatedProfile.create({
      data: {
        userId: session.user.id,
        data: profileData as object,
        isActive: true,
      },
    });

    if (links) {
      await prisma.userProfile.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          github: links.github,
          linkedin: links.linkedin,
          youtube: links.youtube,
        },
        update: {
          github: links.github,
          linkedin: links.linkedin,
          youtube: links.youtube,
        },
      });
    }

    const billing = await getBillingSnapshot(session.user.id);
    await recordProductEvent({
      event: "generate_profile_succeeded",
      path: "/dashboard",
      userId: session.user.id,
      metadata: {
        evidenceCount: evidenceItems.length,
        projectCount:
          typeof profileData === "object" &&
          profileData &&
          "projects" in profileData &&
          Array.isArray(profileData.projects)
            ? profileData.projects.length
            : null,
      },
    });

    return NextResponse.json({ profile, billing });
  } catch (err) {
    console.error("Generate error:", err);
    await recordProductEvent({
      event: "generate_profile_failed",
      path: "/dashboard",
      userId: session.user.id,
      metadata: {
        reason: err instanceof Error ? err.message : String(err),
      },
    });
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Profile generation failed. Try again after checking your evidence and bio.",
      },
      { status: 500 }
    );
  }
}
