export interface ConfigStatus {
  configured: boolean;
  group: string;
  invalid: string[];
  message: string;
  missing: string[];
}

function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function normalizeUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`must use http:// or https://, received ${value}`);
  }

  return url.toString().replace(/\/$/, "");
}

function buildStatus(
  group: string,
  options: {
    invalid?: string[];
    missing?: string[];
  }
): ConfigStatus {
  const invalid = options.invalid ?? [];
  const missing = options.missing ?? [];
  const problems = [
    missing.length > 0 ? `missing ${missing.join(", ")}` : null,
    ...invalid,
  ].filter(Boolean) as string[];

  return {
    configured: problems.length === 0,
    group,
    invalid,
    missing,
    message:
      problems.length === 0
        ? `${group} is configured.`
        : `${group} is misconfigured: ${problems.join("; ")}. See SECRETS.md.`,
  };
}

function getConfiguredAuthSecret() {
  return readEnv("AUTH_SECRET") ?? readEnv("NEXTAUTH_SECRET");
}

export function getRequiredEnvVar(name: string, consumer: string) {
  const value = readEnv(name);
  if (!value) {
    throw new Error(`${consumer} requires ${name} to be configured. See SECRETS.md.`);
  }

  return value;
}

export function getAppBaseUrlConfigStatus() {
  const candidate =
    readEnv("AUTH_URL") ??
    readEnv("NEXTAUTH_URL") ??
    readEnv("NEXT_PUBLIC_APP_URL") ??
    readEnv("APP_URL");

  if (!candidate) {
    return buildStatus("App base URL", {
      missing: ["AUTH_URL (preferred) or NEXTAUTH_URL"],
    });
  }

  try {
    normalizeUrl(candidate);
    return buildStatus("App base URL", {});
  } catch (error) {
    return buildStatus("App base URL", {
      invalid: [
        `AUTH_URL (or NEXTAUTH_URL) ${error instanceof Error ? error.message : "is invalid"}`,
      ],
    });
  }
}

export function getConfiguredAppBaseUrl() {
  const candidate =
    readEnv("AUTH_URL") ??
    readEnv("NEXTAUTH_URL") ??
    readEnv("NEXT_PUBLIC_APP_URL") ??
    readEnv("APP_URL");

  if (!candidate) return null;

  try {
    return normalizeUrl(candidate);
  } catch {
    return null;
  }
}

export function getRequiredAppBaseUrl(args?: {
  consumer?: string;
  request?: Request;
}) {
  const configured = getConfiguredAppBaseUrl();
  if (configured) {
    return configured;
  }

  if (args?.request && process.env.NODE_ENV !== "production") {
    return new URL(args.request.url).origin;
  }

  const consumer = args?.consumer ?? "LifePage";
  throw new Error(
    `${consumer} requires AUTH_URL (preferred) or NEXTAUTH_URL to be set to the public base URL. ${getAppBaseUrlConfigStatus().message}`
  );
}

export function getRequiredAuthSecret(consumer: string) {
  const secret = getConfiguredAuthSecret();
  if (!secret) {
    throw new Error(
      `${consumer} requires AUTH_SECRET (preferred) or NEXTAUTH_SECRET to be configured. See SECRETS.md.`
    );
  }

  return secret;
}

export function getCoreRuntimeConfigStatus() {
  const missing = [
    !readEnv("DATABASE_URL") ? "DATABASE_URL" : null,
    !getConfiguredAuthSecret()
      ? "AUTH_SECRET (preferred) or NEXTAUTH_SECRET"
      : null,
    !readEnv("OPENAI_API_KEY") ? "OPENAI_API_KEY" : null,
    !readEnv("CRON_SECRET") ? "CRON_SECRET" : null,
  ].filter(Boolean) as string[];

  const baseUrlStatus = getAppBaseUrlConfigStatus();
  return buildStatus("LifePage core runtime", {
    missing: [...missing, ...baseUrlStatus.missing],
    invalid: [...baseUrlStatus.invalid],
  });
}

