# LifePage Deployment

Last updated: 2026-03-31

## Production intent

- Real app host: Cloudflare Workers
- Canonical production domain: `lifepage.one`
- Optional fallback only: `https://charlie2233.github.io/My_portforlio/`
- Non-canonical Worker preview host: `*.workers.dev`
- GitHub Pages must not be treated as the real app runtime for auth, billing, database access, or API traffic

## Current audited state

- The repo contains a Cloudflare Worker deployment path via OpenNext:
  - `npm run cf:build`
  - `npm run cf:preview`
  - `npm run cf:deploy`
- CI exists in `.github/workflows/ci.yml` and runs lint, Next build, Cloudflare build, and Playwright E2E.
- No standalone deployment workflow exists yet.
- `wrangler.jsonc` defines a Worker named `lifepage-web` with `workers_dev: true`, but no production routes.
- A clean `npm run cf:build` succeeds with CI-style placeholder env values.
- A clean `npm run cf:deploy` reaches Cloudflare upload, then fails validation on the current account because the Worker upload is `3792.86 KiB` gzip, above the Workers Free `3 MiB` limit.
- GitHub Pages is still configured with:
  - source: `main:/docs`
  - custom domain: `lifepage.one`
- Live DNS is still pointed at GitHub Pages:
  - `lifepage.one` resolves to GitHub Pages IPs
  - `www.lifepage.one` CNAMEs to `charlie2233.github.io`
- Domain nameservers are still Porkbun, not Cloudflare.
- Worker auth is available locally via Wrangler, and the Worker already has some secrets, but not enough for production launch.

## Required production architecture

### Canonical path

1. User requests `https://lifepage.one`
2. Cloudflare DNS resolves the zone to Cloudflare
3. Cloudflare routes the domain to the `lifepage-web` Worker
4. OpenNext Worker serves the Next.js app
5. Worker calls the production Postgres database
6. Auth, billing, APIs, and public portfolio routes are served from the same canonical host

### Fallback path

- `https://charlie2233.github.io/My_portforlio/` may remain as a static fallback landing page
- `lifepage.one` and `www.lifepage.one` must be detached from GitHub Pages before production cutover

## Required secrets

### Core app

- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_URL`
- `OPENAI_API_KEY`
- `CRON_SECRET`

### Stripe

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PLUS_MONTHLY_PRICE_ID`
- `STRIPE_PLUS_YEARLY_PRICE_ID`
- `STRIPE_PRO_MONTHLY_PRICE_ID`
- `STRIPE_PRO_YEARLY_PRICE_ID`

### Cloudflare SaaS custom domains

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_SAAS_ZONE_ID`
- `CLOUDFLARE_SAAS_CNAME_TARGET`
- `CLOUDFLARE_SAAS_FALLBACK_ORIGIN`

### Project video storage

- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `R2_ACCOUNT_ID`
- `R2_PUBLIC_BASE_URL`

## Worker release sequence

### Phase A: staging health

1. Confirm `npx wrangler whoami`
2. Confirm production DB connectivity from the Worker environment
3. Populate all required Worker secrets
4. Resolve the current Worker size-limit blocker:
   - either upgrade the Cloudflare Workers plan so the deployment can use the paid `10 MiB` limit
   - or refactor to a multi-worker/smaller-bundle deployment path
5. Run `npm run cf:build`
6. Deploy to Worker preview with `npm run cf:deploy`
7. Smoke-test the `*.workers.dev` hostname

### Phase B: canonical domain cutover

1. Remove GitHub Pages custom domain configuration for `lifepage.one`
2. Remove `docs/CNAME` or replace it with no custom domain binding
3. Move the authoritative DNS for `lifepage.one` to Cloudflare, or otherwise place the zone fully under Cloudflare DNS
4. Add Worker routes/custom-domain bindings for:
   - `lifepage.one/*`
   - `www.lifepage.one/*`
5. Set `AUTH_URL=https://lifepage.one`
6. Re-run smoke tests against the real domain

### Phase C: after cutover

1. Validate auth login and session refresh
2. Validate DB-backed reads and writes
3. Validate Stripe checkout, webhook sync, and billing portal
4. Validate public pages and resume export
5. Validate Cloudflare custom-domain management still works for customer subdomains

## Known blockers from the 2026-03-31 audit

- `lifepage.one` is still bound to GitHub Pages
- Cloudflare is not yet authoritative for the domain
- Worker production routing is not defined in `wrangler.jsonc`
- The current Worker bundle exceeds the Workers Free compressed size limit during deploy validation (`3792.86 KiB` gzip vs `3 MiB` max)
- Production Stripe secrets are not present in the local release environment
- Production R2 and Cloudflare SaaS secrets are not present in the local release environment
- No dedicated deployment/operations docs existed before this file

## Deployment policy

- GitHub Pages is fallback-only
- Workers is the only real application runtime
- `lifepage.one` must resolve to the Worker before launch is declared complete
- Deployments are not complete until auth, DB, Stripe, smoke tests, and monitoring are verified on the canonical host
