import Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  isFakeStripeEnabled,
  verifyE2EStripeSignature,
} from "@/lib/e2e-mode";
import {
  PLAN_INTERVALS,
  PLAN_TIERS,
  type BillingInterval,
  type PlanTier,
  getBillingSnapshot,
  isEntitledStripeStatus,
  syncStripeBillingState,
} from "@/lib/billing";
import {
  getRequiredAppBaseUrl,
  getRequiredEnvVar,
  getStripeBillingConfigStatus,
} from "@/lib/runtime-config";

const PAID_PLAN_TIERS = PLAN_TIERS.filter((plan) => plan !== "free");
type PaidPlanTier = Exclude<PlanTier, "free">;
type StripeWebhookProcessingStatus =
  | "processing"
  | "processed"
  | "failed";

interface StripeBillingSyncResult {
  billing: Awaited<ReturnType<typeof syncStripeBillingState>>;
  userId: string;
}

interface StripeWebhookReservation {
  duplicate: boolean;
  shouldProcess: boolean;
}

type FakeStripeState = {
  subscriptions: Map<string, Stripe.Subscription>;
};

function getFakeStripeState(): FakeStripeState {
  const globalForFakeStripe = globalThis as typeof globalThis & {
    __lifepageFakeStripe?: FakeStripeState;
  };

  if (!globalForFakeStripe.__lifepageFakeStripe) {
    globalForFakeStripe.__lifepageFakeStripe = {
      subscriptions: new Map(),
    };
  }

  return globalForFakeStripe.__lifepageFakeStripe;
}

function rememberFakeStripeSubscription(subscription: Stripe.Subscription) {
  getFakeStripeState().subscriptions.set(subscription.id, subscription);
}

function getFakeStripeSubscription(subscriptionId: string) {
  return getFakeStripeState().subscriptions.get(subscriptionId) ?? null;
}

function buildFakeBillingUrl(
  kind: "checkout" | "portal",
  request: Request | undefined,
  params?: Record<string, string>
) {
  const baseUrl = getAppBaseUrl(request);
  const url = new URL("/dashboard", baseUrl);
  url.hash = "settings-billing";
  url.searchParams.set("e2e_billing", kind);

  for (const [key, value] of Object.entries(params ?? {})) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}

export function isStripeBillingConfigured() {
  return getStripeBillingConfigStatus().configured;
}

export function getStripe() {
  const secretKey = getRequiredEnvVar("STRIPE_SECRET_KEY", "Stripe billing");
  return new Stripe(secretKey, {
    appInfo: {
      name: "LifePage",
      version: "0.1.0",
    },
  });
}

function normalizeInterval(value?: string | null): BillingInterval | null {
  return value === "month" || value === "year" ? value : null;
}