export function assertCoreRuntimeConfig() {
  const status = getCoreRuntimeConfigStatus();
  if (!status.configured) {
    throw new Error(status.message);
  }
}

export function getStripeBillingConfigStatus() {
  if (process.env.E2E_TEST_MODE === "1" && process.env.E2E_FAKE_STRIPE === "1") {
    return buildStatus("Stripe billing", {});
  }

  return buildStatus("Stripe billing", {
    missing: [
      !readEnv("STRIPE_SECRET_KEY") ? "STRIPE_SECRET_KEY" : null,
      !readEnv("STRIPE_WEBHOOK_SECRET") ? "STRIPE_WEBHOOK_SECRET" : null,
      !readEnv("STRIPE_PLUS_MONTHLY_PRICE_ID") ? "STRIPE_PLUS_MONTHLY_PRICE_ID" : null,
      !readEnv("STRIPE_PLUS_YEARLY_PRICE_ID") ? "STRIPE_PLUS_YEARLY_PRICE_ID" : null,
      !readEnv("STRIPE_PRO_MONTHLY_PRICE_ID") ? "STRIPE_PRO_MONTHLY_PRICE_ID" : null,
      !readEnv("STRIPE_PRO_YEARLY_PRICE_ID") ? "STRIPE_PRO_YEARLY_PRICE_ID" : null,
      ...getAppBaseUrlConfigStatus().missing,
    ].filter(Boolean) as string[],
    invalid: [...getAppBaseUrlConfigStatus().invalid],
  });
}

export function getCloudflareSaasConfigStatus() {
  if (process.env.E2E_TEST_MODE === "1" && process.env.E2E_FAKE_CLOUDFLARE === "1") {
    return buildStatus("Cloudflare for SaaS", {});
  }

  return buildStatus("Cloudflare for SaaS", {
    missing: [
      !readEnv("CLOUDFLARE_API_TOKEN") ? "CLOUDFLARE_API_TOKEN" : null,
      !readEnv("CLOUDFLARE_SAAS_ZONE_ID") ? "CLOUDFLARE_SAAS_ZONE_ID" : null,
      !readEnv("CLOUDFLARE_SAAS_CNAME_TARGET")
        ? "CLOUDFLARE_SAAS_CNAME_TARGET"
        : null,
      !readEnv("CLOUDFLARE_SAAS_FALLBACK_ORIGIN")
        ? "CLOUDFLARE_SAAS_FALLBACK_ORIGIN"
        : null,
    ].filter(Boolean) as string[],
  });
}

export function getR2ConfigStatus() {
  const hasEndpoint = Boolean(readEnv("R2_ENDPOINT") ?? readEnv("R2_ACCOUNT_ID"));

  return buildStatus("Cloudflare R2", {
    missing: [
      !readEnv("R2_ACCESS_KEY_ID") ? "R2_ACCESS_KEY_ID" : null,
      !readEnv("R2_SECRET_ACCESS_KEY") ? "R2_SECRET_ACCESS_KEY" : null,
      !readEnv("R2_BUCKET") ? "R2_BUCKET" : null,
      !readEnv("R2_PUBLIC_BASE_URL") ? "R2_PUBLIC_BASE_URL" : null,
      !hasEndpoint ? "R2_ENDPOINT or R2_ACCOUNT_ID" : null,
    ].filter(Boolean) as string[],
  });
}

export function getCloudflareBrowserRenderingConfigStatus() {
  return buildStatus("Cloudflare Browser Rendering", {
    missing: [
      !readEnv("CLOUDFLARE_ACCOUNT_ID") ? "CLOUDFLARE_ACCOUNT_ID" : null,
      !readEnv("CLOUDFLARE_BROWSER_RENDERING_TOKEN")
        ? "CLOUDFLARE_BROWSER_RENDERING_TOKEN"
        : null,
    ].filter(Boolean) as string[],
  });
}
