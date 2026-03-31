# LifePage Secrets And Service Configuration

Last updated: 2026-03-31

This is the source of truth for LifePage environment variables, provider-side setup, and deployment order.

## Current audited state

- Worker secrets currently configured on `lifepage-web`:
  - `DATABASE_URL`
  - `AUTH_SECRET`
  - `AUTH_URL`
  - `OPENAI_API_KEY`
  - `CRON_SECRET`
- Worker secrets currently missing for production launch:
  - all Stripe variables
  - all Cloudflare for SaaS variables
  - all R2 variables
- Local `.env.local` is not present in the clean release worktree.
- Stripe account currently connected through the plugin:
  - account: `acct_1TFfMfQVBdn7g9Fm`
  - display name: `New business sandbox`
  - products found: none
  - active prices found: none

## Secrets matrix

| Variable | Required for Workers production | Source / provider | Notes |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL provider | Must be a direct Postgres connection string reachable from Cloudflare Workers. |
| `AUTH_SECRET` | Yes | Generated locally | Preferred auth secret for Auth.js. `NEXTAUTH_SECRET` is only a compatibility alias. |
| `AUTH_URL` | Yes | Deployment hostname | Set to the public base URL of the current environment. Preferred over `NEXTAUTH_URL`. |
| `OPENAI_API_KEY` | Yes | OpenAI | Required for profile generation and AI-backed flows. |
| `CRON_SECRET` | Yes | Generated locally | Used as `x-cron-secret` when calling `/api/automations/run`. |
| `STRIPE_SECRET_KEY` | Yes | Stripe | Secret API key for the target Stripe environment. |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe Workbench / Webhooks | Signing secret for `POST /api/stripe/webhook`. |
| `STRIPE_PLUS_MONTHLY_PRICE_ID` | Yes | Stripe Price | Must point to the recurring Plus monthly price. |
| `STRIPE_PLUS_YEARLY_PRICE_ID` | Yes | Stripe Price | Must point to the recurring Plus yearly price. |
| `STRIPE_PRO_MONTHLY_PRICE_ID` | Yes | Stripe Price | Must point to the recurring Pro monthly price. |
| `STRIPE_PRO_YEARLY_PRICE_ID` | Yes | Stripe Price | Must point to the recurring Pro yearly price. |
| `CLOUDFLARE_API_TOKEN` | Yes | Cloudflare API token | Required for Cloudflare for SaaS hostname provisioning. |
| `CLOUDFLARE_SAAS_ZONE_ID` | Yes | Cloudflare zone settings | Zone ID for the provider-managed SaaS zone. |
| `CLOUDFLARE_SAAS_CNAME_TARGET` | Yes | Cloudflare for SaaS | Target customers must CNAME to, e.g. `customers.example.com`. |
| `CLOUDFLARE_SAAS_FALLBACK_ORIGIN` | Yes | Cloudflare for SaaS | Fallback origin for custom hostnames, e.g. `origin.example.com`. |
| `R2_ACCESS_KEY_ID` | Yes | Cloudflare R2 | Required for project video uploads in production. |
| `R2_SECRET_ACCESS_KEY` | Yes | Cloudflare R2 | Required for project video uploads in production. |
| `R2_BUCKET` | Yes | Cloudflare R2 | Bucket storing generated project videos/posters. |
| `R2_ACCOUNT_ID` | Yes | Cloudflare account | Canonical production convention. Used to derive the R2 endpoint for Workers. |
| `R2_ENDPOINT` | Optional override | Cloudflare R2 | Keep this as a local or diagnostic override only. Production Workers should standardize on `R2_ACCOUNT_ID`. |
| `R2_PUBLIC_BASE_URL` | Yes | Public R2 hostname / CDN | Base URL used on public portfolio pages. |

## Optional but recommended service variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | Recommended | Enables Cloudflare Browser Rendering screenshot capture from Workers. |
| `CLOUDFLARE_BROWSER_RENDERING_TOKEN` | Recommended | Lets crawls capture screenshots when running on Workers. |

