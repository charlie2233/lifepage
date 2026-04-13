# Billing Readiness And Smoke

Date: 2026-04-13
Branch: `release/atrak-pages-launch`

## What Changed

- Audited the live Stripe code paths, env requirements, and billing state sync behavior in the release branch.
- Re-verified the current Vercel project env state after the user-directed “finish billing” pass.
- Created the minimum Stripe test-mode catalog in the connected Stripe sandbox account for the repo’s four required paid plan variants.
- Added the four real Preview Stripe price IDs to the Vercel project.
- Re-verified that the protected preview can expose app routes through Vercel-authenticated fetch/share access without disabling preview protection.
- Re-verified that the stable preview alias is serving current Atrak Pages branding and deployment-aware metadata, not stale localhost or LifePage metadata.
- Verified that Preview still does not expose `STRIPE_SECRET_KEY` or `STRIPE_WEBHOOK_SECRET` in the live Vercel env inventory, so no honest end-to-end billing smoke can proceed yet.
- Verified that the stable preview alias still resolves to the Apr 6 deployment, so it cannot be treated as proof that any later Stripe env changes are live.

## Changed Files

- No application code changes were required.
- This note and the launch signoff precheck note document the current blocker state.

## Stripe Env Status

Preview now has real price IDs configured in Vercel:

- `STRIPE_PLUS_MONTHLY_PRICE_ID`
- `STRIPE_PLUS_YEARLY_PRICE_ID`
- `STRIPE_PRO_MONTHLY_PRICE_ID`
- `STRIPE_PRO_YEARLY_PRICE_ID`

Preview is still missing:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

This was rechecked directly from the live Vercel Preview env list during this pass. The user assumption that those values had been added is not reflected in the current project state.

Production is still missing the full Stripe billing set:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PLUS_MONTHLY_PRICE_ID`
- `STRIPE_PLUS_YEARLY_PRICE_ID`
- `STRIPE_PRO_MONTHLY_PRICE_ID`
- `STRIPE_PRO_YEARLY_PRICE_ID`

Important production note:

- do not copy Preview test-mode Stripe values into Production
- Production will need real live-mode Stripe secrets and live-mode prices during the later launch-signoff step

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
- the connected Stripe tooling in this session can inspect account metadata and prices, but it does not expose the test secret key or create/reveal webhook signing secrets
- there is still no authenticated proof available here that the Stripe webhook endpoint exists in the dashboard or is subscribed to the six required events

## Preview URL Tested

- stable preview alias: `https://atrak-pages-preview.charlie2233s-projects.vercel.app`
- current protected deployment behind that alias serves `Atrak Pages — AI Personal Brand Builder`
- protected browser/manual testing can use a fresh Vercel share link or the existing project protection-bypass path; do not commit either secret-bearing URL into the repo
- the alias still points at deployment `dpl_3P4t39mXwyamwZBpb6n86LbGhmsK`, created on 2026-04-06, so a fresh redeploy will still be required after the missing secrets are truly present

## Smoke-Test Results

Confirmed:

- the protected Vercel preview is still reachable
- the stable preview alias is serving current Atrak Pages HTML and preview-aware canonical/OG metadata
- the `/upgrade` route is reachable through Vercel-authenticated fetch on the protected preview
- Vercel protection bypass/share access works for protected preview routes, which is enough to support a preview Stripe webhook URL without disabling protection
- the repo’s billing routes are coded to fail clearly when Stripe is not configured:
  - checkout and portal return `503` with `Stripe billing is not configured.`
  - webhook returns `503` when Stripe config is incomplete
- the four configured price IDs still match the code’s `plus/month`, `plus/year`, `pro/month`, and `pro/year` plan model exactly

Blocked:

- fresh preview redeploy for billing validation
- authenticated billing checkout smoke
- Stripe hosted checkout open
- subscription completion
- billing portal session creation
- webhook delivery verification
- app/database subscription sync verification

Reason:

- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are still absent from the live Vercel Preview env inventory
- Stripe webhook existence and event subscription state are still unproven from the currently available authenticated tooling

## Exact Remaining Manual Actions

1. In the Stripe sandbox dashboard API keys page, reveal the test secret key and add it to Vercel Preview as:
   - `STRIPE_SECRET_KEY`
   - format: `sk_test_...`
   - source: Stripe dashboard API keys for account `acct_1TFfMfQVBdn7g9Fm`

2. In the same Stripe sandbox account, create one webhook endpoint for the preview:
   - base path from code: `https://atrak-pages-preview.charlie2233s-projects.vercel.app/api/stripe/webhook`
   - because preview protection stays enabled, use one of these two protected-preview access methods:
     - preferred: generate a fresh Vercel preview share URL that resolves to `/api/stripe/webhook`
     - fallback: append the existing Vercel project automation-bypass query params from Project Settings
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

- Preview billing is still blocked on the real Stripe test secret key and webhook signing secret not being visible in the live Vercel project.
- Preview billing is still blocked on the absence of authenticated proof that the Stripe webhook endpoint exists and is subscribed correctly.
- Production billing remains unconfigured because no live-mode Stripe values were available from this environment.

## Go / No-Go For Later DNS/Cutover

- `No-go`

Auth, database, and public-page preview readiness are already in much better shape, but billing is not honestly ready until the Preview Stripe secret key and webhook secret are entered and the post-checkout sync path is verified end to end.
