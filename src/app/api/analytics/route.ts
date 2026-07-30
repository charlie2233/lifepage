import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  recordProductEvent,
  type ProductEventName,
} from "@/lib/product-analytics";

const schema = z.object({
  event: z.string().min(2).max(80),
  path: z.string().max(200).optional(),
  referrer: z.string().max(500).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse((await req.json()) as unknown);
    const session = await auth();

    await recordProductEvent({
      event: body.event as ProductEventName,
      metadata: body.metadata,
      path: body.path,
      referrer: body.referrer,
      userId: session?.user?.id,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.warn("Analytics ingestion failed:", error);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
