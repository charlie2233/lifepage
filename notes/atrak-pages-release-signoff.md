# Atrak Pages Release Sign-off

Date: 2026-04-01
Branch: `release/atrak-pages-launch`

## Release owner

- Owner: `TBD`
- Approver: `TBD`
- Launch window: `TBD`

## Candidate identity

- Final commit SHA: `TBD`
- Canonical production host: `https://pages.atrak.dev`
- Legacy transition host: `https://lifepage.one`
- GitHub Pages fallback host: `https://charlie2233.github.io/My_portforlio/`

## Required green checks

- `npx prisma generate`
- `npm run test:unit`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run test:e2e:ci`
- `npm run cf:build` if Workers remains part of the contingency story

Record the final successful timestamps and operator initials here before launch.

## Current verification snapshot

- `npx prisma generate`: passed on 2026-04-01
- `npm run test:unit`: passed on 2026-04-01
- `npx tsc --noEmit`: passed on 2026-04-01
- `npm run lint`: passed on 2026-04-01
- `npm run build`: passed on 2026-04-01 with expected local DB fallback warnings for sitemap and explore generation
- `npm run cf:build`: passed on 2026-04-01 with the same local DB fallback warnings
- `npm run test:e2e:ci`: blocked on 2026-04-01 because authenticated flows crash out of the dev server and surface `ERR_CONNECTION_REFUSED`

## Provider state before cutover

- Vercel project linked: `TBD`
- `pages.atrak.dev` added in Vercel: `TBD`
- Porkbun DNS updated for `pages.atrak.dev`: `TBD`
- GitHub Pages custom domain removed: `TBD`
- `lifepage.one` redirect active: `TBD`
- Stripe production webhook verified: `TBD`
- Cloudflare for SaaS env configured in production: `TBD`

## Go / no-go criteria

- Public app is healthy on a Vercel preview and on `pages.atrak.dev`
- Auth works with `AUTH_URL=https://pages.atrak.dev`
- Crawl, generate, public page, public resume, and custom-domain flows all pass smoke checks
- `lifepage.one` no longer acts as the real app host
- GitHub Pages is reachable only as a fallback landing page

## Open blocker

- Resolve the Playwright release-gate failure before launch. The unauthenticated redirect spec passes, but authenticated flows currently fail after sign-in with `ERR_CONNECTION_REFUSED`, which implies the local Next dev server drops during the authenticated E2E run.

## Launch decision

- Decision: `TBD`
- Notes: `TBD`

## Rollback owner

- DNS rollback operator: `TBD`
- App rollback operator: `TBD`
- Customer communication owner: `TBD`
