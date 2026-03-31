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
import { reserveAiModel } from "@/lib/billing";
import { prisma } from "@/lib/db";
import {
  AUTOMATION_LOCK_TIMEOUT_MS,
  AUTOMATION_MAX_RETRIES,
  computeNextRun,
  getAutomationRetryDelayMs,
  isTransientAutomationError,
} from "@/lib/automations";
import { canonicalizeCrawlUrl } from "@/lib/crawl-state";
import { crawlUrl } from "@/lib/crawler";
import { generateProfileFromCrawl } from "@/lib/ai";
import { generateTimeline, generateVideoScript } from "@/lib/agent-tools";
import type { CrawlResult } from "@/lib/crawler";

const MAX_CONTEXT_LENGTH = 2000;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error ?? "Unknown error");
}

async function acquireAutomationLock(automationId: string) {
  const lockedAt = new Date();
  const staleBefore = new Date(lockedAt.getTime() - AUTOMATION_LOCK_TIMEOUT_MS);
  const result = await prisma.automation.updateMany({
    where: {
      id: automationId,
      enabled: true,
      OR: [{ lockedAt: null }, { lockedAt: { lte: staleBefore } }],
    },
    data: {
      lockedAt,
      lastStatus: "running",
      lastAttemptAt: lockedAt,
    },
  });

  return result.count === 1 ? lockedAt : null;
}