function getPriceMap(): Record<PaidPlanTier, Record<BillingInterval, string>> {
  const plusMonthly = getRequiredEnvVar(
    "STRIPE_PLUS_MONTHLY_PRICE_ID",
    "Stripe billing"
  );
  const plusYearly = getRequiredEnvVar(
    "STRIPE_PLUS_YEARLY_PRICE_ID",
    "Stripe billing"
  );
  const proMonthly = getRequiredEnvVar(
    "STRIPE_PRO_MONTHLY_PRICE_ID",
    "Stripe billing"
  );
  const proYearly = getRequiredEnvVar(
    "STRIPE_PRO_YEARLY_PRICE_ID",
    "Stripe billing"
  );

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
  return getRequiredAppBaseUrl({
    consumer: "Stripe billing",
    request,
  });
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

function getStripeSubscriptionId(
  subscription: string | Stripe.Subscription | null | undefined
) {
  if (!subscription) return null;
  return typeof subscription === "string" ? subscription : subscription.id;
}

function getStripeEventCreatedAt(event: Stripe.Event) {
  return typeof event.created === "number"
    ? new Date(event.created * 1000)
    : null;
}

function getSafeWebhookErrorMessage(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Stripe webhook processing failed.";
  return message.slice(0, 1000);
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
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
): Promise<StripeBillingSyncResult> {
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

  const billing = await syncStripeBillingState(userId, {
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

  return { billing, userId };
}

export async function createStripeCheckoutUrl(args: {
  interval: BillingInterval;
  planTier: PaidPlanTier;
  request?: Request;
  userId: string;
}) {
  if (isFakeStripeEnabled()) {
    return buildFakeBillingUrl("checkout", args.request, {
      planTier: args.planTier,
      interval: args.interval,
    });
  }

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
    success_url: `${baseUrl}/dashboard?billing=success#settings-billing`,
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
  if (isFakeStripeEnabled()) {
    return buildFakeBillingUrl("portal", args.request);
  }

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
): Promise<StripeBillingSyncResult | null> {
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

  if (isFakeStripeEnabled()) {
    const fakeSubscription =
      typeof session.subscription === "string"
        ? getFakeStripeSubscription(session.subscription)
        : (session.subscription as Stripe.Subscription);

    if (!fakeSubscription) {
      throw new Error(
        "Fake Stripe checkout session did not include a stored subscription."
      );
    }

    rememberFakeStripeSubscription(fakeSubscription);
    return syncSubscriptionRecord(fakeSubscription, userId);
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
): Promise<StripeBillingSyncResult> {
  if (isFakeStripeEnabled()) {
    rememberFakeStripeSubscription(subscription);
  }

  return syncSubscriptionRecord(subscription);
}

export async function syncStripeInvoiceToBilling(
  invoice: Stripe.Invoice
): Promise<StripeBillingSyncResult | null> {
  const subscriptionId = getInvoiceSubscriptionId(invoice);
  if (!subscriptionId) {
    return null;
  }

  if (isFakeStripeEnabled()) {
    const subscription = getFakeStripeSubscription(subscriptionId);
    if (!subscription) {
      throw new Error(
        "Fake Stripe invoice referenced a subscription that was not seeded."
      );
    }

    return syncSubscriptionRecord(subscription);
  }

  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return syncSubscriptionRecord(subscription);
}

export function constructStripeWebhookEvent(payload: string, signature: string) {
  const webhookSecret = getRequiredEnvVar(
    "STRIPE_WEBHOOK_SECRET",
    "Stripe webhook verification"
  );

  if (isFakeStripeEnabled()) {
    verifyE2EStripeSignature(payload, signature, webhookSecret);
    return JSON.parse(payload) as Stripe.Event;
  }

  return getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
}

export async function reserveStripeWebhookEvent(
  event: Stripe.Event
): Promise<StripeWebhookReservation> {
  try {
    await prisma.stripeWebhookEvent.create({
      data: {
        id: event.id,
        type: event.type,
        status: "processing",
        livemode: event.livemode,
        eventCreatedAt: getStripeEventCreatedAt(event),
      },
    });

    return { shouldProcess: true, duplicate: false };
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }

    const existing = await prisma.stripeWebhookEvent.findUnique({
      where: { id: event.id },
      select: { status: true },
    });

    if (!existing) {
      throw error;
    }

    if (existing.status === "processed" || existing.status === "processing") {
      return { shouldProcess: false, duplicate: true };
    }

    await prisma.stripeWebhookEvent.update({
      where: { id: event.id },
      data: {
        status: "processing",
        lastError: null,
        processedAt: null,
        livemode: event.livemode,
        eventCreatedAt: getStripeEventCreatedAt(event),
        attemptCount: { increment: 1 },
      },
    });

    return { shouldProcess: true, duplicate: false };
  }
}

export async function markStripeWebhookEventProcessed(args: {
  eventId: string;
  userId?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}) {
  await prisma.stripeWebhookEvent.update({
    where: { id: args.eventId },
    data: {
      status: "processed" satisfies StripeWebhookProcessingStatus,
      userId: args.userId ?? null,
      stripeCustomerId: args.stripeCustomerId ?? null,
      stripeSubscriptionId: args.stripeSubscriptionId ?? null,
      processedAt: new Date(),
      lastError: null,
    },
  });
}

export async function markStripeWebhookEventFailed(args: {
  eventId: string;
  error: unknown;
}) {
  await prisma.stripeWebhookEvent.update({
    where: { id: args.eventId },
    data: {
      status: "failed" satisfies StripeWebhookProcessingStatus,
      processedAt: null,
      lastError: getSafeWebhookErrorMessage(args.error),
    },
  });
}

export function getStripeWebhookReferences(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      return {
        stripeCustomerId: getStripeCustomerId(session.customer),
        stripeSubscriptionId: getStripeSubscriptionId(session.subscription),
      };
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      return {
        stripeCustomerId: getStripeCustomerId(subscription.customer),
        stripeSubscriptionId: subscription.id,
      };
    }
    case "invoice.paid":
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      return {
        stripeCustomerId: getStripeCustomerId(invoice.customer),
        stripeSubscriptionId: getInvoiceSubscriptionId(invoice),
      };
    }
    default:
      return {
        stripeCustomerId: null,
        stripeSubscriptionId: null,
      };
  }
}
