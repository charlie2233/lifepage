import { expect, test } from "@playwright/test";
import { createTestUser, registerAndLogin } from "./support/auth";

const ALPHA_URL = "https://fixtures.lifepage.test/project-alpha";
const ALPHA_UPDATED_URL = "https://fixtures.lifepage.test/project-alpha-updated";
const NO_SCREENSHOT_URL = "https://fixtures.lifepage.test/project-noscreenshot";

test("crawls proof, dedupes recrawls, generates a profile, and gates public access", async ({
  page,
}) => {
  const user = createTestUser("content");
  await registerAndLogin(page, user);

  const request = page.context().request;

  const firstCrawl = await request.post("/api/crawl", {
    data: { urls: [ALPHA_URL] },
  });
  expect(firstCrawl.ok()).toBeTruthy();
  const firstCrawlData = (await firstCrawl.json()) as {
    items?: Array<{ title?: string | null }>;
  };
  expect(firstCrawlData.items?.[0]?.title).toBe("Project Alpha");

  const secondCrawl = await request.post("/api/crawl", {
    data: { urls: [ALPHA_UPDATED_URL] },
  });
  expect(secondCrawl.ok()).toBeTruthy();

  const thirdCrawl = await request.post("/api/crawl", {
    data: { urls: [NO_SCREENSHOT_URL] },
  });
  expect(thirdCrawl.ok()).toBeTruthy();

  const evidenceRes = await request.get("/api/evidence");
  expect(evidenceRes.ok()).toBeTruthy();
  const evidenceData = (await evidenceRes.json()) as {
    items: Array<{
      title?: string | null;
      canonicalUrl?: string | null;
      crawlStatus?: string | null;
      screenshotStatus?: string | null;
      screenshotError?: string | null;
    }>;
  };

  expect(evidenceData.items).toHaveLength(2);
  expect(
    evidenceData.items.find(
      (item) => item.canonicalUrl === "https://fixtures.lifepage.test/project-alpha"
    )?.title
  ).toBe("Project Alpha Updated");
  expect(
    evidenceData.items.find(
      (item) =>
        item.canonicalUrl === "https://fixtures.lifepage.test/project-noscreenshot"
    )?.crawlStatus
  ).toBe("partial");
  expect(
    evidenceData.items.find(
      (item) =>
        item.canonicalUrl === "https://fixtures.lifepage.test/project-noscreenshot"
    )?.screenshotStatus
  ).toBe("failed");

  const generateRes = await request.post("/api/generate", {
    data: {
      userInfo: {
        name: user.name,
      },
    },
  });
  expect(generateRes.ok()).toBeTruthy();

  await page.goto(`/u/${user.username}`);
  await expect(
    page.getByRole("heading", { name: "Project Alpha Updated", exact: true })
  ).toBeVisible();

  const resumeRes = await request.get(`/api/resume?username=${user.username}`);
  expect(resumeRes.ok()).toBeTruthy();
  expect(resumeRes.headers()["content-type"]).toContain("application/pdf");
  const resumeBuffer = await resumeRes.body();
  expect(resumeBuffer.byteLength).toBeGreaterThan(200);

  const privacyRes = await request.patch("/api/settings", {
    data: { visibility: "private" },
  });
  expect(privacyRes.ok()).toBeTruthy();

  const privatePage = await request.get(`/u/${user.username}`);
  expect(privatePage.status()).toBe(404);

  const privateResume = await request.get(`/api/resume?username=${user.username}`);
  expect(privateResume.status()).toBe(404);
});
