function normalizeBaseUrl(value: string | null | undefined) {
  const raw = value?.trim();
  if (!raw) return null;
  const withProtocol = /^[a-z]+:\/\//i.test(raw) ? raw : `https://${raw}`;
  return withProtocol.replace(/\/$/, "");
}

export function getAppBaseUrl() {
  return normalizeBaseUrl(
    process.env.AUTH_URL ??
      process.env.NEXTAUTH_URL ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.APP_URL ??
      process.env.VERCEL_PROJECT_PRODUCTION_URL ??
      process.env.VERCEL_BRANCH_URL ??
      process.env.VERCEL_URL
  );
}
