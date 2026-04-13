# Billing Readiness And Smoke

Date: 2026-04-13
Branch: `release/atrak-pages-launch`

## What Changed

- Audited the live Stripe code paths, env requirements, and billing state sync behavior in the release branch.
- Verified the current Vercel project had no `STRIPE_*` env vars in either Preview or Production before this pass.
- Created the minimum Stripe test-mode catalog in the connected Stripe sandbox account for the repo’s four required paid plan variants.
- Added the four real Preview Stripe price IDs to the Vercel project.
- Verified the protected preview can expose app routes through Vercel protection bypass, which is enough for later Stripe preview webhook testing without disabling preview protection.

## Changed Files

- No application code changes were required.
- This note is the only repo file added in this pass.

## Stripe Env Status

Preview now has real price IDs configured in Vercel:

- `STRIPE_PLUS_MONTHLY_PRICE_ID`
- `STRIPE_PLUS_YEARLY_PRICE_ID`
- `STRIPE_PRO_MONTHLY_PRICE_ID`
- `STRIPE_PRO_YEARLY_PRICE_ID`

Preview is still missing:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

Production is still missing the full Stripe billing set:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PLUS_MONTHLY_PRICE_ID`
- `STRIPE_PLUS_YEARLY_PRICE_ID`
- `STRIPE_PRO_MONTHLY_PRICE_ID`
- `STRIPE_PRO_YEARLY_PRICE_ID`

## Products, Prices, And Webhook

Stripe account in use:

- sandbox account `acct_1TFfMfQVBdn7g9Fm`
- display name `New business sandbox`

Created in Stripe test mode:

- `Atrak Pages Plus Monthly`
  - product `prod_UKXZBZrnfCDGLC`
  - price `price_1TLsUEQVBdn7g9FmWnrVhYxG`
- `Atrak Pages Plus Yearly`
  - product `prod_UKXZWCyMifZFgs`
  - price `price_1TLsUKQVBdn7g9FmZ7Ajb4hh`
- `Atrak Pages Pro Monthly`
  - product `prod_UKXZmXTe66HLe2`
  - price `price_1TLsUXQVBdn7g9FmnqxF8BBq`
- `Atrak Pages Pro Yearly`
  - product `prod_UKXZnQJPr2iy1p`
  - price `price_1TLsUhQVBdn7g9FmE6fkVoj9`

Webhook path in code:

- `POST /api/stripe/webhook`

Required Stripe events from the repo:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

Webhook status:

- not created from this environment
- blocked by unavailable Stripe dashboard/API-key level access for endpoint creation and signing-secret capture

## Preview URL Tested

- stable preview alias: `https://atrak-pages-preview.charlie2233s-projects.vercel.app`

## Smoke-Test Results

Confirmed:

- the protected Vercel preview is still reachable
- the repo’s billing routes and UI already return human-readable “Stripe billing is not configured” behavior instead of opaque failures
- Vercel protection bypass works for protected preview API routes, which is enough to support a preview Stripe webhook URL without disabling protection

Blocked:

- authenticated billing checkout smoke
- Stripe hosted checkout open
- subscription completion
- billing portal session creation
- webhook delivery verification
- app/database subscription sync verification

Reason:

- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are still unavailable from the current authenticated tooling

## Exact Remaining Manual Actions

1. In the Stripe sandbox dashboard API keys page, reveal the test secret key and add it to Vercel Preview as:
   - `STRIPE_SECRET_KEY`
   - format: `sk_test_...`
   - source: Stripe dashboard API keys for account `acct_1TFfMfQVBdn7g9Fm`

2. In the same Stripe sandbox account, create one webhook endpoint for the preview:
   - base path from code: `https://atrak-pages-preview.charlie2233s-projects.vercel.app/api/stripe/webhook`
   - because preview protection stays enabled, append the existing Vercel project automation bypass query params when entering the preview webhook URL
   - use the current project automation bypass secret already configured in Vercel Project Settings
   - subscribe only to:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.paid`
     - `invoice.payment_failed`

3. Copy the resulting Stripe webhook signing secret into Vercel Preview as:
   - `STRIPE_WEBHOOK_SECRET`
   - format: `whsec_...`

4. Redeploy the preview so the new Stripe env vars are present on the live deployment.

5. Re-run billing smoke:
   - authenticated dashboard billing section
   - checkout session creation
   - Stripe hosted checkout
   - return to `/dashboard?billing=success#settings-billing`
   - webhook delivery
   - `GET /api/billing` state update
   - billing portal session creation and return

## Remaining Blockers

- Preview billing is still blocked on the real Stripe test secret key and webhook signing secret.
- Production billing remains unconfigured because no live-mode Stripe values were available from this environment.

## Go / No-Go For Later DNS/Cutover

- `No-go`

Auth, database, and public-page preview readiness are already in much better shape, but billing is not honestly ready until the Preview Stripe secret key and webhook secret are entered and the post-checkout sync path is verified end to end.
