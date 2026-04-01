# Atrak Pages Incident Checklist

Date: 2026-04-01
Branch: `release/atrak-pages-launch`

## Primary incident classes

### 1. Production host is down or unhealthy

1. Identify the active runtime:
   - Vercel preview or production deployment
   - Cloudflare Worker fallback
   - GitHub Pages fallback page only
2. Check whether the issue is:
   - build/deploy failure
   - runtime error
   - auth/session loop
   - database connectivity
   - Stripe webhook drift
   - custom-domain provider state
3. Freeze DNS changes until the failure mode is understood.

### 2. Domain cutover failed

1. Verify `pages.atrak.dev` resolves to the intended runtime.
2. Verify `lifepage.one` and `www.lifepage.one` redirect to `https://pages.atrak.dev`.
3. Verify `https://charlie2233.github.io/My_portforlio/` remains a static fallback only.
4. If the canonical host is unhealthy, revert the DNS change first before changing application code.

### 3. Auth is broken

1. Confirm `AUTH_URL` matches the canonical host.
2. Confirm `AUTH_SECRET` is present in the target runtime.
3. Verify sign-up and sign-in on:
   - `/register`
   - `/login`
   - `/dashboard`
4. If auth callbacks are looping, roll back to the last known-good deployment before changing domains again.

### 4. Database is unreachable

1. Confirm `DATABASE_URL` points at a remotely reachable Postgres, not `localhost`.
2. Verify migrations or schema compatibility if a new database was provisioned.
3. Test:
   - account registration
   - dashboard load
   - evidence list
   - profile generation write path
4. If the DB is the issue, do not proceed with launch even if landing pages still render.

### 5. Stripe is degraded

1. Confirm `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and all four price ids exist in the active runtime.
2. Test:
   - checkout session creation
   - webhook receipt
   - billing portal redirect
3. If Stripe fails, disable launch messaging around paid plans until fixed.

### 6. Custom-domain provisioning is degraded

1. Confirm the dashboard still renders graceful guidance instead of hard-failing.
2. Confirm these vars exist if live provisioning is expected:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_SAAS_ZONE_ID`
   - `CLOUDFLARE_SAAS_CNAME_TARGET`
   - `CLOUDFLARE_SAAS_FALLBACK_ORIGIN`
3. Inspect structured logs prefixed with `[atrak-pages custom domain]`.
4. If provider config is incomplete, leave the UX in `configuration_required` mode and avoid promising active custom domains.

## Immediate rollback choices

### DNS rollback

1. Point `pages.atrak.dev` away from the unhealthy runtime.
2. Keep `lifepage.one` redirect-only or detached.
3. Keep GitHub Pages fallback available at the repo URL only.

### App rollback

1. Redeploy the last known-good release branch commit.
2. Do not roll back database schema casually on launch day.
3. Prefer application rollback over data rollback.

### Messaging rollback

1. Pause announcements that imply production is healthy.
2. Remove claims that billing or custom domains are fully live if those systems are degraded.
3. Keep the public message factual:
   - canonical host status
   - signup availability
   - portfolio-read availability

## Checks to run before reopening launch

- `/`
- `/login`
- `/register`
- `/dashboard`
- `/explore`
- crawl/import
- AI generation
- public profile
- resume export
- Stripe checkout and portal
- custom-domain save/verify UX
- `robots.txt`
- `sitemap.xml`
- OG preview target
