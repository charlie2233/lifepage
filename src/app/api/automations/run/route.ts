/**
 * Automation runner endpoint.
 * Called by an external cron service (e.g. Vercel Cron, GitHub Actions, Upstash QStash)
 * with a secret header, or triggered manually from the dashboard.
 *
 * POST /api/automations/run          — run all due automations (cron)
 * POST /api/automations/run?id=xxx   — run a single automation by ID (manual trigger)
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { crawlUrl } from "@/lib/crawler";
import { generateProfileFromCrawl } from "@/lib/ai";
import { generateTimeline, generateVideoScript, computeNextRun } from "@/lib/agent-tools";

const MAX_CONTEXT_LENGTH = 2000;
import type { CrawlResult } from "@/lib/crawler";

async function runAutomation(automationId: string): Promise<{ ok: boolean; message: string }> {
  const automation = await prisma.automation.findUnique({ where: { id: automationId } });
  if (!automation || !automation.enabled) {
    return { ok: false, message: "Automation not found or disabled" };
  }

  // Mark as running
  await prisma.automation.update({
    where: { id: automationId },
    data: { lastStatus: "running" },
  });

  try {
    const config = automation.config as Record<string, unknown>;
    let resultMessage = "";

    switch (automation.action) {
      case "recrawl_url": {
        const url = config.url as string;
        if (!url) throw new Error("No URL configured");
        const crawlResult = await crawlUrl(url);
        // Update or create evidence item
        await prisma.evidenceItem.upsert({
          where: { id: (config.evidenceItemId as string) ?? "none" },
          create: {
            userId: automation.userId,
            type: "url",
            url: crawlResult.url,
            title: crawlResult.title,
            description: crawlResult.description,
            screenshot: crawlResult.screenshot,
            rawContent: crawlResult.bodyText,
            metadata: crawlResult.metadata as object,
            visible: true,
          },
          update: {
            title: crawlResult.title,
            description: crawlResult.description,
            screenshot: crawlResult.screenshot,
            rawContent: crawlResult.bodyText,
            metadata: crawlResult.metadata as object,
          },
        });
        resultMessage = `Re-crawled ${url}`;
        break;
      }

      case "regenerate_profile": {
        const evidenceItems = await prisma.evidenceItem.findMany({
          where: { userId: automation.userId, visible: true },
        });
        if (evidenceItems.length === 0) throw new Error("No evidence items to generate from");

        const crawlResults: CrawlResult[] = evidenceItems.map((item) => ({
          url: item.url ?? "",
          title: item.title ?? "",
          description: item.description ?? "",
          ogImage: null,
          headings: [],
          links: [],
          bodyText: item.rawContent ?? "",
          screenshot: item.screenshot ?? null,
          metadata: (item.metadata as Record<string, string>) ?? {},
        }));

        const profileData = await generateProfileFromCrawl(crawlResults, {});
        await prisma.generatedProfile.updateMany({
          where: { userId: automation.userId, isActive: true },
          data: { isActive: false },
        });
        await prisma.generatedProfile.create({
          data: { userId: automation.userId, data: profileData as object, isActive: true },
        });
        resultMessage = "Profile regenerated";
        break;
      }

      case "refresh_timeline": {
        const profile = await prisma.generatedProfile.findFirst({
          where: { userId: automation.userId, isActive: true },
        });
        const context = profile ? JSON.stringify(profile.data).slice(0, MAX_CONTEXT_LENGTH) : "No profile";
        const style = (config.style as string) ?? "vertical";
        const timeline = await generateTimeline(context, style as Parameters<typeof generateTimeline>[1]);
        await prisma.agentArtifact.create({
          data: {
            userId: automation.userId,
            tool: "generate_timeline",
            style,
            input: "automation",
            output: timeline as object,
          },
        });
        resultMessage = `Timeline refreshed (${style} style)`;
        break;
      }

      case "refresh_video_script": {
        const profile = await prisma.generatedProfile.findFirst({
          where: { userId: automation.userId, isActive: true },
        });
        const context = profile ? JSON.stringify(profile.data).slice(0, MAX_CONTEXT_LENGTH) : "No profile";
        const style = (config.style as string) ?? "documentary";
        const script = await generateVideoScript(context, style as Parameters<typeof generateVideoScript>[1]);
        await prisma.agentArtifact.create({
          data: {
            userId: automation.userId,
            tool: "generate_video_script",
            style,
            input: "automation",
            output: script as object,
          },
        });
        resultMessage = `Video script refreshed (${style} style)`;
        break;
      }

      default:
        throw new Error(`Unknown action: ${automation.action}`);
    }

    const nextRun = await computeNextRun(automation.schedule);
    await prisma.automation.update({
      where: { id: automationId },
      data: {
        lastStatus: "success",
        lastRun: new Date(),
        nextRun,
        lastError: null,
        runCount: { increment: 1 },
      },
    });

    return { ok: true, message: resultMessage };
  } catch (err) {
    await prisma.automation.update({
      where: { id: automationId },
      data: { lastStatus: "error", lastError: String(err) },
    });
    return { ok: false, message: String(err) };
  }
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const singleId = url.searchParams.get("id");

  // Manual trigger — requires auth
  if (singleId) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify ownership
    const automation = await prisma.automation.findUnique({ where: { id: singleId } });
    if (!automation || automation.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const result = await runAutomation(singleId);
    return NextResponse.json(result);
  }

  // Cron trigger — requires CRON_SECRET header
  const cronSecret = req.headers.get("x-cron-secret");
  if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Find all due automations
  const due = await prisma.automation.findMany({
    where: {
      enabled: true,
      OR: [
        { nextRun: null },
        { nextRun: { lte: new Date() } },
      ],
    },
    take: 20,
  });

  const results = await Promise.allSettled(due.map((a) => runAutomation(a.id)));

  const summary = results.map((r, i) => ({
    id: due[i]?.id,
    result: r.status === "fulfilled" ? r.value : { ok: false, message: String(r.reason) },
  }));

  return NextResponse.json({ ran: due.length, summary });
}
