# LifePage Deployment

Last updated: 2026-03-31

## Canonical production path

- Real app host: Cloudflare Workers
- Canonical production domain: `https://lifepage.one`
- Worker staging host: `*.workers.dev`
- GitHub Pages role: fallback-only landing page at `https://charlie2233.github.io/My_portforlio/`

GitHub Pages must not be treated as the runtime for auth, billing, database access, or API traffic.

For the authoritative environment matrix, setup order, callback URLs, Stripe provider configuration, and troubleshooting steps, use [SECRETS.md](SECRETS.md).

## Current audited state

- Cloudflare deployment is the real application path in repo code and scripts:
  - `npm run cf:build`
  - `npm run cf:preview`
  - `npm run cf:deploy`
- `npm run cf:deploy` now resolves to `wrangler deploy --minify --keep-vars`, which is required for Workers Free bundle limits.
- Staging deploy is live at `https://lifepage-web.charliehan-lifepage.workers.dev`.
- Current staging validation report: [STAGING_VALIDATION_REPORT.md](STAGING_VALIDATION_REPORT.md).
- Production cutover runbook: [CUTOVER_CHECKLIST.md](CUTOVER_CHECKLIST.md).
- Production cutover status report: [PRODUCTION_CUTOVER_REPORT.md](PRODUCTION_CUTOVER_REPORT.md).
- The repo fallback assets now describe Pages as fallback-only, and `docs/CNAME` is removed.
- `wrangler.jsonc` targets the OpenNext Worker bundle, but production routes for `lifepage.one` are not declared yet.
- CI validates the Next build, the Cloudflare build, the standard Playwright suite, and the Worker-preview smoke suite in `.github/workflows/ci.yml`.
- GitHub branch protection on `main` now requires the `test-and-build` check before merge.
- GitHub Pages still publishes `docs/` and is still configured with the custom domain `lifepage.one` in repository settings.
- `lifepage.one` and `www.lifepage.one` still resolve to GitHub Pages today, which conflicts with the intended Cloudflare production path.
- `lifepage.one` is not currently onboarded to Cloudflare DNS. Authoritative nameservers still point at Porkbun.
- The active Cloudflare token cannot create the missing zone, so registrar and zone onboarding remain manual blockers.
- The current staging blocker is no longer bundle size. It is Cloudflare Worker access to the configured Postgres instance.

## Deployment policy

### Workers

- Workers is the only canonical production runtime.
- `lifepage.one` and `www.lifepage.one` should route to the Worker after cutover.
- `www.lifepage.one` should permanently redirect to `https://lifepage.one`.
- `*.workers.dev` is for staging, preview, and emergency diagnosis.

### GitHub Pages

- Keep Pages only as a lightweight fallback landing page.
- Keep the Pages site on the `github.io` URL only.
- Do not bind `lifepage.one` or `www.lifepage.one` to Pages.

## Required repo state before cutover

- `docs/CNAME` removed
- README and deployment docs describe Workers as canonical and Pages as fallback-only
- `SECRETS.md` reflects the current Worker secret matrix and provider-side setup
- Worker routes added for the real production domain
- Production secrets provisioned in Cloudflare
- Worker staging verified on `*.workers.dev`

## Manual cutover actions outside the repo

1. Remove the GitHub Pages custom domain for `lifepage.one`
2. Move DNS for `lifepage.one` and `www.lifepage.one` to Cloudflare
3. Attach `lifepage.one/*` and `www.lifepage.one/*` to the Worker
4. Set `AUTH_URL=https://lifepage.one`
5. Run post-cutover smoke checks

## Next phase checklist

- Provision the full Worker secret set from `SECRETS.md`
- Fix the staging `DATABASE_URL` so Workers can reach Postgres
- Create or gain access to the `lifepage.one` Cloudflare zone
- Update Porkbun nameservers to Cloudflare once the zone exists
- Create the Stripe catalog, Billing Portal config, and webhook endpoint
- Add production Worker routes in `wrangler.jsonc`
- Deploy and verify the Worker on `*.workers.dev`
- Confirm auth and DB-backed flows
- Confirm Stripe checkout, webhook sync, and billing portal
- Cut over `lifepage.one`
