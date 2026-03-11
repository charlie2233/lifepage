import { expect, type Page } from "@playwright/test";

export interface E2ETestUser {
  name: string;
  username: string;
  email: string;
  password: string;
}

export function createTestUser(prefix: string): E2ETestUser {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    name: `${prefix} User`,
    username: `${prefix}-${suffix}`.replace(/[^a-z0-9_-]/gi, "").toLowerCase(),
    email: `${prefix}-${suffix}@example.com`.toLowerCase(),
    password: "password123",
  };
}

export async function registerAndLogin(page: Page, user: E2ETestUser) {
  await page.goto("/register");
  await page.locator('input[placeholder="Your Name"]').fill(user.name);
  await page.locator('input[placeholder="yourhandle"]').fill(user.username);
  await page.locator('input[placeholder="you@example.com"]').fill(user.email);
  await page.locator('input[placeholder="••••••••"]').fill(user.password);
  await page.getByRole("button", { name: "Create Account" }).click();
  await page.waitForURL(/\/login/);

  await page.locator('input[placeholder="you@example.com"]').fill(user.email);
  await page.locator('input[placeholder="••••••••"]').fill(user.password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL(/\/dashboard/);
  await expect(page.getByText("Import sources")).toBeVisible();
}