## Exact setup order

1. Provision PostgreSQL and confirm the database accepts direct Postgres connections from Cloudflare Workers.
2. Generate `AUTH_SECRET` and `CRON_SECRET`.
3. Set the staging `AUTH_URL` to the Worker hostname.
4. Provision the OpenAI API key.
5. In Stripe:
   - create the four recurring prices
   - enable the Billing Portal
   - create the webhook destination for `/api/stripe/webhook`
6. In Cloudflare:
   - create the R2 bucket and public base URL
   - use the account id based R2 endpoint convention for production
   - create or identify the SaaS zone
   - create an API token with permission to manage custom hostnames in that zone
7. Set all required secrets on the Worker with `wrangler secret put ...`.
8. Deploy to the Worker staging hostname and run smoke tests there.
9. Move `AUTH_URL` from the staging Worker hostname to `https://lifepage.one` only after the Worker is attached to the production domain.

## Worker secret setup commands

```bash
npx wrangler secret put DATABASE_URL
npx wrangler secret put AUTH_SECRET
npx wrangler secret put AUTH_URL
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put CRON_SECRET
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put STRIPE_PLUS_MONTHLY_PRICE_ID
npx wrangler secret put STRIPE_PLUS_YEARLY_PRICE_ID
npx wrangler secret put STRIPE_PRO_MONTHLY_PRICE_ID
npx wrangler secret put STRIPE_PRO_YEARLY_PRICE_ID
npx wrangler secret put CLOUDFLARE_API_TOKEN
npx wrangler secret put CLOUDFLARE_SAAS_ZONE_ID
npx wrangler secret put CLOUDFLARE_SAAS_CNAME_TARGET
npx wrangler secret put CLOUDFLARE_SAAS_FALLBACK_ORIGIN
npx wrangler secret put R2_ACCESS_KEY_ID
npx wrangler secret put R2_SECRET_ACCESS_KEY
npx wrangler secret put R2_BUCKET
npx wrangler secret put R2_ACCOUNT_ID
npx wrangler secret put R2_PUBLIC_BASE_URL
```

If you need an explicit endpoint for local diagnostics instead of `R2_ACCOUNT_ID`, also set:

```bash
npx wrangler secret put R2_ENDPOINT
```

## Prisma and Postgres strategy for Workers

Verified from repo code:

- [src/lib/db.ts](/Users/hanfei/My_portforlio_release_hosting/src/lib/db.ts) uses `@prisma/adapter-pg` with `PrismaClient`.
- In Cloudflare Workers runtime, LifePage creates a fresh Prisma client per request.
- In non-Workers runtimes, it caches the Prisma client on `globalThis`.

Operationally, that means:

- `DATABASE_URL` must be a real Postgres connection string, not a placeholder.
- The database must be reachable from Cloudflare Workers over the public network or another supported path.
- SSL is typically required by hosted Postgres providers and should be enabled in the connection string when your provider requires it.
- This repo is using PostgreSQL via Prisma driver adapters, not GitHub Pages, not SQLite, and not Cloudflare D1.

## Auth callback URLs

LifePage currently uses only the Auth.js Credentials provider.

That means:

- no third-party OAuth callback registration is required today
- the important setting is `AUTH_URL`, because redirects and cookies must match the live host

Expected callback paths:

- Staging Worker hostname:
  - Base URL: `https://lifepage-web.<your-subdomain>.workers.dev`
  - Credentials callback: `https://lifepage-web.<your-subdomain>.workers.dev/api/auth/callback/credentials`
- Production custom domain:
  - Base URL: `https://lifepage.one`
  - Credentials callback: `https://lifepage.one/api/auth/callback/credentials`

Repo verification:

