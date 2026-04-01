"use client";

import type { ProductEventName } from "@/lib/product-analytics";

export function trackProductEvent(
  event: ProductEventName,
  metadata?: Record<string, unknown>
) {
  const payload = JSON.stringify({
    event,
    metadata,
    path:
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : undefined,
    referrer:
      typeof document !== "undefined" && document.referrer
        ? document.referrer
        : undefined,
  });

  if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
    try {
      const sent = navigator.sendBeacon(
        "/api/analytics",
        new Blob([payload], { type: "application/json" })
      );
      if (sent) {
        return;
      }
    } catch {
      // Fall through to fetch.
    }
  }

  void fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  });
}
