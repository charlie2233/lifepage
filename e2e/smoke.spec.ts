import { expect, test } from "@playwright/test";

test("homepage and explore load", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Build your personal brand/i })
  ).toBeVisible();

  await page.goto("/explore");
  await expect(
    page.getByRole("heading", {
      name: /Browse public brand sites that already feel shipped/i,
    })
  ).toBeVisible();
});
