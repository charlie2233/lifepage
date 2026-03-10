import { NextResponse } from "next/server";
import {
  constructStripeWebhookEvent,
  isStripeBillingConfigured,
  syncCheckoutSessionToBilling,
  syncStripeInvoiceToBilling,
  syncStripeSubscriptionToBilling,
} from "@/lib/stripe-billing";

export async function POST(req: Request) {
  if (!isStripeBillingConfigured()) {
    return NextResponse.json(
      { error: "Stripe billing is not configured." },
      { status: 503 }
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature header." },
      { status: 400 }
    );
  }

  const payload = await req.text();

  try {
    const event = constructStripeWebhookEvent(payload, signature);

    switch (event.type) {
      case "checkout.session.completed":
        await syncCheckoutSessionToBilling(event.data.object);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncStripeSubscriptionToBilling(event.data.object);
        break;
      case "invoice.paid":
      case "invoice.payment_failed":
        await syncStripeInvoiceToBilling(event.data.object);
        break;
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Stripe webhook verification failed.",
      },
      { status: 400 }
    );
  }
}
