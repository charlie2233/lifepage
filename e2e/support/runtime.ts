const DEFAULT_BASE_URL = "http://localhost:3001";

function getEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

export function getE2EBaseUrl() {
  return getEnv("E2E_BASE_URL") ?? DEFAULT_BASE_URL;
}

export function getTestDatabaseUrl() {
  return getEnv("TEST_DATABASE_URL") ?? getEnv("DATABASE_URL");
}

export function requireTestDatabaseUrl() {
  const databaseUrl = getTestDatabaseUrl();
  if (!databaseUrl) {
    throw new Error(
      "Set TEST_DATABASE_URL or DATABASE_URL before running Playwright E2E tests."
    );
  }

  return databaseUrl;
}

export function getE2EAppEnv() {
  const baseUrl = getE2EBaseUrl();
  const databaseUrl = requireTestDatabaseUrl();

  return {
    ...process.env,
    DATABASE_URL: databaseUrl,
    E2E_TEST_MODE: "1",
    E2E_BASE_URL: baseUrl,
    E2E_FAKE_STRIPE: process.env.E2E_FAKE_STRIPE ?? "1",
    E2E_FAKE_CLOUDFLARE: process.env.E2E_FAKE_CLOUDFLARE ?? "1",
    E2E_FAKE_DNS: process.env.E2E_FAKE_DNS ?? "1",
    E2E_FAKE_CRAWL: process.env.E2E_FAKE_CRAWL ?? "1",
    AUTH_SECRET: process.env.AUTH_SECRET ?? "e2e-auth-secret",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? "e2e-nextauth-secret",
    AUTH_URL: process.env.AUTH_URL ?? baseUrl,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? baseUrl,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "e2e-openai-key",
    CRON_SECRET: process.env.CRON_SECRET ?? "e2e-cron-secret",
    STRIPE_WEBHOOK_SECRET:
      process.env.STRIPE_WEBHOOK_SECRET ?? "whsec_e2e_secret",
    STRIPE_PLUS_MONTHLY_PRICE_ID:
      process.env.STRIPE_PLUS_MONTHLY_PRICE_ID ?? "price_e2e_plus_monthly",
    STRIPE_PLUS_YEARLY_PRICE_ID:
      process.env.STRIPE_PLUS_YEARLY_PRICE_ID ?? "price_e2e_plus_yearly",
    STRIPE_PRO_MONTHLY_PRICE_ID:
      process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? "price_e2e_pro_monthly",
    STRIPE_PRO_YEARLY_PRICE_ID:
      process.env.STRIPE_PRO_YEARLY_PRICE_ID ?? "price_e2e_pro_yearly",
    CLOUDFLARE_SAAS_CNAME_TARGET:
      process.env.CLOUDFLARE_SAAS_CNAME_TARGET ??
      "customers.e2e.lifepage.test",
    CLOUDFLARE_SAAS_FALLBACK_ORIGIN:
      process.env.CLOUDFLARE_SAAS_FALLBACK_ORIGIN ??
      "origin.e2e.lifepage.test",
  };
}
