# Launch Signoff Precheck

Date: 2026-04-13
Branch: `release/atrak-pages-launch`
Preview: `https://atrak-pages-preview.charlie2233s-projects.vercel.app`

## Scope

This precheck covers launch plumbing only for the existing Vercel Preview release candidate:

- protected preview reachability
- branding and metadata on preview
- auth and database readiness status from prior verified passes
- Stripe preview billing readiness

It does not cover:

- DNS or domain cutover
- GitHub Pages cleanup
- Cloudflare hosting
- product or UX expansion

## Current State

- Preview branding and metadata: `green`
  - the stable preview alias serves current Atrak Pages branding and preview-aware canonical/OG metadata
- Preview auth and database plumbing: `previously green`
  - see [database-readiness-and-auth-smoke.md](/Users/hanfei/.tmp/atrak-pages-launch/notes/database-readiness-and-auth-smoke.md)
- Preview Stripe price catalog: `green`
  - all four required Preview price IDs exist and still match the repo plan model
- Preview Stripe secret wiring: `blocked`
  - `STRIPE_SECRET_KEY` is not visible in the live Vercel Preview env inventory
  - `STRIPE_WEBHOOK_SECRET` is not visible in the live Vercel Preview env inventory
- Preview webhook proof: `blocked`
  - no authenticated proof is available here that the Stripe webhook endpoint exists in the Stripe dashboard
  - no authenticated proof is available here that the endpoint is subscribed to the six required events
- Fresh deploy with live Stripe envs: `blocked`
  - the stable preview alias still points at deployment `dpl_3P4t39mXwyamwZBpb6n86LbGhmsK` from 2026-04-06
  - until the missing Stripe secrets actually exist in Preview, there is no valid reason to redeploy for billing smoke

## Billing Readiness Result

Preview billing is not honestly green.

Minimum evidence still missing:

- live Vercel Preview env proof for:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
- Stripe dashboard or API proof for:
  - preview webhook endpoint existence
  - the exact endpoint URL
  - subscription to only:
    - `checkout.session.completed`
    - `customer.subscription.created`
    - `customer.subscription.updated`
    - `customer.subscription.deleted`
    - `invoice.paid`
    - `invoice.payment_failed`
- a fresh preview deploy after those values are really present
- successful end-to-end preview billing smoke:
  - authenticated upgrade entry
  - checkout session creation
  - Stripe Checkout open and test completion
  - return to app
  - webhook delivery
  - billing state update in app and database
  - billing portal session creation

## Exact Remaining Blockers Before Later Cutover

1. Vercel Preview still does not show `STRIPE_SECRET_KEY`.
2. Vercel Preview still does not show `STRIPE_WEBHOOK_SECRET`.
3. Stripe webhook registration/subscription is still unproven from current authenticated access.
4. The current stable preview alias is an older deployment, so it cannot prove later Stripe env changes are live.
5. End-to-end preview billing smoke is still unperformed because its preconditions are not met.

## Go / No-Go

- Launch-signoff readiness: `No-go`
- Reason: preview billing is still blocked and therefore launch plumbing is not fully green.
