export const CRAWL_STATUSES = ["ready", "partial", "failed"] as const;
export type CrawlStatus = (typeof CRAWL_STATUSES)[number];

export const SCREENSHOT_STATUSES = [
  "ready",
  "pending",
  "failed",
  "unavailable",
] as const;
export type ScreenshotStatus = (typeof SCREENSHOT_STATUSES)[number];

export function canonicalizeCrawlUrl(url: string) {
  const parsed = new URL(url);
  parsed.hash = "";
  parsed.search = "";
  parsed.hostname = parsed.hostname.toLowerCase();
  return parsed.toString();
}

export function deriveScreenshotStatus(
  screenshot: string | null | undefined,
  error?: string | null
): ScreenshotStatus {
  if (screenshot) return "ready";
  if (error) return "failed";
  return "unavailable";
}

export function deriveCrawlStatus(args: {
  screenshot: string | null | undefined;
  screenshotError?: string | null;
}): CrawlStatus {
  if (args.screenshot) return "ready";
  if (args.screenshotError) return "partial";
  return "ready";
}