- [src/lib/auth.ts](/Users/hanfei/My_portforlio_release_hosting/src/lib/auth.ts) uses `trustHost: true`, the Credentials provider, and `/login` as the sign-in page.
- [src/lib/runtime-config.ts](/Users/hanfei/My_portforlio_release_hosting/src/lib/runtime-config.ts) now fails clearly if `AUTH_URL` is missing or invalid.

## Stripe provider-side configuration

### Current verification

- The connected Stripe account has no products.
- The connected Stripe account has no active prices.
- Therefore Stripe is not production-ready yet.

### Required Stripe catalog

Create exactly these four recurring prices:

- `LifePage Plus Monthly` at `$5/month`
- `LifePage Plus Yearly` at `$50/year`
- `LifePage Pro Monthly` at `$10/month`
- `LifePage Pro Yearly` at `$100/year`

### Required webhook destination

- URL: `https://<current-host>/api/stripe/webhook`
- Staging example: `https://lifepage-web.<your-subdomain>.workers.dev/api/stripe/webhook`
- Production example: `https://lifepage.one/api/stripe/webhook`

Events verified by repo code:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

Repo verification:

- [src/app/api/stripe/webhook/route.ts](/Users/hanfei/My_portforlio_release_hosting/src/app/api/stripe/webhook/route.ts) handles those events.
- [src/lib/stripe-billing.ts](/Users/hanfei/My_portforlio_release_hosting/src/lib/stripe-billing.ts) syncs checkout, subscription, and invoice events into billing state.
- [e2e/billing-domains.spec.ts](/Users/hanfei/My_portforlio_release_hosting/e2e/billing-domains.spec.ts) covers fake-provider checkout, webhook sync, and portal flows in CI.

### Billing Portal

- LifePage creates Billing Portal sessions server-side with Stripe’s Billing Portal API.
- The portal still needs to be enabled and configured in the Stripe Dashboard.
- The return URL is `<AUTH_URL>/dashboard#settings-billing`.

Because the connected Stripe workspace has no catalog configured yet, a live billing-portal flow could not be verified end-to-end in this audit.

## Defensive checks added in repo

- Core app startup now fails clearly when `DATABASE_URL`, auth config, `OPENAI_API_KEY`, or `CRON_SECRET` are missing.
- Billing routes now return a human-readable list of missing Stripe variables instead of a generic “not configured” message.
- The billing dashboard can surface the Stripe config error message from the API.
- Automation cron now returns a clear `503` if `CRON_SECRET` is missing.
- `wrangler.jsonc` now declares required secrets so deploys can fail before a broken Worker reaches production.

## Troubleshooting

### Worker deploy fails before upload or validation

- Check `wrangler.jsonc` required secrets.
- Run `npx wrangler secret list`.
- Set every missing secret from the matrix above.
- For R2, production Workers should use `R2_ACCOUNT_ID`. `R2_ENDPOINT` is only a local or emergency override.

### Login or session cookies break after cutover

- Confirm `AUTH_URL` exactly matches the live external host.
- For staging, use the Worker hostname.
- For production, use `https://lifepage.one`.

### `/api/billing/checkout` or `/api/billing/portal` returns `503`

- Read the response message. It now lists the missing Stripe variables.
- Confirm the four price IDs exist in Stripe and belong to the same Stripe environment as `STRIPE_SECRET_KEY`.

### Stripe webhooks return `400`

- Confirm the endpoint path is `/api/stripe/webhook`.
- Confirm the signing secret in Stripe matches `STRIPE_WEBHOOK_SECRET`.
- Confirm the destination host matches the active environment.

### Custom domain verification fails immediately

- Confirm `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_SAAS_ZONE_ID`, `CLOUDFLARE_SAAS_CNAME_TARGET`, and `CLOUDFLARE_SAAS_FALLBACK_ORIGIN`.
- Confirm the token can manage custom hostnames in the target zone.

### Project videos fail in production

- Confirm all required R2 variables are set.
- Confirm `R2_PUBLIC_BASE_URL` resolves publicly and serves uploaded objects.
