import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  productAnalyticsPayloadSchema,
  recordProductAnalyticsEvent,
} from "@/lib/product-analytics";

export async function POST(req: Request) {
  try {
    const payload = productAnalyticsPayloadSchema.parse(await req.json());
    const session = await auth();

    await recordProductAnalyticsEvent({
      event: payload.event,
      metadata: payload.metadata,
      path: payload.path ?? new URL(req.url).pathname,
      sessionId: payload.sessionId,
      source: payload.source ?? "client",
      userId: session?.user?.id ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Metrics capture failed:", error);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
