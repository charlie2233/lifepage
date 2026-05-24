# lifepage.one Cutover Status

Date: 2026-05-24
Branch: `release/atrak-pages-launch`
Commit: `9d8bc52`

## What Changed

- The release branch now treats `lifepage.one` as the canonical host.
- Legacy redirect handling now treats `pages.atrak.dev` as the old hostname instead of the primary one.
- Production `AUTH_URL` in Vercel was updated to `https://lifepage.one`.
- A fresh Vercel production deployment was created from the current release head:
  - deployment id: `dpl_6r4idQ4wp5whYLZHrbd28E1MXTPX`
  - deployment URL: `https://atrak-pages-8dbp2ikrg-charlie2233s-projects.vercel.app`
- Since then, preview launch-plumbing was hardened and re-verified:
  - new-user registration works
  - authenticated session persistence works
  - default profile generation works
  - first agent mutation works
  - all of the above are green on the stable preview alias after switching default OpenAI models to `gpt-4.1` / `gpt-4.1-mini`

## Verified Green

- Unit tests passed after the canonical-host patch.
- `npx tsc --noEmit` passed after the patch.
- The fresh production deployment completed successfully.
- The deployment URL now emits:
  - canonical `https://lifepage.one`
  - OG URL `https://lifepage.one`
  - robots host `https://lifepage.one`
  - sitemap URLs under `https://lifepage.one/...`
- Vercel aliases now point `lifepage.one`, `www.lifepage.one`, `pages.atrak.dev`, and `www.pages.atrak.dev` at the fresh production deployment.
- Production auth and DB-backed runtime are green on the Vercel deployment URL:
  - `/api/auth/register` creates a real user
  - `/api/auth/session` returns a real authenticated session
  - the credentials callback responds with `302 Location: https://lifepage.one/dashboard`
- Production billing is truthfully blocked in the expected way:
  - `/api/billing/checkout` returns `503 Stripe billing is not configured.`
  - `/api/billing/portal` returns `503 Stripe billing is not configured.`
- The current stable preview alias is now healthy for:
  - auth
  - DB-backed profile generation
  - agent headline mutation
  - public profile rendering

## Still Blocked

- Production Stripe billing envs are still missing in Vercel:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_PLUS_MONTHLY_PRICE_ID`
  - `STRIPE_PLUS_YEARLY_PRICE_ID`
  - `STRIPE_PRO_MONTHLY_PRICE_ID`
  - `STRIPE_PRO_YEARLY_PRICE_ID`
- Because of that, billing is not honestly launch-ready:
  - checkout session creation would return `503 Stripe billing is not configured.`
  - billing portal session creation would return `503 Stripe billing is not configured.`
- GitHub Pages still owns the custom domain `lifepage.one`.
- Porkbun DNS still points to GitHub Pages:
  - `lifepage.one` -> `185.199.110.153`, `185.199.111.153`, `185.199.108.153`
  - `www.lifepage.one` -> `charlie2233.github.io`

## Do Not Do Yet

Do not remove the GitHub Pages custom domain and do not flip Porkbun DNS until the Stripe production envs are real and complete. Doing that early would expose a public host with broken billing.

## Exact Remaining Manual Actions

1. Add the six production Stripe envs in Vercel with real values.
2. Redeploy production once more after those envs exist so checkout and portal pick them up.
3. Remove `lifepage.one` from GitHub Pages settings.
4. Change Porkbun DNS to Vercel:
   - `A lifepage.one 76.76.21.21`
   - `A www.lifepage.one 76.76.21.21`
5. Wait for DNS to propagate, then verify:
   - `https://lifepage.one/`
   - `https://lifepage.one/login`
   - `https://lifepage.one/robots.txt`
   - `https://lifepage.one/sitemap.xml`
   - authenticated billing entry, checkout, return, and portal

## Go / No-Go

- Public cutover: `No-go`
- Reason: production billing is still not configured, and public DNS still points to GitHub Pages.
