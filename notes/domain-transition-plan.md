# Domain Transition Plan

Date: 2026-04-01
Branch: `release/atrak-pages-launch`

## Goal

- Canonical app host: `https://pages.atrak.dev`
- Legacy transition domain: `https://lifepage.one`
- Optional alias: `https://www.pages.atrak.dev`
- GitHub Pages fallback only: `https://charlie2233.github.io/My_portforlio/`

## Current Live State

Verified on 2026-04-01:

- `pages.atrak.dev`: does not resolve yet
- `lifepage.one`: resolves to GitHub Pages and returns `200`
- `www.lifepage.one`: redirects to `https://lifepage.one/`
- `https://charlie2233.github.io/My_portforlio/`: still redirects to `https://lifepage.one/`
- GitHub Pages API still reports:
  - `cname: lifepage.one`
  - source `main:/docs`

## Code-Level Transition Behavior

This branch now includes a host-based redirect safety net in [dashboard-auth-gate.ts](/Users/hanfei/.tmp/atrak-pages-launch/src/lib/dashboard-auth-gate.ts) and [proxy.ts](/Users/hanfei/.tmp/atrak-pages-launch/src/proxy.ts):

- `lifepage.one` -> `pages.atrak.dev`
- `www.lifepage.one` -> `pages.atrak.dev`
- `www.pages.atrak.dev` -> `pages.atrak.dev`

Behavior:

- redirect preserves path and query string
- redirect applies to `GET` and `HEAD` page requests
- API routes are not redirected in-app
- canonical URLs, OG URLs, sitemap, robots, and Stripe return URLs all derive from the configured app base URL
- this redirect is a safety net, not the preferred primary redirect mechanism for the legacy domain

## Canonical URL Configuration

Production should set:

- `AUTH_URL=https://pages.atrak.dev`

Optional fallback envs now supported consistently across canonical and billing helpers:

- `NEXTAUTH_URL`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_APP_URL`
- `APP_URL`

Recommended rule: in production, rely on `AUTH_URL` as the single source of truth for the canonical host.

## Provider-Side Manual Steps

### 1. Vercel

This session could not authenticate to Vercel, so these are manual steps.

1. Create or link the Vercel project for `charlie2233/My_portforlio`.
2. Set production env vars, especially:
   - `AUTH_URL=https://pages.atrak.dev`
   - database, Stripe, R2, and Cloudflare SaaS vars already listed in the launch checklist
3. Deploy the release branch.
4. Add these domains in Vercel:
   - `pages.atrak.dev`
   - optional: `www.pages.atrak.dev`
5. For each domain, use the exact DNS target that Vercel shows after the domain is added.

Recommended option:

- use Vercel for the canonical production runtime on `pages.atrak.dev`
- keep `www.pages.atrak.dev` as an optional alias only if you want it, and redirect it to the apex subdomain in Vercel

Fallback option:

- if Porkbun forwarding is not sufficient for the legacy domain, also attach `lifepage.one` and `www.lifepage.one` to the same Vercel project and let the app-level redirect handle them there

### 2. Porkbun DNS

Current authoritative DNS is at Porkbun.

For the canonical host:

1. Set `pages.atrak.dev` to the Vercel target shown by Vercel.
2. If you want `www.pages.atrak.dev`, point it to the Vercel target for that alias.

Do not guess the final record values before Vercel verifies the domains. Use the exact target Vercel returns.

For the legacy transition domain:

1. Remove any GitHub Pages DNS records for `lifepage.one` and `www.lifepage.one`.
2. Add URL forwarding in Porkbun:
   - `lifepage.one` -> `https://pages.atrak.dev`
   - `www.lifepage.one` -> `https://pages.atrak.dev`
3. Turn on permanent redirect behavior (`301`) and preserve the request path if Porkbun exposes that option in the forwarding UI.
4. If Porkbun forwarding does not preserve the query string or the needed path behavior, fall back to attaching those domains in Vercel and using the in-app redirect safety net.

### 3. GitHub Pages

1. In repo Settings -> Pages, remove the custom domain `lifepage.one`.
2. Keep Pages enabled on `main:/docs`.
3. Confirm `https://charlie2233.github.io/My_portforlio/` serves the fallback page directly instead of redirecting to `lifepage.one`.
4. Do not attach `pages.atrak.dev` to GitHub Pages.

### 4. Cloudflare

No DNS cutover is required in Cloudflare for this launch if Porkbun remains authoritative.

Cloudflare remains relevant for:

- R2 asset storage
- Cloudflare for SaaS customer custom domains

If custom domains launch immediately, keep `CLOUDFLARE_SAAS_FALLBACK_ORIGIN` pointed at the origin that fronts the Vercel app.

## Redirect Matrix

| Incoming host | Expected result | Where enforced |
|---|---|---|
| `pages.atrak.dev` | `200` canonical app | Vercel app |
| `www.pages.atrak.dev` | `301` or `308` to `https://pages.atrak.dev` with same path/query | Vercel domain redirect or app-level safety net |
| `lifepage.one` | `301` to `https://pages.atrak.dev` with same path, or `308` if routed through app | Porkbun forwarding preferred, app redirect as safety net |
| `www.lifepage.one` | `301` to `https://pages.atrak.dev` with same path, or `308` if routed through app | Porkbun forwarding preferred, app redirect as safety net |
| `charlie2233.github.io/My_portforlio/` | `200` fallback landing page | GitHub Pages |

Notes:

- Provider-level redirects may appear as `301` or `308` depending on platform behavior.
- The branch code is written to issue permanent `308` redirects inside the app if the legacy or alias host reaches the runtime.

## QA Checklist For Cutover

After provider changes:

1. `https://pages.atrak.dev` returns the app over HTTPS
2. `https://lifepage.one` redirects to `https://pages.atrak.dev`
3. `https://www.lifepage.one` redirects to `https://pages.atrak.dev`
4. optional: `https://www.pages.atrak.dev` redirects to `https://pages.atrak.dev`
5. `https://charlie2233.github.io/My_portforlio/` serves the fallback page without redirecting away
6. auth completes with callbacks landing on `https://pages.atrak.dev`
7. Stripe checkout success/cancel and billing portal return to `https://pages.atrak.dev/dashboard#settings-billing`
8. public portfolio share actions open the canonical or current custom-domain URL, never `lifepage.one`
9. `https://pages.atrak.dev/robots.txt` and `https://pages.atrak.dev/sitemap.xml` resolve with canonical URLs
10. OG images and metadata resolve to `https://pages.atrak.dev/...`

## Rollback Plan

If cutover fails:

1. Remove or revert the Porkbun DNS changes for `pages.atrak.dev`.
2. If `lifepage.one` was already moved, either:
   - point it back to the GitHub Pages fallback temporarily, or
   - leave it detached until the app issue is fixed.
3. Reattach `lifepage.one` in GitHub Pages settings only if you need the old fallback behavior back.
4. Leave `https://charlie2233.github.io/My_portforlio/` as the break-glass fallback page.
5. Keep `AUTH_URL` unchanged until the canonical app host is healthy again.
