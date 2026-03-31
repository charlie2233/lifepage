"use client";

import { z } from "zod";
import {
  clientTrackedEventSchema,
} from "@/lib/product-analytics";

const STORAGE_KEY = "lifepage.analytics.session";

function createSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `lp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getAnalyticsSessionId() {
  if (typeof window === "undefined") {
    return null;
  }

  const existing = window.sessionStorage.getItem(STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const sessionId = createSessionId();
  window.sessionStorage.setItem(STORAGE_KEY, sessionId);
  return sessionId;
}

export async function trackClientEvent(input: {
  event: z.infer<typeof clientTrackedEventSchema>;
  metadata?: Record<string, string | number | boolean | null | string[]>;
  path?: string;
  source?: string;
}) {
  if (typeof window === "undefined") {
    return;
  }

  const payload = JSON.stringify({
    event: input.event,
    metadata: input.metadata,
    path: input.path ?? window.location.pathname,
    sessionId: getAnalyticsSessionId(),
    source: input.source,
  });

  if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
    const blob = new Blob([payload], { type: "application/json" });
    if (navigator.sendBeacon("/api/metrics", blob)) {
      return;
    }
  }

  await fetch("/api/metrics", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: payload,
    keepalive: true,
  }).catch(() => undefined);
}
