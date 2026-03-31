import { defineConfig } from "@playwright/test";
import { getE2EAppEnv, getE2EBaseUrl } from "./e2e/support/runtime";

const baseURL = getE2EBaseUrl();
const baseHost = new URL(baseURL).hostname;
const basePort = new URL(baseURL).port || "3001";
const serverCommand =
  process.env.E2E_SERVER_COMMAND ??
  `npx next dev --webpack --hostname ${baseHost} --port ${basePort}`;
const serverTimeout = Number(process.env.E2E_SERVER_TIMEOUT ?? "120000");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  globalSetup: "./e2e/global.setup.ts",
  reporter: process.env.CI
    ? [["line"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  workers: process.env.CI ? 1 : undefined,
  webServer: {
    command: serverCommand,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: serverTimeout,
    env: getE2EAppEnv(),
  },
});
