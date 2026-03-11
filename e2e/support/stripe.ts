import type { APIRequestContext } from "@playwright/test";
import { createE2EStripeSignature } from "../../src/lib/e2e-mode";

function getWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET ?? "whsec_e2e_secret";
}

function getPriceId(planTier: "plus" | "pro", interval: "month" | "year") {
  if (planTier === "plus" && interval === "month") {
    return process.env.STRIPE_PLUS_MONTHLY_PRICE_ID ?? "price_e2e_plus_monthly";
  }
  if (planTier === "plus" && interval === "year") {
    return process.env.STRIPE_PLUS_YEARLY_PRICE_ID ?? "price_e2e_plus_yearly";
  }
  if (planTier === "pro" && interval === "month") {
    return process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? "price_e2e_pro_monthly";
  }

  return process.env.STRIPE_PRO_YEARLY_PRICE_ID ?? "price_e2e_pro_yearly";
}

export function buildFakeSubscription(args: {
  userId: string;
  customerId: string;
  subscriptionId: string;
  planTier: "plus" | "pro";
  interval: "month" | "year";
  status?: string;
  cancelAtPeriodEnd?: boolean;
}) {
  const priceId = getPriceId(args.planTier, args.interval);
  const now = Math.floor(Date.now() / 1000);

  return {
    id: args.subscriptionId,
    object: "subscription",
    customer: args.customerId,
    status: args.status ?? "active",
    cancel_at_period_end: args.cancelAtPeriodEnd ?? false,
    current_period_start: now,
    current_period_end:
      now + (args.interval === "year" ? 60 * 60 * 24 * 365 : 60 * 60 * 24 * 30),
    metadata: {
      userId: args.userId,
      planTier: args.planTier,
      interval: args.interval,
    },
    items: {
      data: [
        {
          id: `si_${args.subscriptionId}`,
          object: "subscription_item",
          price: {
            id: priceId,
            object: "price",
            product: `prod_${args.planTier}`,
            recurring: { interval: args.interval },
          },
        },
      ],
    },
  };
}

export function buildFakeStripeEvent(type: string, object: unknown) {
  return {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    object: "event",
    type,
    livemode: false,
    created: Math.floor(Date.now() / 1000),
    data: {
      object,
    },
  };
}

export async function postFakeStripeEvent(
  request: APIRequestContext,
  event: ReturnType<typeof buildFakeStripeEvent>
) {
  const payload = JSON.stringify(event);
  const signature = createE2EStripeSignature(payload, getWebhookSecret());

  return request.post("/api/stripe/webhook", {
    data: payload,
    headers: {
      "content-type": "application/json",
      "stripe-signature": signature,
    },
  });
}
