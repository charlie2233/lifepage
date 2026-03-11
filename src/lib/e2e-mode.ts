import crypto from "node:crypto";
import { ProfileJSONSchema, type ProfileJSON } from "@/lib/schema";
import type { CrawlResult } from "@/lib/crawler";

export interface E2ECrawlFixture {
  canonicalUrl: string;
  title: string;
  description: string;
  headings: string[];
  links?: string[];
  bodyText: string;
  screenshot: string | null;
  screenshotError: string | null;
  metadata?: Record<string, string>;
}

export interface E2ECustomDomainFixture {
  hostname: string;
  dnsVerified: boolean;
  createConflict?: boolean;
  refreshStatus: string;
  refreshSslStatus: string;
}

const E2E_CRAWL_FIXTURES: Record<string, E2ECrawlFixture> = {
  "https://fixtures.lifepage.test/project-alpha": {
    canonicalUrl: "https://fixtures.lifepage.test/project-alpha",
    title: "Project Alpha",
    description:
      "A shipped AI portfolio workflow that imports proof and publishes a public page.",
    headings: ["Project Alpha", "Shipped workflow", "Portfolio proof"],
    links: ["https://github.com/example/project-alpha"],
    bodyText:
      "Project Alpha is a shipped portfolio workflow built with Next.js, TypeScript, Prisma, and Stripe. It imports proof, generates a public narrative, and publishes a resume-ready profile for builders and students.",
    screenshot:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7Z0VQAAAAASUVORK5CYII=",
    screenshotError: null,
    metadata: {
      "og:type": "website",
      "og:site_name": "LifePage Fixtures",
    },
  },
  "https://fixtures.lifepage.test/project-alpha-updated": {
    canonicalUrl: "https://fixtures.lifepage.test/project-alpha",
    title: "Project Alpha Updated",
    description:
      "An updated crawl snapshot for the same canonical project URL.",
    headings: ["Project Alpha Updated", "Regression-safe import"],
    links: ["https://github.com/example/project-alpha"],
    bodyText:
      "Project Alpha now includes stronger release gates, safer billing sync, and better custom domain handling. This fixture is used to prove recrawls update existing evidence instead of creating duplicates.",
    screenshot:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7Z0VQAAAAASUVORK5CYII=",
    screenshotError: null,
    metadata: {
      "og:type": "article",
      "og:site_name": "LifePage Fixtures",
    },
  },
  "https://fixtures.lifepage.test/project-noscreenshot": {
    canonicalUrl: "https://fixtures.lifepage.test/project-noscreenshot",
    title: "Project No Screenshot",
    description:
      "A fixture that returns content successfully while screenshot capture fails.",
    headings: ["Project No Screenshot", "Partial crawl"],
    links: ["https://github.com/example/project-noscreenshot"],
    bodyText:
      "This fixture simulates a successful HTML crawl with a failed screenshot capture so the app can surface partial-success evidence imports.",
    screenshot: null,
    screenshotError: "Synthetic screenshot failure for E2E tests.",
    metadata: {
      "og:type": "website",
      "og:site_name": "LifePage Fixtures",
    },
  },
};

const E2E_CUSTOM_DOMAIN_FIXTURES: Record<string, E2ECustomDomainFixture> = {
  "wrong-dns.e2e.lifepage.test": {
    hostname: "wrong-dns.e2e.lifepage.test",
    dnsVerified: false,
    refreshStatus: "active",
    refreshSslStatus: "active",
  },
  "pending-ssl.e2e.lifepage.test": {
    hostname: "pending-ssl.e2e.lifepage.test",
    dnsVerified: true,
    refreshStatus: "active",
    refreshSslStatus: "pending_validation",
  },
  "active-domain.e2e.lifepage.test": {
    hostname: "active-domain.e2e.lifepage.test",
    dnsVerified: true,
    refreshStatus: "active",
    refreshSslStatus: "active",
  },
  "duplicate-domain.e2e.lifepage.test": {
    hostname: "duplicate-domain.e2e.lifepage.test",
    dnsVerified: true,
    createConflict: true,
    refreshStatus: "active",
    refreshSslStatus: "active",
  },
};

function normalizeKey(value: string) {
  return value.trim().toLowerCase().replace(/\/+$/, "");
}

export function isE2ETestMode() {
  return process.env.E2E_TEST_MODE === "1";
}

export function isFakeStripeEnabled() {
  return isE2ETestMode() && process.env.E2E_FAKE_STRIPE === "1";
}

export function isFakeCloudflareEnabled() {
  return isE2ETestMode() && process.env.E2E_FAKE_CLOUDFLARE === "1";
}

export function isFakeDnsEnabled() {
  return isE2ETestMode() && process.env.E2E_FAKE_DNS === "1";
}

export function isFakeCrawlEnabled() {
  return isE2ETestMode() && process.env.E2E_FAKE_CRAWL === "1";
}

export function isFakeAiEnabled() {
  return isE2ETestMode();
}

export function getE2ECrawlFixture(url: string) {
  const normalized = normalizeKey(url);
  return E2E_CRAWL_FIXTURES[normalized] ?? null;
}

export function getE2ECustomDomainFixture(hostname: string) {
  return E2E_CUSTOM_DOMAIN_FIXTURES[normalizeKey(hostname)] ?? null;
}

export function getE2ECustomDomainFixtures() {
  return Object.values(E2E_CUSTOM_DOMAIN_FIXTURES);
}

