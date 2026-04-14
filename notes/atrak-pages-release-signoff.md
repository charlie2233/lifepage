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
- targeted Playwright release-gate check `e2e/auth.spec.ts -g "unauthenticated dashboard requests redirect to login"`: passed on 2026-04-01 when run with the local env file
- `npm run test:e2e:ci`: blocked on 2026-04-01 because authenticated flows crash out of the dev server and surface `ERR_CONNECTION_REFUSED`
- `npm run cf:deploy`: blocked on 2026-04-01 because the Worker exceeds the Cloudflare free-plan 3 MiB size limit
- Vercel launch attempt: blocked on 2026-04-01 because no production-ready remote Postgres or readable Stripe/R2/Cloudflare production secrets are available in the repo or shell environment

## Provider state before cutover

- Vercel project linked: `TBD`
- `pages.atrak.dev` added in Vercel: `TBD`
- Porkbun DNS updated for `pages.atrak.dev`: `TBD`
- GitHub Pages custom domain removed: `TBD`
- `lifepage.one` redirect active: `TBD`
- Stripe production webhook verified: `TBD`
- Cloudflare for SaaS env configured in production: `TBD`
- Cloudflare Worker contingency deploy accepted by account plan: `TBD`
- Existing Cloudflare Worker service `lifepage-web` has all required secret names configured, but those values are not readable from this session
- Existing `workers.dev` host is still serving a stale LifePage build, not the current Atrak Pages release branch

## Release-candidate polish included

The release candidate includes only the low-risk PR #21 subset:

- signup submit and failure instrumentation
- first-run clarity improvements in register and dashboard
- public profile and resume cleanup
- safer public screenshot handling on portfolio surfaces

Deferred on purpose:

- sprint-only notes and screenshot artifacts
- any new broad polish scope that does not directly unblock launch

## Go / no-go criteria

- Public app is healthy on a Vercel preview and on `pages.atrak.dev`
- Auth works with `AUTH_URL=https://pages.atrak.dev`
- Crawl, generate, public page, public resume, and custom-domain flows all pass smoke checks
- `lifepage.one` no longer acts as the real app host
- GitHub Pages is reachable only as a fallback landing page

## Open blocker

- Resolve the Vercel production-host blocker before launch. The current Codex environment is not authenticated to a Vercel project, so the preferred production path cannot be completed from here yet.
- Resolve the DNS blocker before launch. `pages.atrak.dev` does not resolve yet, and GitHub Pages still owns `lifepage.one`.
- Resolve the contingency-host blocker before launch. The current OpenNext Worker bundle exceeds the free-plan 3 MiB Worker size limit, so the Cloudflare Worker fallback cannot be redeployed on the current plan without slimming the bundle or upgrading the account.
- Resolve the Playwright release-gate failure before launch. The unauthenticated redirect spec passes, but authenticated flows currently fail after sign-in with `ERR_CONNECTION_REFUSED`, which implies the local Next dev server drops during the authenticated E2E run.
- Provision a remotely reachable production Postgres for Vercel or export the existing Worker `DATABASE_URL` into Vercel manually.
- Provide readable Stripe, R2, and Cloudflare for SaaS production env values for Vercel, or keep launch off Vercel.
- Upgrade the Cloudflare account to a paid Workers plan or reduce the bundle under 3 MiB if Workers remains the only viable production host.

## Launch decision

- Decision: `TBD`
- Notes: `TBD`

## Rollback owner

- DNS rollback operator: `TBD`
- App rollback operator: `TBD`
- Customer communication owner: `TBD`
