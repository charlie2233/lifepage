import { expect, test } from "@playwright/test";

test("marketing and public routes load", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /Turn scattered proof into a brand people can trust/i,
    })
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Start free/i }).first()
  ).toBeVisible();

  await page.goto("/register");
  await expect(
    page.getByText(/You will sign in next, import proof/i)
  ).toBeVisible();
  await expect(
    page.getByText(/lifepage.one\/u\/yourhandle/i)
  ).toBeVisible();

  await page.goto("/explore");
  await expect(
    page.getByRole("heading", {
      name: /Browse public brand sites that already feel shipped/i,
    })
  ).toBeVisible();

  await page.goto("/u/alexchen");
  await expect(
    page.getByRole("heading", { name: /Alex Chen/i })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Copy link/i })
  ).toBeVisible();
  await expect(page.getByText(/Brand snapshot/i)).toBeVisible();

  await page.goto("/u/alexchen/resume");
  await expect(page.getByText(/Download PDF/i)).toBeVisible();
  await expect(
    page.getByText(/Share-ready/i)
  ).toBeVisible();
  await expect(
    page.getByText(/Resume model/i)
  ).toBeVisible();
});
