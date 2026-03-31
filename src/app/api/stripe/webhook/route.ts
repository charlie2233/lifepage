import { NextResponse } from "next/server";
import { getStripeBillingConfigStatus } from "@/lib/runtime-config";
import {
  constructStripeWebhookEvent,
  getStripeWebhookReferences,
  isStripeBillingConfigured,
  markStripeWebhookEventFailed,
  markStripeWebhookEventProcessed,
  reserveStripeWebhookEvent,
  syncCheckoutSessionToBilling,
  syncStripeInvoiceToBilling,
  syncStripeSubscriptionToBilling,
} from "@/lib/stripe-billing";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isStripeBillingConfigured()) {
    return NextResponse.json(
      { error: getStripeBillingConfigStatus().message },
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
    const reservation = await reserveStripeWebhookEvent(event);
    if (!reservation.shouldProcess) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    let syncResult: Awaited<
      ReturnType<
        | typeof syncCheckoutSessionToBilling
        | typeof syncStripeSubscriptionToBilling
        | typeof syncStripeInvoiceToBilling
      >
    > = null;

    try {
      switch (event.type) {
        case "checkout.session.completed":
          syncResult = await syncCheckoutSessionToBilling(event.data.object);
          break;
        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted":
          syncResult = await syncStripeSubscriptionToBilling(event.data.object);
          break;
        case "invoice.paid":
        case "invoice.payment_failed":
          syncResult = await syncStripeInvoiceToBilling(event.data.object);
          break;
        default:
          break;
      }
    } catch (error) {
      await markStripeWebhookEventFailed({
        eventId: event.id,
        error,
      });
      throw error;
    }

    const refs = getStripeWebhookReferences(event);
    await markStripeWebhookEventProcessed({
      eventId: event.id,
      userId: syncResult?.userId ?? null,
      stripeCustomerId: refs.stripeCustomerId,
      stripeSubscriptionId: refs.stripeSubscriptionId,
    });

    return NextResponse.json({ received: true, duplicate: false });
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
