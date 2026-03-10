import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PLAN_INTERVALS } from "@/lib/billing";
import {
  getBillingRedirectUrl,
  isStripeBillingConfigured,
} from "@/lib/stripe-billing";
import { z } from "zod";

export const runtime = "nodejs";

const CheckoutSchema = z.object({
  planTier: z.enum(["plus", "pro"]),
  interval: z.enum(PLAN_INTERVALS).default("month"),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isStripeBillingConfigured()) {
    return NextResponse.json(
      { error: "Stripe billing is not configured." },
      { status: 503 }
    );
  }

  const body = (await req.json().catch(() => null)) as unknown;
  const parsed = CheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid billing selection." },
      { status: 400 }
    );
  }

  try {
    const url = await getBillingRedirectUrl({
      userId: session.user.id,
      request: req,
      planTier: parsed.data.planTier,
      interval: parsed.data.interval,
    });

    return NextResponse.json({ url, checkoutUrl: url });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create checkout session.",
      },
      { status: 400 }
    );
  }
}
