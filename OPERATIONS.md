# LifePage Operations

Last updated: 2026-03-31

## Services in scope

- Next.js app on Cloudflare Workers
- PostgreSQL via Prisma
- Auth.js credentials auth
- Stripe billing and webhook ingestion
- Cloudflare for SaaS custom-domain management
- Cloudflare R2 project-video storage
- GitHub Pages fallback landing page

## Canonical host rules

- Canonical production host: `https://lifepage.one`
- Optional fallback landing page only: `https://charlie2233.github.io/My_portforlio/`
- `*.workers.dev` is valid for staging and emergency diagnosis, not as the public production URL after cutover

## Pre-launch operational checks

- Wrangler auth works
- Cloudflare account can accept the current Worker bundle size, or the app is split so it fits the deployed plan
- Worker deployment succeeds
- Production secrets are present
- Database migrations/schema are aligned
- Stripe products, prices, and webhook endpoint are configured
- GitHub Pages no longer owns `lifepage.one`
- Monitoring is active

## Smoke-test matrix

### Host and routing

- `GET /` on `lifepage.one` returns the real app
- `GET /explore` loads
- `GET /login` and `GET /register` load
- `GET /dashboard` redirects correctly for anonymous users

### Auth

- Register a new account
- Log in with credentials
- Refresh the session and confirm persistence
- Log out successfully

### Data and app flows

- Crawl a test URL
- Generate a profile
- Load `/u/<username>`
- Load `/api/resume?username=<username>`
- Toggle privacy and confirm public access is blocked

### Billing

- Start checkout for `Plus`
- Complete a Stripe test payment
- Confirm webhook delivery and billing sync
- Open billing portal
- Validate cancel-at-period-end state

### Domains

- Save a customer subdomain
- Confirm required CNAME target is shown
- Verify DNS and activation lifecycle

## Monitoring minimum bar

- Worker observability enabled in `wrangler.jsonc`
- Error/event monitoring configured and reachable from production
- Release owner can inspect logs during and after cutover
- Billing webhook failures are visible
- Auth failures are visible
- Worker deploy failures from size validation are visible and documented

## Incident handling

### If the Worker deploy is bad

1. Roll back to the last known-good Worker deployment
2. Keep `lifepage.one` on the last known-good route
3. Freeze new schema or secret changes
4. Diagnose from Worker logs and CI artifacts

### If billing is broken

1. Disable upgrade CTAs if needed
2. Verify Stripe webhook delivery
3. Replay failed events in Stripe
4. Confirm `/api/billing` returns correct state

### If auth is broken

1. Confirm `AUTH_SECRET` and `AUTH_URL`
2. Confirm cookie/session behavior on the canonical domain
3. Check redirect loops and host-header handling

### If DB access is broken

1. Validate `DATABASE_URL`
2. Confirm network access from Workers to the database
3. Check Prisma adapter/runtime compatibility

## Rollback policy

- Primary rollback target: previous Worker deployment/version
- Secondary rollback target: temporary use of `*.workers.dev` for internal diagnosis only
- GitHub Pages is not a rollback target for the full application runtime

## Ownership

- Release owner: LifePage release engineer / lead full-stack developer
- Deferred work must be tracked in Linear before launch sign-off