async function runAutomation(automationId: string): Promise<{ ok: boolean; message: string }> {
  const automation = await prisma.automation.findUnique({ where: { id: automationId } });
  if (!automation || !automation.enabled) {
    return { ok: false, message: "Automation not found or disabled" };
  }

  const lockedAt = await acquireAutomationLock(automationId);
  if (!lockedAt) {
    return { ok: false, message: "Automation is already running." };
  }

  const lockedAutomation = await prisma.automation.findUnique({
    where: { id: automationId },
  });
  if (!lockedAutomation || !lockedAutomation.enabled) {
    await prisma.automation.updateMany({
      where: { id: automationId },
      data: { lockedAt: null, lastStatus: "error" },
    });
    return { ok: false, message: "Automation not found or disabled" };
  }

  try {
    const config = lockedAutomation.config as Record<string, unknown>;
    let resultMessage = "";

    switch (lockedAutomation.action) {
      case "recrawl_url": {
        const url = config.url as string;
        if (!url) throw new Error("No URL configured");
        const crawlResult = await crawlUrl(url);
        const canonicalUrl = canonicalizeCrawlUrl(crawlResult.url);
        await prisma.evidenceItem.upsert({
          where: {
            userId_canonicalUrl: {
              userId: lockedAutomation.userId,
              canonicalUrl,
            },
          },
          create: {
            userId: lockedAutomation.userId,
            type: "url",
            url: crawlResult.url,
            canonicalUrl,
            title: crawlResult.title,
            description: crawlResult.description,
            screenshot: crawlResult.screenshot,
            crawlStatus: crawlResult.crawlStatus,
            screenshotStatus: crawlResult.screenshotStatus,
            screenshotError: crawlResult.screenshotError,
            rawContent: crawlResult.bodyText,
            metadata: crawlResult.metadata as object,
            visible: true,
          },
          update: {
            url: crawlResult.url,
            title: crawlResult.title,
            description: crawlResult.description,
            screenshot: crawlResult.screenshot,
            crawlStatus: crawlResult.crawlStatus,
            screenshotStatus: crawlResult.screenshotStatus,
            screenshotError: crawlResult.screenshotError,
            rawContent: crawlResult.bodyText,
            metadata: crawlResult.metadata as object,
          },
        });
        resultMessage = `Re-crawled ${url}`;
        break;
      }

      case "regenerate_profile": {
        const evidenceItems = await prisma.evidenceItem.findMany({
          where: { userId: lockedAutomation.userId, visible: true },
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
          crawlStatus: item.crawlStatus as CrawlResult["crawlStatus"],
          screenshotStatus: item.screenshotStatus as CrawlResult["screenshotStatus"],
          screenshotError: item.screenshotError,
          metadata: (item.metadata as Record<string, string>) ?? {},
        }));

        const aiReservation = await reserveAiModel(lockedAutomation.userId, {
          task: "profile",
        });
        const profileData = await generateProfileFromCrawl(
          crawlResults,
          {},
          aiReservation.model,
          aiReservation.clientConfig,
          aiReservation.maxTokens
        );
        await prisma.generatedProfile.updateMany({
          where: { userId: lockedAutomation.userId, isActive: true },
          data: { isActive: false },
        });
        await prisma.generatedProfile.create({
          data: {
            userId: lockedAutomation.userId,
            data: profileData as object,
            isActive: true,
          },
        });
        resultMessage = "Profile regenerated";
        break;
      }

      case "refresh_timeline": {
        const profile = await prisma.generatedProfile.findFirst({
          where: { userId: lockedAutomation.userId, isActive: true },
        });
        const context = profile ? JSON.stringify(profile.data).slice(0, MAX_CONTEXT_LENGTH) : "No profile";
        const style = (config.style as string) ?? "vertical";
        const aiReservation = await reserveAiModel(lockedAutomation.userId, {
          task: "timeline",
        });
        const timeline = await generateTimeline(
          context,
          aiReservation.model,
          style as Parameters<typeof generateTimeline>[2],
          undefined,
          aiReservation.clientConfig,
          aiReservation.maxTokens
        );
        await prisma.agentArtifact.create({
          data: {
            userId: lockedAutomation.userId,
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
          where: { userId: lockedAutomation.userId, isActive: true },
        });
        const context = profile ? JSON.stringify(profile.data).slice(0, MAX_CONTEXT_LENGTH) : "No profile";
        const style = (config.style as string) ?? "documentary";
        const aiReservation = await reserveAiModel(lockedAutomation.userId, {
          task: "video_script",
        });
        const script = await generateVideoScript(
          context,
          aiReservation.model,
          style as Parameters<typeof generateVideoScript>[2],
          undefined,
          aiReservation.clientConfig,
          aiReservation.maxTokens
        );
        await prisma.agentArtifact.create({
          data: {
            userId: lockedAutomation.userId,
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
        throw new Error(`Unknown action: ${lockedAutomation.action}`);
    }

    const completedAt = new Date();
    const nextRun = computeNextRun(lockedAutomation.schedule, {
      from: completedAt,
      timeOfDay: lockedAutomation.scheduleTime,
      timeZone: lockedAutomation.scheduleTimezone,
    });
    await prisma.automation.update({
      where: { id: automationId },
      data: {
        lastStatus: "success",
        lockedAt: null,
        lastAttemptAt: completedAt,
        lastRun: completedAt,
        nextRun,
        lastError: null,
        retryCount: 0,
        runCount: { increment: 1 },
      },
    });

    return { ok: true, message: resultMessage };
  } catch (err) {
    const failedAt = new Date();
    const errorMessage = getErrorMessage(err);
    const transient = isTransientAutomationError(err);
    const nextRetryCount = lockedAutomation.retryCount + 1;
    const shouldRetry = transient && nextRetryCount <= AUTOMATION_MAX_RETRIES;
    await prisma.automation.update({
      where: { id: automationId },
      data: {
        lockedAt: null,
        lastStatus: "error",
        lastAttemptAt: failedAt,
        lastError: errorMessage,
        retryCount: shouldRetry ? nextRetryCount : 0,
        nextRun: shouldRetry
          ? new Date(failedAt.getTime() + getAutomationRetryDelayMs(lockedAutomation.retryCount))
          : computeNextRun(lockedAutomation.schedule, {
              from: failedAt,
              timeOfDay: lockedAutomation.scheduleTime,
              timeZone: lockedAutomation.scheduleTimezone,
            }),
      },
    });
    return {
      ok: false,
      message: shouldRetry
        ? `${errorMessage} Retrying automatically.`
        : errorMessage,
    };
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
  const configuredCronSecret = process.env.CRON_SECRET?.trim();
  if (!configuredCronSecret) {
    return NextResponse.json(
      { error: "Automation cron is misconfigured: missing CRON_SECRET. See SECRETS.md." },
      { status: 503 }
    );
  }

  if (!cronSecret || cronSecret !== configuredCronSecret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Find all due automations
  const now = new Date();
  const staleLockBefore = new Date(now.getTime() - AUTOMATION_LOCK_TIMEOUT_MS);
  const due = await prisma.automation.findMany({
    where: {
      enabled: true,
      OR: [{ lockedAt: null }, { lockedAt: { lte: staleLockBefore } }],
      AND: [
        {
          OR: [
            { nextRun: null },
            { nextRun: { lte: now } },
          ],
        },
      ],
    },
    orderBy: { nextRun: "asc" },
    take: 20,
  });

  const results = await Promise.allSettled(due.map((a) => runAutomation(a.id)));

  const summary = results.map((r, i) => ({
    id: due[i]?.id,
    result: r.status === "fulfilled" ? r.value : { ok: false, message: String(r.reason) },
  }));

  return NextResponse.json({ ran: due.length, summary });
}
