# LifePage Deployment

Last updated: 2026-03-31

## Canonical production path

- Real app host: Cloudflare Workers
- Canonical production domain: `https://lifepage.one`
- Worker staging host: `*.workers.dev`
- GitHub Pages role: fallback-only landing page at `https://charlie2233.github.io/My_portforlio/`

GitHub Pages must not be treated as the runtime for auth, billing, database access, or API traffic.

## Current audited state

- Cloudflare deployment is the real application path in repo code and scripts:
  - `npm run cf:build`
  - `npm run cf:preview`
  - `npm run cf:deploy`
- The repo fallback assets now describe Pages as fallback-only, and `docs/CNAME` is removed.
- `wrangler.jsonc` targets the OpenNext Worker bundle, but production routes for `lifepage.one` are not declared yet.
- CI validates the Cloudflare build path in `.github/workflows/ci.yml`.
- GitHub Pages still publishes `docs/` and is still configured with the custom domain `lifepage.one` in repository settings.
- `lifepage.one` and `www.lifepage.one` still resolve to GitHub Pages today, which conflicts with the intended Cloudflare production path.

## Deployment policy

### Workers

- Workers is the only canonical production runtime.
- `lifepage.one` and `www.lifepage.one` should route to the Worker after cutover.
- `*.workers.dev` is for staging, preview, and emergency diagnosis.

### GitHub Pages

- Keep Pages only as a lightweight fallback landing page.
- Keep the Pages site on the `github.io` URL only.
- Do not bind `lifepage.one` or `www.lifepage.one` to Pages.

## Required repo state before cutover

- `docs/CNAME` removed
- README and deployment docs describe Workers as canonical and Pages as fallback-only
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

- Resolve the current Cloudflare Worker deployment blocker on the target account
- Add production Worker routes in `wrangler.jsonc`
- Deploy and verify the Worker on `*.workers.dev`
- Confirm auth and DB-backed flows
- Confirm Stripe checkout, webhook sync, and billing portal
- Cut over `lifepage.one`
