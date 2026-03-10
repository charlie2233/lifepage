import Stripe from "stripe";
import { prisma } from "@/lib/db";
import {
  PLAN_INTERVALS,
  PLAN_TIERS,
  type BillingInterval,
  type PlanTier,
  getBillingSnapshot,
  isEntitledStripeStatus,
  syncStripeBillingState,
} from "@/lib/billing";

const PAID_PLAN_TIERS = PLAN_TIERS.filter((plan) => plan !== "free");
type PaidPlanTier = Exclude<PlanTier, "free">;

export function isStripeBillingConfigured() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_WEBHOOK_SECRET &&
      process.env.STRIPE_PLUS_MONTHLY_PRICE_ID &&
      process.env.STRIPE_PLUS_YEARLY_PRICE_ID &&
      process.env.STRIPE_PRO_MONTHLY_PRICE_ID &&
      process.env.STRIPE_PRO_YEARLY_PRICE_ID
  );
}

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  return new Stripe(secretKey);
}

function normalizeInterval(value?: string | null): BillingInterval | null {
  return value === "month" || value === "year" ? value : null;
}

function getPriceMap(): Record<PaidPlanTier, Record<BillingInterval, string>> {
  const plusMonthly = process.env.STRIPE_PLUS_MONTHLY_PRICE_ID;
  const plusYearly = process.env.STRIPE_PLUS_YEARLY_PRICE_ID;
  const proMonthly = process.env.STRIPE_PRO_MONTHLY_PRICE_ID;
  const proYearly = process.env.STRIPE_PRO_YEARLY_PRICE_ID;

  if (!plusMonthly || !plusYearly || !proMonthly || !proYearly) {
    throw new Error(
      "Stripe price ids are not fully configured. Set STRIPE_PLUS_MONTHLY_PRICE_ID, STRIPE_PLUS_YEARLY_PRICE_ID, STRIPE_PRO_MONTHLY_PRICE_ID, and STRIPE_PRO_YEARLY_PRICE_ID."
    );
  }

  return {
    plus: { month: plusMonthly, year: plusYearly },
    pro: { month: proMonthly, year: proYearly },
  };
}

export function getPriceIdForSelection(
  planTier: PaidPlanTier,
  interval: BillingInterval
) {
  return getPriceMap()[planTier][interval];
}

export function getPlanFromStripePriceId(priceId?: string | null): {
  planTier: PaidPlanTier;
  billingInterval: BillingInterval;
} | null {
  if (!priceId) return null;

  const priceMap = getPriceMap();
  for (const planTier of PAID_PLAN_TIERS) {
    for (const interval of PLAN_INTERVALS) {
      if (priceMap[planTier][interval] === priceId) {
        return { planTier, billingInterval: interval };
      }
    }
  }

  return null;
}

export function getAppBaseUrl(request?: Request) {
  const configured =
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    process.env.APP_URL ??
    null;
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  if (request) {
    return new URL(request.url).origin;
  }

  return "http://localhost:3000";
}

async function ensureStripeCustomer(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      stripeCustomerId: true,
    },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name ?? undefined,
    metadata: { userId: user.id },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      stripeCustomerId: customer.id,
    },
  });

  return customer.id;
}

async function getExistingStripeCustomerId(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  if (!user.stripeCustomerId) {
    throw new Error("No Stripe customer is linked to this account yet.");
  }

  return user.stripeCustomerId;
}

function getStripeCustomerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null
) {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}

function getUnixTimestampField(
  value: unknown,
  field: string
): Date | null {
  const raw = Reflect.get(value as object, field);
  return typeof raw === "number" ? new Date(raw * 1000) : null;
}

function getInvoiceSubscriptionId(invoice: Stripe.Invoice) {
  const directSubscription = Reflect.get(invoice as object, "subscription");
  if (typeof directSubscription === "string") {
    return directSubscription;
  }
  if (
    directSubscription &&
    typeof directSubscription === "object" &&
    "id" in directSubscription &&
    typeof directSubscription.id === "string"
  ) {
    return directSubscription.id;
  }

  const parent = Reflect.get(invoice as object, "parent");
  if (!parent || typeof parent !== "object") {
    return null;
  }

  const subscriptionDetails = Reflect.get(
    parent as object,
    "subscription_details"
  );
  if (!subscriptionDetails || typeof subscriptionDetails !== "object") {
    return null;
  }

  const nestedSubscription = Reflect.get(
    subscriptionDetails as object,
    "subscription"
  );
  if (typeof nestedSubscription === "string") {
    return nestedSubscription;
  }
  if (
    nestedSubscription &&
    typeof nestedSubscription === "object" &&
    "id" in nestedSubscription &&
    typeof nestedSubscription.id === "string"
  ) {
    return nestedSubscription.id;
  }

  return null;
}

