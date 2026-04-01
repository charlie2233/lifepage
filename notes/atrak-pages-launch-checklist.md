# Atrak Pages Launch Checklist

Date: 2026-04-01
Release branch: `release/atrak-pages-launch`

## Scope

- Public product name: **Atrak Pages**
- Canonical production domain: `pages.atrak.dev`
- Legacy transition domain: `lifepage.one`
- GitHub Pages: fallback-only static landing page
- Preferred runtime host for launch: **Vercel**
- Cloudflare remains in the stack for R2 and Cloudflare for SaaS custom domains; current DNS changes for launch are handled in Porkbun

## Integrated work

- PR #17: post-launch enhancement sprint
- PR #18: custom-domain hardening
- PR #19: hosting contingency memo

## Current provider state

- GitHub Pages is currently enabled for this repo and still attached to `lifepage.one`
- Repo Pages source is `main:/docs`
- DNS for `pages.atrak.dev` and `lifepage.one` is currently managed at Porkbun
- Vercel account access is present for team `charlie2233s-projects`
- No Vercel project exists yet for this repo

## Manual actions before launch

### 1. Create the Vercel project

1. In Vercel, create a new project from `charlie2233/My_portforlio`.
2. Put it under team `charlie2233s-projects`.
3. Set the production branch to `release/atrak-pages-launch` for the cutover window, or merge first and deploy `main`.

### 2. Add production environment variables in Vercel

Required:

- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_URL=https://pages.atrak.dev`
- `OPENAI_API_KEY`
- `OPENAI_SORA_MODEL`
- Stripe secrets and price ids
- R2 credentials and public base URL
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_SAAS_ZONE_ID`
- `CLOUDFLARE_SAAS_CNAME_TARGET`
- `CLOUDFLARE_SAAS_FALLBACK_ORIGIN`

Optional but recommended:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_BROWSER_RENDERING_TOKEN`

### 3. Deploy and smoke test the Vercel preview

Run this before touching DNS:

- `/`
- `/login`
- `/register`
- `/dashboard`
- `/explore`
- one public page `/u/<username>`
- one public resume `/u/<username>/resume`
- crawl import
- generate profile
- Stripe checkout boot
- custom-domain save/verify flow

### 4. Cut over `pages.atrak.dev`

1. In Vercel, add `pages.atrak.dev` as the production domain.
2. In Porkbun DNS for `atrak.dev`, create or update the `pages` record to the Vercel target shown by Vercel.
3. Wait for certificate issuance and verify HTTPS on `https://pages.atrak.dev`.
4. Confirm `AUTH_URL` in Vercel remains `https://pages.atrak.dev`.

### 5. Keep GitHub Pages fallback-only

1. Keep repo GitHub Pages enabled on `main:/docs`.
2. Do **not** attach `pages.atrak.dev` to GitHub Pages.
3. Remove the `lifepage.one` custom domain from GitHub Pages once the Vercel app and redirect path are verified.
4. Keep `/docs/index.html` as the static fallback page at `https://charlie2233.github.io/My_portforlio/`.
5. Keep `/docs/CNAME` out of the repo so future Pages publishes do not reattach a custom domain automatically.

### 6. Legacy-domain handling for `lifepage.one`

Launch-safe option:

- point or forward `lifepage.one` and `www.lifepage.one` to `https://pages.atrak.dev`

Optional follow-up after the main launch is stable:

- move the redirect management into Cloudflare later if you migrate DNS there
- keep the GitHub Pages fallback isolated at the repo URL so it can stay break-glass only

### 7. Custom-domain launch posture

- Launch only subdomain custom domains for users
- Do not promise apex-domain support yet
- Keep Cloudflare for SaaS as the provider layer for customer custom domains
- If custom domains go live immediately, ensure `CLOUDFLARE_SAAS_FALLBACK_ORIGIN` points to the Cloudflare-managed fallback origin that fronts the Vercel app
- Leave `atrak.dev` and `www.atrak.dev` on the separate marketing-site path for this launch window

## Verification matrix

Run before announcing launch:

- `npx prisma generate`
- `npm run test:unit`
- `npx tsc --noEmit`
- targeted `eslint` on touched files or full `npm run lint` if time permits
- `npm run build`
- `npm run test:e2e:ci`
- optional contingency validation: `npm run cf:build`

## Rollback

If the Vercel cutover fails:

1. Remove or revert the `pages.atrak.dev` DNS record in Porkbun.
2. Keep the GitHub Pages fallback reachable at `https://charlie2233.github.io/My_portforlio/`.
3. If you already moved `lifepage.one`, point or forward it back to the fallback page or temporarily leave it detached while the app issue is corrected.
4. Redeploy the last known-good Vercel deployment or pause the custom-domain announcement.
5. If needed, fall back to the in-repo Cloudflare Workers contingency path after env validation.

If the brand rename needs to be rolled back:

1. Revert the release-branch rename commit.
2. Leave infrastructure unchanged.
3. Keep `pages.atrak.dev` as the deployment hostname if the runtime is already healthy, or pause launch until copy is corrected.

## Launch message guardrails

- Say **Atrak Pages** in all public-facing copy
- Say `pages.atrak.dev` is the canonical app
- Say `lifepage.one` is a transition/fallback URL
- Do not describe GitHub Pages as the real app host
- Do not promise apex custom domains
