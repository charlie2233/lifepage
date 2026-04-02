# Vercel Preview Readiness

Date: 2026-04-02
Branch: `release/atrak-pages-launch`

## What Changed

- Added a deployment-aware host resolver so preview deployments can derive their public base URL from Vercel runtime metadata instead of falling back to `http://localhost:3000`.
- Added a Node engine hint of `22.x` in `package.json` to align the repo with the intended Vercel runtime target.
- Added the currently available real production env values in Vercel for:
  - `AUTH_URL=https://pages.atrak.dev`
  - `AUTH_SECRET`
  - `OPENAI_API_KEY`
  - `OPENAI_SORA_MODEL=sora-2`
- Deployed a fresh preview with deployment-level runtime env injection for:
  - `AUTH_URL=https://atrak-pages-preview.charlie2233s-projects.vercel.app`
  - `AUTH_SECRET`
  - `OPENAI_API_KEY`
- Repointed the stable preview alias:
  - `https://atrak-pages-preview.charlie2233s-projects.vercel.app`
  - now targets
  - `https://atrak-pages-cozi6p6f8-charlie2233s-projects.vercel.app`

## What Is Now Fixed

- The new preview serves the current Atrak Pages release, not stale LifePage branding.
- Landing-page canonical, OG URL, `robots.txt`, and `sitemap.xml` no longer emit `http://localhost:3000`.
- Runtime logs for the new preview no longer show Auth.js `MissingSecret`.
- The stable preview alias now points to the current preview deployment.

## What Remains Blocked

- `DATABASE_URL` is still missing for Vercel. The only locally available value points to `localhost`, which is not valid for preview or production.
- Stripe billing env vars are still missing, so checkout and portal flows are not smoke-testable.
- R2 env vars are still missing, so hosted video-storage paths are not fully validated on Vercel.
- Cloudflare SaaS env vars are still missing, so live provider-backed custom-domain operations are not fully validated on Vercel.
- The Vercel project is not connected to its Git repository in Vercel, so branch-scoped Preview env vars cannot currently be saved.
- The Vercel dashboard project settings still need manual cleanup:
  - Framework Preset should be `Next.js`
  - Node.js Version should be `22.x`

## Exact Manual Actions Still Required

1. In Vercel project `charlie2233s-projects/atrak-pages`, connect the GitHub repo `charlie2233/My_portforlio`.
2. In Vercel project settings, change:
   - Framework Preset: `Other` -> `Next.js`
   - Node.js Version: `24.x` -> `22.x`
3. Add a hosted Postgres `DATABASE_URL` for both Preview and Production.
4. Add Stripe vars for Preview and Production if billing smoke is required:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `STRIPE_PLUS_MONTHLY_PRICE_ID`
   - `STRIPE_PLUS_YEARLY_PRICE_ID`
   - `STRIPE_PRO_MONTHLY_PRICE_ID`
   - `STRIPE_PRO_YEARLY_PRICE_ID`
5. Add R2 vars if hosted project-video storage is required:
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET`
   - `R2_ACCOUNT_ID`
   - `R2_PUBLIC_BASE_URL`
6. Add Cloudflare SaaS vars if live customer-domain operations are required:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_SAAS_ZONE_ID`
   - `CLOUDFLARE_SAAS_CNAME_TARGET`
   - `CLOUDFLARE_SAAS_FALLBACK_ORIGIN`
7. For human preview testing, either:
   - grant the tester Vercel project access, or
   - generate a Vercel shareable link / protection bypass token in the Vercel dashboard

## Go / No-Go For Domain Cutover

- `No-go`

The preview is now materially healthier and honestly testable for public, unauthenticated pages and metadata behavior, but domain cutover should wait until:

- Vercel project settings are corrected
- a hosted `DATABASE_URL` is configured
- auth persistence and registration are re-tested
- billing envs are present if billing is part of launch scope
