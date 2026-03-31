import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getBillingSnapshot, reserveAiModel } from "@/lib/billing";
import { prisma } from "@/lib/db";
import { generateProfileFromCrawl, generateProfileFromText } from "@/lib/ai";
import type { CrawlResult } from "@/lib/crawler";
import { recordProductAnalyticsEvent } from "@/lib/product-analytics";

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

    await recordProductAnalyticsEvent({
      event: "generate_profile_requested",
      metadata: {
        evidenceCount: evidenceItems.length,
        hasBio: Boolean(userInfo?.bio),
      },
      source: "server",
      userId: session.user.id,
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
      return NextResponse.json(
        { error: "No evidence or bio provided" },
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

    await recordProductAnalyticsEvent({
      event: "generate_profile_succeeded",
      metadata: {
        evidenceCount: evidenceItems.length,
        projectCount:
          typeof profileData === "object" &&
          profileData &&
          "projects" in profileData &&
          Array.isArray(profileData.projects)
            ? profileData.projects.length
            : 0,
      },
      source: "server",
      userId: session.user.id,
    });

    return NextResponse.json({ profile, billing });
  } catch (err) {
    console.error("Generate error:", err);
    await recordProductAnalyticsEvent({
      event: "generate_profile_failed",
      metadata: {
        error:
          err instanceof Error
            ? err.message.slice(0, 200)
            : String(err).slice(0, 200),
      },
      source: "server",
      userId: session.user.id,
    });
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
