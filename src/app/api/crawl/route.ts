import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { crawlUrl } from "@/lib/crawler";
import { z } from "zod";

const schema = z.object({
  url: z.string().url(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as unknown;
    const { url } = schema.parse(body);

    const crawlResult = await crawlUrl(url);

    const item = await prisma.evidenceItem.create({
      data: {
        userId: session.user.id,
        type: "url",
        url: crawlResult.url,
        title: crawlResult.title || url,
        description: crawlResult.description || "",
        screenshot: crawlResult.screenshot,
        rawContent: crawlResult.bodyText,
        metadata: crawlResult.metadata as object,
        visible: true,
      },
    });

    return NextResponse.json({ item, crawlResult });
  } catch (err) {
    console.error("Crawl error:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
