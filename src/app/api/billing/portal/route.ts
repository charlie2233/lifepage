import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  createStripePortalUrl,
  isStripeBillingConfigured,
} from "@/lib/stripe-billing";

export const runtime = "nodejs";

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

  try {
    const url = await createStripePortalUrl({
      userId: session.user.id,
      request: req,
    });

    return NextResponse.json({ url, portalUrl: url });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create billing portal session.",
      },
      { status: 400 }
    );
  }
}
