import { expect, test } from "@playwright/test";
import { createTestUser, registerAndLogin } from "./support/auth";
import { requestWithHostHeader } from "./support/http";
import {
  buildFakeStripeEvent,
  buildFakeSubscription,
  postFakeStripeEvent,
} from "./support/stripe";

const WRONG_DNS_DOMAIN = "wrong-dns.e2e.lifepage.test";
const PENDING_SSL_DOMAIN = "pending-ssl.e2e.lifepage.test";
const ACTIVE_DOMAIN = "active-domain.e2e.lifepage.test";
const DUPLICATE_DOMAIN = "duplicate-domain.e2e.lifepage.test";

test("keeps free billing preferences local, syncs Stripe fixtures, and enforces custom-domain activation", async ({
  page,
  baseURL,
}) => {
  const user = createTestUser("billing");
  await registerAndLogin(page, user);

  const request = page.context().request;

  const updatePreferencesRes = await request.patch("/api/billing", {
    data: {
      aiProvider: "openai",
      aiUsageRate: "2x",
      preferredAiModel: "gpt-5",
    },
  });
  expect(updatePreferencesRes.ok()).toBeTruthy();
  const preferenceData = (await updatePreferencesRes.json()) as {
    billing?: { planTier?: string; aiProvider?: string; aiUsageRate?: string };
  };
  expect(preferenceData.billing?.planTier).toBe("free");
  expect(preferenceData.billing?.aiProvider).toBe("openai");
  expect(preferenceData.billing?.aiUsageRate).toBe("2x");

  const checkoutRes = await request.post("/api/billing/checkout", {
    data: { planTier: "plus", interval: "month" },
  });
  expect(checkoutRes.ok()).toBeTruthy();
  const checkoutData = (await checkoutRes.json()) as { checkoutUrl?: string };
  expect(checkoutData.checkoutUrl).toContain("e2e_billing=checkout");

  const customerId = `cus_${Date.now()}`;
  const subscriptionId = `sub_${Date.now()}`;

  const subscriptionCreated = buildFakeSubscription({
    userId: "placeholder",
    customerId,
    subscriptionId,
    planTier: "plus",
    interval: "month",
    status: "active",
  });

  const userLookupRes = await request.get("/api/auth/session");
  expect(userLookupRes.ok()).toBeTruthy();
  const userLookup = (await userLookupRes.json()) as {
    user?: { id?: string };
  };
  const userId = userLookup.user?.id;
  expect(userId).toBeTruthy();
  subscriptionCreated.metadata.userId = userId as string;

  const createdEvent = buildFakeStripeEvent(
    "customer.subscription.created",
    subscriptionCreated
  );
  const createdWebhook = await postFakeStripeEvent(request, createdEvent);
  expect(createdWebhook.ok()).toBeTruthy();

  const billingAfterCreate = await request.get("/api/billing");
  const billingCreateData = (await billingAfterCreate.json()) as {
    billing?: { planTier?: string; subscriptionStatus?: string };
  };
  expect(billingCreateData.billing?.planTier).toBe("plus");
  expect(billingCreateData.billing?.subscriptionStatus).toBe("active");

  const updatedSubscription = buildFakeSubscription({
    userId: userId as string,
    customerId,
    subscriptionId,
    planTier: "plus",
    interval: "month",
    status: "past_due",
    cancelAtPeriodEnd: true,
  });
  const updatedEvent = buildFakeStripeEvent(
    "customer.subscription.updated",
    updatedSubscription
  );
  const updatedWebhook = await postFakeStripeEvent(request, updatedEvent);
  expect(updatedWebhook.ok()).toBeTruthy();

  const billingAfterUpdate = await request.get("/api/billing");
  const billingUpdateData = (await billingAfterUpdate.json()) as {
    billing?: {
      subscriptionStatus?: string;
      cancelAtPeriodEnd?: boolean;
      canManageSubscription?: boolean;
    };
  };
  expect(billingUpdateData.billing?.subscriptionStatus).toBe("past_due");
  expect(billingUpdateData.billing?.cancelAtPeriodEnd).toBe(true);

  await page.reload();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(page.getByText("Past Due", { exact: true })).toBeVisible();
  await expect(
    page.getByText(/scheduled to cancel at the end of the current period/i)
  ).toBeVisible();

  const portalRes = await request.post("/api/billing/portal");
  expect(portalRes.ok()).toBeTruthy();
  const portalData = (await portalRes.json()) as { portalUrl?: string };
  expect(portalData.portalUrl).toContain("e2e_billing=portal");

  const generateRes = await request.post("/api/generate", {
    data: {
      userInfo: {
        name: user.name,
        bio: "Builder creating a deterministic E2E test portfolio.",
      },
    },
  });
  expect(generateRes.ok()).toBeTruthy();

  const wrongDomainSave = await request.patch("/api/settings", {
    data: { customDomain: WRONG_DNS_DOMAIN },
  });
  expect(wrongDomainSave.ok()).toBeTruthy();

  const wrongDomainVerify = await request.post("/api/settings/domain/verify");
  expect(wrongDomainVerify.ok()).toBeTruthy();
  const wrongDomainData = (await wrongDomainVerify.json()) as {
    settings?: { customDomainStatus?: string };
    error?: string | null;
  };
  expect(wrongDomainData.settings?.customDomainStatus).toBe("error");
  expect(wrongDomainData.error).toContain("required CNAME target");

  const pendingDomainSave = await request.patch("/api/settings", {
    data: { customDomain: PENDING_SSL_DOMAIN },
  });
  expect(pendingDomainSave.ok()).toBeTruthy();
  const pendingDomainVerify = await request.post("/api/settings/domain/verify");
  expect(pendingDomainVerify.ok()).toBeTruthy();
  const pendingDomainData = (await pendingDomainVerify.json()) as {
    settings?: { customDomainStatus?: string };
  };
  expect(pendingDomainData.settings?.customDomainStatus).toBe("verified");

  const activeDomainSave = await request.patch("/api/settings", {
    data: { customDomain: ACTIVE_DOMAIN },
  });
  expect(activeDomainSave.ok()).toBeTruthy();
  const activeDomainVerify = await request.post("/api/settings/domain/verify");
  expect(activeDomainVerify.ok()).toBeTruthy();
  const activeDomainData = (await activeDomainVerify.json()) as {
    settings?: { customDomainStatus?: string };
  };
  expect(activeDomainData.settings?.customDomainStatus).toBe("active");

  const appBaseUrl = baseURL ?? "http://localhost:3001";
  const activePublicPage = await requestWithHostHeader(appBaseUrl, ACTIVE_DOMAIN);
  expect(activePublicPage.status).toBe(200);
  expect(activePublicPage.body).toContain("Text Seeded Portfolio");

  const blockedPage = await requestWithHostHeader(appBaseUrl, WRONG_DNS_DOMAIN);
  expect(blockedPage.status).toBe(404);

  const duplicateDomainRes = await request.patch("/api/settings", {
    data: { customDomain: DUPLICATE_DOMAIN },
  });
  expect(duplicateDomainRes.status()).toBe(409);
});