export function getE2ECnameValues(hostname: string, targetHost: string) {
  const fixture = getE2ECustomDomainFixture(hostname);
  if (!fixture) {
    return [] as string[];
  }

  return fixture.dnsVerified ? [targetHost] : ["wrong-target.e2e.lifepage.test"];
}

export function createE2EStripeSignature(
  payload: string,
  secret: string,
  timestamp = Math.floor(Date.now() / 1000)
) {
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");

  return `t=${timestamp},v1=${signature}`;
}

export function verifyE2EStripeSignature(
  payload: string,
  signatureHeader: string,
  secret: string
) {
  const parts = signatureHeader
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signature = parts.find((part) => part.startsWith("v1="))?.slice(3);

  if (!timestamp || !signature) {
    throw new Error("Invalid E2E Stripe signature header.");
  }

  const expected = createE2EStripeSignature(
    payload,
    secret,
    Number(timestamp)
  ).split(",")[1]?.slice(3);

  if (!expected) {
    throw new Error("Failed to compute expected E2E Stripe signature.");
  }

  const provided = Buffer.from(signature);
  const actual = Buffer.from(expected);
  if (
    provided.length !== actual.length ||
    !crypto.timingSafeEqual(provided, actual)
  ) {
    throw new Error("Invalid E2E Stripe signature.");
  }
}

function slugToLabel(input: string) {
  return input
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildProjectProfile(args: {
  title: string;
  description: string;
  bodyText: string;
  url: string;
}): ProfileJSON {
  const projectTitle = slugToLabel(args.title || "Project Alpha");
  const about =
    args.description ||
    "A deterministic E2E-generated profile based on imported proof.";

  return ProfileJSONSchema.parse({
    headline: `${projectTitle} Builder`,
    about,
    skills: [
      { tag: "Next.js", level: "advanced", evidenceRefs: [args.url] },
      { tag: "TypeScript", level: "advanced", evidenceRefs: [args.url] },
      { tag: "Prisma", level: "intermediate", evidenceRefs: [args.url] },
    ],
    experiences: [
      {
        role: "Founder",
        org: "LifePage Labs",
        startDate: "2024",
        endDate: null,
        bullets: [
          `Shipped ${projectTitle} with deterministic test coverage and release gates.`,
          "Turned imported web proof into a public portfolio and resume workflow.",
        ],
        evidenceRefs: [args.url],
      },
    ],
    projects: [
      {
        title: projectTitle,
        problem: "People need a portfolio grounded in real proof.",
        approach:
          "Import web evidence, synthesize it into structured narrative data, and publish a public portfolio.",
        impact: args.bodyText.slice(0, 180),
        tech: ["Next.js", "TypeScript", "Prisma", "Stripe"],
        links: [{ label: "Source", url: args.url }],
        media: [],
        evidenceRefs: [args.url],
      },
    ],
    achievements: [
      {
        title: `${projectTitle} launched`,
        context: "Deterministic E2E fixture output",
        date: "2026",
        proof: args.url,
      },
    ],
    timeline: [
      {
        year: "2026",
        milestones: [
          `Imported evidence from ${new URL(args.url).hostname}.`,
          `Generated a public narrative for ${projectTitle}.`,
        ],
      },
    ],
    resume: {
      summary: `${projectTitle} is a release-gated portfolio workflow grounded in shipped proof.`,
      bullets: [
        `Built ${projectTitle} on top of imported evidence instead of manual claims.`,
        "Added billing, custom domain, crawl, and public-page safety checks.",
      ],
    },
    stats: {
      projectsShipped: 1,
      yearsBuilding: 2,
      competitions: 0,
    },
    confidence: 0.92,
  });
}

export function buildE2EProfileFromCrawl(crawlResults: CrawlResult[]) {
  const primary = crawlResults[0];
  if (!primary) {
    return buildProjectProfile({
      title: "LifePage",
      description: "Deterministic E2E profile with no crawl data.",
      bodyText: "Deterministic E2E profile with no crawl data.",
      url: "https://fixtures.lifepage.test/project-alpha",
    });
  }

  return buildProjectProfile({
    title: primary.title,
    description: primary.description,
    bodyText: primary.bodyText,
    url: primary.url,
  });
}

export function buildE2EProfileFromText(text: string, userName?: string) {
  return ProfileJSONSchema.parse({
    headline: `${userName ?? "LifePage"} Builder`,
    about: text,
    skills: [
      { tag: "Writing", level: "advanced", evidenceRefs: [] },
      { tag: "Storytelling", level: "advanced", evidenceRefs: [] },
    ],
    experiences: [],
    projects: [
      {
        title: "Text Seeded Portfolio",
        problem: "Turn a written bio into a structured portfolio.",
        approach: "Use deterministic E2E profile generation.",
        impact: text.slice(0, 180),
        tech: ["Next.js", "TypeScript"],
        links: [],
        media: [],
        evidenceRefs: [],
      },
    ],
    achievements: [],
    timeline: [
      {
        year: "2026",
        milestones: ["Generated a profile from text-only input."],
      },
    ],
    resume: {
      summary: text.slice(0, 180),
      bullets: ["Generated a structured profile from text input."],
    },
    stats: {
      projectsShipped: 1,
      yearsBuilding: 1,
      competitions: 0,
    },
    confidence: 0.85,
  });
}
