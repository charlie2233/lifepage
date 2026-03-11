import { expect, test } from "@playwright/test";
import { createTestUser, registerAndLogin } from "./support/auth";

test("unauthenticated dashboard requests redirect to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("registers, signs in, and keeps the dashboard session after refresh", async ({
  page,
}) => {
  const user = createTestUser("auth");

  await registerAndLogin(page, user);
  await page.reload();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText("Import sources")).toBeVisible();
});
