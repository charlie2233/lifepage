# LifePage Operations

Last updated: 2026-03-31

## Canonical runtime

- Production runtime: Cloudflare Workers
- Canonical host: `https://lifepage.one`
- Staging host: `*.workers.dev`
- GitHub Pages: fallback-only on `https://charlie2233.github.io/My_portforlio/`

Use [SECRETS.md](SECRETS.md) as the source of truth for service configuration, provider setup, and secret values.

## Startup guarantees

LifePage now fails loudly when core runtime configuration is missing.

- Missing `DATABASE_URL`, auth config, `OPENAI_API_KEY`, or `CRON_SECRET` fails app startup.
- Missing Stripe billing config returns a `503` with a human-readable list of missing variables.
- Missing cron secret returns a `503` instead of a misleading auth failure.

The relevant checks live in:

- `src/lib/runtime-config.ts`
- `src/app/layout.tsx`
- `src/lib/auth.ts`
- `src/lib/db.ts`
- `src/lib/stripe-billing.ts`

## Production setup order

1. Resolve the current Worker deploy blocker on the target Cloudflare account.
2. Provision PostgreSQL and confirm the `DATABASE_URL` works from Cloudflare Workers.
3. Generate `AUTH_SECRET` and `CRON_SECRET`.
4. Set `AUTH_URL` to the staging Worker hostname.
5. Provision `OPENAI_API_KEY`.
6. Provision Stripe products, prices, Billing Portal, and webhook signing secret.
7. Provision Cloudflare R2 and Cloudflare for SaaS settings.
8. Upload the full Worker secret set from `SECRETS.md`.
9. Deploy to `*.workers.dev`.
10. Run auth, DB, billing, and public-page smoke checks.
11. Attach `lifepage.one` to the Worker and move `AUTH_URL` to `https://lifepage.one`.

## Provider-side requirements

### Stripe

- Four recurring prices must exist:
  - `STRIPE_PLUS_MONTHLY_PRICE_ID`
  - `STRIPE_PLUS_YEARLY_PRICE_ID`
  - `STRIPE_PRO_MONTHLY_PRICE_ID`
  - `STRIPE_PRO_YEARLY_PRICE_ID`
- Billing Portal must be enabled in Stripe Dashboard.
- Webhook destination must point to:
  - staging: `https://lifepage-web.<your-subdomain>.workers.dev/api/stripe/webhook`
  - production: `https://lifepage.one/api/stripe/webhook`

### Cloudflare R2

- Production Workers should use `R2_ACCOUNT_ID` as the canonical configuration.
- `R2_ENDPOINT` is only for local or diagnostic overrides.
- `R2_PUBLIC_BASE_URL` must serve uploaded assets publicly.

### Cloudflare for SaaS

- `CLOUDFLARE_API_TOKEN` must be able to manage custom hostnames in the provider zone.
- `CLOUDFLARE_SAAS_ZONE_ID`, `CLOUDFLARE_SAAS_CNAME_TARGET`, and `CLOUDFLARE_SAAS_FALLBACK_ORIGIN` must all match the real SaaS zone configuration.

## Smoke checks

Run these checks on staging before domain cutover:

- Sign up and sign in.
- Create or load a DB-backed dashboard session.
- Start Stripe checkout and confirm the response is not a config `503`.
- Open the billing portal from the dashboard.
- Trigger or replay a Stripe webhook and confirm plan state changes.
- Load a public portfolio page and a resume export.

## Troubleshooting

### App fails at startup

- Read the thrown configuration error.
- Compare the missing variable list against [SECRETS.md](SECRETS.md).

### Billing endpoints return `503`

- The response now identifies the missing Stripe configuration.
- Confirm the Stripe key, webhook secret, and all four price ids belong to the same Stripe environment.

### Auth redirects to the wrong host

- Confirm `AUTH_URL` matches the external hostname for the active environment.
- Use the Worker hostname for staging and `https://lifepage.one` for production.

### Project videos fail after deploy

- Confirm the R2 credentials, bucket, account id, and public base URL are all set.
- If `R2_ENDPOINT` is set, make sure it matches the same account and bucket.
