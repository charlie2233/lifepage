# lifepage.one Cutover Status

Date: 2026-05-24
Branch: `release/atrak-pages-launch`
Commit: `74d9448`

## What Changed

- The release branch now treats `lifepage.one` as the canonical host.
- Legacy redirect handling now treats `pages.atrak.dev` as the old hostname instead of the primary one.
- Production `AUTH_URL` in Vercel was updated to `https://lifepage.one`.
- A fresh Vercel production deployment was created from the current release head:
  - deployment id: `dpl_CSELehvQtkU3R2kZfNBwqrmFcsbq`
  - deployment URL: `https://atrak-pages-q6m8i7qk6-charlie2233s-projects.vercel.app`
- Since then, preview launch-plumbing was hardened and re-verified:
  - new-user registration works
  - authenticated session persistence works
  - default profile generation works
  - first agent mutation works
  - all of the above are green on the stable preview alias after switching default OpenAI models to `gpt-4.1` / `gpt-4.1-mini`
- The live edit agent now honors explicit headline replacement requests exactly on production.

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
- Production AI runtime is green on the Vercel deployment URL:
  - `/api/crawl` imports evidence
  - `/api/generate` creates a real active profile
  - `/api/agent` now preserves explicit headline text such as `Update my headline to Full-Stack Engineer building AI tools`
- Production billing is truthfully blocked in the expected way:
  - `/api/billing/checkout` returns `503 Stripe billing is not configured.`
  - `/api/billing/portal` returns `503 Stripe billing is not configured.`
- The dashboard already degrades safely when Stripe is missing:
  - paid plan actions stay disabled
  - the billing section shows a warning instead of a broken flow
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
- Because of that, paid billing cannot launch yet:
  - checkout session creation returns `503 Stripe billing is not configured.`
  - billing portal session creation returns `503 Stripe billing is not configured.`
- GitHub Pages still owns the custom domain `lifepage.one`.
- Porkbun DNS still points to GitHub Pages:
  - `lifepage.one` -> `185.199.110.153`, `185.199.111.153`, `185.199.108.153`
  - `www.lifepage.one` -> `charlie2233.github.io`

## Do Not Do Yet

Do not remove the GitHub Pages custom domain until Porkbun DNS is ready to flip in the same move. DNS still points at GitHub Pages today, so removing the GitHub Pages custom domain too early would only break the current fallback before the real app is reachable.

## Exact Remaining Manual Actions

1. Remove `lifepage.one` from GitHub Pages settings at the same time the DNS change is ready.
2. Change Porkbun DNS to Vercel:
   - `A lifepage.one 76.76.21.21`
   - `A www.lifepage.one 76.76.21.21`
3. Wait for DNS to propagate, then verify:
   - `https://lifepage.one/`
   - `https://lifepage.one/login`
   - `https://lifepage.one/robots.txt`
   - `https://lifepage.one/sitemap.xml`
   - authenticated AI generation and agent edit flows
4. Add the six production Stripe envs in Vercel whenever paid billing is ready to launch.

## Go / No-Go

- Public cutover: `No-go`
- Reason: public DNS still points to GitHub Pages, and Porkbun access is still required to cut the domain over to Vercel.
