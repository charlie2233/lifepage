"use client";

import { useEffect, useRef } from "react";
import { trackProductEvent } from "@/lib/analytics-client";
import type { ProductEventName } from "@/lib/product-analytics";

interface TrackPageViewProps {
  event: ProductEventName;
  metadata?: Record<string, unknown>;
}

export function TrackPageView({ event, metadata }: TrackPageViewProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) {
      return;
    }

    tracked.current = true;
    trackProductEvent(event, metadata);
  }, [event, metadata]);

  return null;
}
