export function logCustomDomainEvent(
  event: string,
  details: Record<string, unknown>
) {
  console.info(
    "[atrak-pages custom domain]",
    JSON.stringify({
      event,
      at: new Date().toISOString(),
      ...details,
    })
  );
}
