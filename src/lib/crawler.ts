import axios from "axios";
import * as cheerio from "cheerio";

export interface CrawlResult {
  url: string;
  title: string;
  description: string;
  ogImage: string | null;
  headings: string[];
  links: string[];
  bodyText: string;
  screenshot: string | null;
  metadata: Record<string, string>;
}

export async function crawlUrl(url: string): Promise<CrawlResult> {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  let html = "";
  let screenshot: string | null = null;

  try {
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; LifePageBot/1.0; +https://lifepage.atrak.dev)",
      },
    });
    html = response.data as string;
  } catch (err) {
    throw new Error(`Failed to fetch ${url}: ${String(err)}`);
  }

  try {
    screenshot = await takeScreenshot(url);
  } catch {
    screenshot = null;
  }

  const $ = cheerio.load(html);

  const title =
    $("title").text().trim() ||
    $('meta[property="og:title"]').attr("content") ||
    "";
  const description =
    $('meta[name="description"]').attr("content") ||
    $('meta[property="og:description"]').attr("content") ||
    "";
  const ogImage =
    $('meta[property="og:image"]').attr("content") ||
    $('meta[name="twitter:image"]').attr("content") ||
    null;

  const headings: string[] = [];
  $("h1, h2, h3").each((_, el) => {
    const text = $(el).text().trim();
    if (text) headings.push(text);
  });

  const links: string[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    if (href.startsWith("http") && !href.toLowerCase().startsWith("javascript:")) {
      links.push(href);
    }
  });

  $("script, style, nav, footer, header").remove();
  const bodyText = $("body").text().replace(/\s+/g, " ").trim().slice(0, 5000);

  const metadata: Record<string, string> = {};
  $("meta").each((_, el) => {
    const name =
      $(el).attr("name") ||
      $(el).attr("property") ||
      $(el).attr("itemprop") ||
      "";
    const content = $(el).attr("content") || "";
    if (name && content) metadata[name] = content;
  });

  return {
    url,
    title,
    description,
    ogImage,
    headings: headings.slice(0, 20),
    links: links.slice(0, 30),
    bodyText,
    screenshot,
    metadata,
  };
}

async function takeScreenshot(url: string): Promise<string | null> {
  try {
    const puppeteer = await import("puppeteer-core");
    const chromium = await import("@sparticuz/chromium");

    const browser = await puppeteer.default.launch({
      args: chromium.default.args,
      executablePath: await chromium.default.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(url, { waitUntil: "networkidle2", timeout: 20000 });
    const screenshotBuffer = await page.screenshot({
      encoding: "base64",
      type: "jpeg",
      quality: 70,
    });
    await browser.close();

    return `data:image/jpeg;base64,${screenshotBuffer}`;
  } catch {
    return null;
  }
}
