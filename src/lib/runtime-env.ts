function normalizeBaseUrl(value: string | null | undefined) {
  const raw = value?.trim();
  if (!raw) return null;
  return raw.replace(/\/$/, "");
}

export function getAppBaseUrl() {
  return normalizeBaseUrl(
    process.env.AUTH_URL ??
      process.env.NEXTAUTH_URL ??
      process.env.NEXT_PUBLIC_APP_URL
  );
}
