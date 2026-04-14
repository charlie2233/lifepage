import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canonicalizeCrawlUrl } from "@/lib/crawl-state";
import { prisma } from "@/lib/db";
import { crawlUrl, expandGoogleSitesUrls, isGoogleSitesUrl } from "@/lib/crawler";
import { recordProductEvent } from "@/lib/product-analytics";
import { z } from "zod";

const schema = z.object({
  url: z.string().optional(),
  urls: z.array(z.string()).optional(),
});

function createInputError(message: string) {
  return new z.ZodError([
    {
      code: "custom",
      message,
      path: ["url"],
    },
  ]);
}

function splitCrawlInput(value: string) {
  return value
    .split(/[\n,]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function getRequestedUrls(body: z.infer<typeof schema>) {
  const requestedUrls = [
    ...(body.url ? splitCrawlInput(body.url) : []),
    ...((body.urls ?? []).flatMap(splitCrawlInput)),
  ];

  if (requestedUrls.length === 0) {
    throw createInputError(
      "Add at least one URL. A homepage, GitHub profile, or project page is a strong place to start."
    );
  }

  return requestedUrls;
}

function normalizeUrl(url: string) {
  const candidate =
    url.startsWith("http://") || url.startsWith("https://")
      ? url
      : `https://${url}`;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error(`Invalid URL: ${url}. Include the full page or domain you want Atrak Pages to import.`);
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error(`Invalid URL: ${url}. Only http and https links are supported.`);
  }

  return parsed.toString();
}

async function createEvidenceItem(
  userId: string,
  fallbackUrl: string,
  crawlResult: Awaited<ReturnType<typeof crawlUrl>>
) {
  const canonicalUrl = canonicalizeCrawlUrl(crawlResult.url || fallbackUrl);

  return prisma.evidenceItem.upsert({
    where: {
      userId_canonicalUrl: {
        userId,
        canonicalUrl,
      },
    },
    create: {
      userId,
      type: "url",
      url: crawlResult.url,
      canonicalUrl,
      title: crawlResult.title || fallbackUrl,
      description: crawlResult.description || "",
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
      canonicalUrl,
      title: crawlResult.title || fallbackUrl,
      description: crawlResult.description || "",
      screenshot: crawlResult.screenshot,
      crawlStatus: crawlResult.crawlStatus,
      screenshotStatus: crawlResult.screenshotStatus,
      screenshotError: crawlResult.screenshotError,
      rawContent: crawlResult.bodyText,
      metadata: crawlResult.metadata as object,
    },
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as unknown;
    const parsedBody = schema.parse(body);
    const requestedUrls = getRequestedUrls(parsedBody);
    await recordProductEvent({
      event: "crawl_started",
      path: "/dashboard",
      userId: session.user.id,
      metadata: {
        urlCount: requestedUrls.length,
      },
    });

    const results: Array<{
      inputUrl: string;
      url?: string;
      item?: Awaited<ReturnType<typeof prisma.evidenceItem.create>>;
      error?: string;
    }> = [];

    for (const inputUrl of requestedUrls) {
      try {
        const normalizedUrl = normalizeUrl(inputUrl);
        const rootCrawlResult = await crawlUrl(normalizedUrl);
        const discoveredUrls = isGoogleSitesUrl(normalizedUrl)
          ? expandGoogleSitesUrls(normalizedUrl, rootCrawlResult.links)
          : [normalizedUrl];

        const rootItem = await createEvidenceItem(
          session.user.id,
          normalizedUrl,
          rootCrawlResult
        );
        const crawledUrlSet = new Set<string>([
          canonicalizeCrawlUrl(normalizedUrl),
          canonicalizeCrawlUrl(rootCrawlResult.url),
        ]);

        results.push({
          inputUrl,
          url: rootCrawlResult.url,
          item: rootItem,
        });

        for (const discoveredUrl of discoveredUrls) {
          const canonicalDiscoveredUrl = canonicalizeCrawlUrl(discoveredUrl);
          if (crawledUrlSet.has(canonicalDiscoveredUrl)) {
            continue;
          }

          try {
            const crawlResult = await crawlUrl(discoveredUrl);
            const item = await createEvidenceItem(
              session.user.id,
              discoveredUrl,
              crawlResult
            );

            results.push({
              inputUrl: discoveredUrl,
              url: crawlResult.url,
              item,
            });
            crawledUrlSet.add(canonicalDiscoveredUrl);
          } catch (error) {
            results.push({
              inputUrl: discoveredUrl,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }
      } catch (error) {
        results.push({
          inputUrl,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const items = results.flatMap((result) => (result.item ? [result.item] : []));
    if (items.length === 0) {
      const errors = results
        .map((result) => result.error)
        .filter((error): error is string => Boolean(error));
      const status = errors.every((error) => error.startsWith("Invalid URL:"))
        ? 400
        : 500;
      await recordProductEvent({
        event: "crawl_failed",
        path: "/dashboard",
        userId: session.user.id,
        metadata: {
          urlCount: requestedUrls.length,
          errors: errors.slice(0, 3),
        },
      });

      return NextResponse.json(
        {
          error:
            errors.slice(0, 3).join("; ") ||
            "Atrak Pages could not import those sources. Try a different page or verify the URLs are public.",
          results,
        },
        { status }
      );
    }

    await recordProductEvent({
      event: "crawl_completed",
      path: "/dashboard",
      userId: session.user.id,
      metadata: {
        requestedUrlCount: requestedUrls.length,
        importedItemCount: items.length,
        failedItemCount: results.filter((result) => result.error).length,
      },
    });

    return NextResponse.json({
      item: items[0],
      items,
      results,
    });
  } catch (err) {
    console.error("Crawl error:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          error:
            err.issues[0]?.message ??
            "That input does not look like a valid URL list yet.",
        },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
