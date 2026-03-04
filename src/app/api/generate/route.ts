import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateProfileFromCrawl, generateProfileFromText } from "@/lib/ai";
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

    let profileData;

    if (evidenceItems.length > 0) {
      const crawlResults: CrawlResult[] = evidenceItems.map((item) => ({
        url: item.url ?? "",
        title: item.title ?? "",
        description: item.description ?? "",
        ogImage: null,
        headings: [],
        links: [],
        bodyText: item.rawContent ?? item.description ?? "",
        screenshot: item.screenshot ?? null,
        metadata: (item.metadata as Record<string, string>) ?? {},
      }));

      profileData = await generateProfileFromCrawl(crawlResults, {
        name: userInfo?.name,
        githubUrl: links?.github,
        linkedinUrl: links?.linkedin,
      });
    } else if (userInfo?.bio) {
      profileData = await generateProfileFromText(userInfo.bio, {
        name: userInfo?.name,
      });
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

    return NextResponse.json({ profile });
  } catch (err) {
    console.error("Generate error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