async function resolveUserIdForStripeSync(args: {
  customerId: string | null;
  fallbackUserId?: string | null;
  metadataUserId?: string | null;
}) {
  if (args.metadataUserId) {
    return args.metadataUserId;
  }

  if (args.fallbackUserId) {
    return args.fallbackUserId;
  }

  if (!args.customerId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: args.customerId },
    select: { id: true },
  });

  return user?.id ?? null;
}

async function syncSubscriptionRecord(
  subscription: Stripe.Subscription,
  fallbackUserId?: string | null
) {
  const customerId = getStripeCustomerId(subscription.customer);
  const firstPrice = subscription.items.data[0]?.price;
  const mappedPlan = getPlanFromStripePriceId(firstPrice?.id ?? null);
  const userId = await resolveUserIdForStripeSync({
    customerId,
    fallbackUserId,
    metadataUserId: subscription.metadata?.userId ?? null,
  });

  if (!userId) {
    throw new Error("Unable to resolve the user for the Stripe subscription.");
  }

  const entitled =
    mappedPlan !== null && isEntitledStripeStatus(subscription.status);

  return syncStripeBillingState(userId, {
    planTier: entitled ? mappedPlan.planTier : "free",
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    stripePriceId: firstPrice?.id ?? null,
    stripeProductId:
      typeof firstPrice?.product === "string"
        ? firstPrice.product
        : firstPrice?.product?.id ?? null,
    stripeSubscriptionStatus: subscription.status,
    billingInterval: entitled
      ? mappedPlan.billingInterval
      : normalizeInterval(firstPrice?.recurring?.interval ?? null),
    subscriptionCurrentPeriodStart: getUnixTimestampField(
      subscription,
      "current_period_start"
    ),
    subscriptionCurrentPeriodEnd: getUnixTimestampField(
      subscription,
      "current_period_end"
    ),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });
}

export async function createStripeCheckoutUrl(args: {
  interval: BillingInterval;
  planTier: PaidPlanTier;
  request?: Request;
  userId: string;
}) {
  const stripe = getStripe();
  const baseUrl = getAppBaseUrl(args.request);
  const customerId = await ensureStripeCustomer(args.userId);
  const priceId = getPriceIdForSelection(args.planTier, args.interval);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: args.userId,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: false,
    success_url: `${baseUrl}/dashboard?billing=success`,
    cancel_url: `${baseUrl}/dashboard?billing=canceled#settings-billing`,
    metadata: {
      userId: args.userId,
      planTier: args.planTier,
      interval: args.interval,
    },
    subscription_data: {
      metadata: {
        userId: args.userId,
        planTier: args.planTier,
        interval: args.interval,
      },
    },
  });

  if (!session.url) {
    throw new Error("Stripe checkout did not return a URL.");
  }

  return session.url;
}

export async function createStripePortalUrl(args: {
  request?: Request;
  userId: string;
}) {
  const stripe = getStripe();
  const baseUrl = getAppBaseUrl(args.request);
  const customerId = await getExistingStripeCustomerId(args.userId);

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${baseUrl}/dashboard#settings-billing`,
  });

  return session.url;
}

export async function getBillingRedirectUrl(args: {
  interval: BillingInterval;
  planTier: PaidPlanTier;
  request?: Request;
  userId: string;
}) {
  const billing = await getBillingSnapshot(args.userId);

  if (billing.planTier !== "free" && billing.canManageSubscription) {
    return createStripePortalUrl({
      userId: args.userId,
      request: args.request,
    });
  }

  return createStripeCheckoutUrl(args);
}

export async function syncCheckoutSessionToBilling(
  session: Stripe.Checkout.Session
) {
  if (session.mode !== "subscription") {
    return null;
  }

  const customerId = getStripeCustomerId(session.customer);
  const userId = await resolveUserIdForStripeSync({
    customerId,
    fallbackUserId: session.client_reference_id ?? null,
    metadataUserId: session.metadata?.userId ?? null,
  });

  if (!userId) {
    throw new Error("Unable to resolve the user for the completed checkout.");
  }

  if (customerId) {
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customerId },
    });
  }

  if (!session.subscription) {
    return null;
  }

  const stripe = getStripe();
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription.id;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  return syncSubscriptionRecord(subscription, userId);
}

export async function syncStripeSubscriptionToBilling(
  subscription: Stripe.Subscription
) {
  return syncSubscriptionRecord(subscription);
}

export async function syncStripeInvoiceToBilling(invoice: Stripe.Invoice) {
  const subscriptionId = getInvoiceSubscriptionId(invoice);
  if (!subscriptionId) {
    return null;
  }

  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return syncSubscriptionRecord(subscription);
}

export function constructStripeWebhookEvent(payload: string, signature: string) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  }

  return getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
}
