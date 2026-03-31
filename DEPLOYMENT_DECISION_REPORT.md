# LifePage Deployment Decision Report

Last updated: 2026-03-31

## Current state

- The real application runtime is a dynamic Next.js app with auth, billing, APIs, Prisma, and Cloudflare-specific deployment code.
- `package.json` defines Cloudflare Worker scripts:
  - `npm run cf:build`
  - `npm run cf:preview`
  - `npm run cf:deploy`
- `scripts/cf-build.mjs` prepares the Cloudflare middleware shim and builds the OpenNext Worker bundle.
- `wrangler.jsonc` points the app at `.open-next/worker.js` and enables `workers_dev`, which makes Worker preview/staging the intended Cloudflare path.
- `.github/workflows/ci.yml` validates the app with lint, Next build, Cloudflare build, and Playwright E2E. There is no GitHub Pages deploy workflow.
- The repo fallback assets now describe GitHub Pages as fallback-only, and `docs/CNAME` is removed so the repo no longer reasserts `lifepage.one` as a Pages domain.
- GitHub Pages is configured outside the repo to publish `main:/docs`, and the live Pages setting still binds `lifepage.one` as the custom domain.
- Live DNS for `lifepage.one` and `www.lifepage.one` still resolves to GitHub Pages.
- The `docs/` directory is a static fallback landing page, not the full app.

## Conflicts

### GitHub Pages vs Cloudflare Workers

- GitHub Pages settings currently advertise `https://lifepage.one/` as the Pages site URL.
- Live DNS still points `lifepage.one` and `www.lifepage.one` at GitHub Pages even though the real app must run on Cloudflare Workers.
- `wrangler.jsonc` does not yet declare production routes for `lifepage.one/*` or `www.lifepage.one/*`, so the canonical Cloudflare path is not fully wired in-repo yet.
- Historical repo conflicts addressed by this cleanup:
  - `docs/CNAME` previously bound `lifepage.one` to Pages
  - `docs/index.html` previously listed `https://lifepage.one` as a Pages URL
  - `README.md` previously described `*.workers.dev` as the only canonical hostname

## Recommended canonical production path

1. Canonical production runtime: Cloudflare Workers via OpenNext.
2. Canonical production domain: `https://lifepage.one`.
3. Staging/preview host: the Worker `*.workers.dev` hostname only.
4. GitHub Pages role: optional static fallback only at `https://charlie2233.github.io/My_portforlio/`.
5. `lifepage.one` and `www.lifepage.one` must be detached from GitHub Pages before production cutover.

## Keep

- `package.json` Cloudflare scripts
- `scripts/cf-build.mjs`
- `open-next.config.ts`
- `wrangler.jsonc`
- `.github/workflows/ci.yml`
- `docs/index.html`
- `docs/404.html`
- `docs/.nojekyll`
- `docs/favicon.ico`

## Remove or de-emphasize

- Remove `docs/CNAME`
- Remove GitHub Pages custom-domain binding for `lifepage.one` in repository settings
- De-emphasize any README or fallback-page wording that treats GitHub Pages as a real app host
- De-emphasize any wording that treats `*.workers.dev` as the long-term canonical production URL

## Next deployment phase

- Resolve the current Worker deploy blocker on the active Cloudflare account
- Add Worker routes for `lifepage.one/*` and `www.lifepage.one/*`
- Provision all production Worker secrets
- Move DNS authority/routing for `lifepage.one` to Cloudflare
- Smoke-test auth, DB, billing, and public pages on the Worker host before domain cutover
