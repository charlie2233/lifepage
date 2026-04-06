# Database Readiness And Auth Smoke

Date: 2026-04-06
Branch: `release/atrak-pages-launch`

## What Changed

- Provisioned and connected a real hosted Neon Postgres database to the existing Vercel project `charlie2233s-projects/atrak-pages`.
- Verified `DATABASE_URL` and the provider-injected Postgres companion variables are present for both Preview and Production scopes in Vercel.
- Updated Prisma config to prefer provider-injected schema-safe connection URLs when available.
- Pulled Preview envs locally, reconciled the migration ledger, and verified the hosted schema is up to date.
- Redeployed a fresh Vercel preview and repointed the stable preview alias to the new deployment.
- Ran honest browser-level registration, login, session, dashboard, and DB-backed public-page smoke tests against the protected preview using the existing Vercel bypass flow.

## Database Source

- Existing authoritative hosted production database: not found from repo docs, ignored env files, or connected provider settings.
- Database chosen: new Neon Postgres instance provisioned through the Vercel integration flow for the existing `atrak-pages` project.
- Reason: it was the lowest-risk hosted Postgres path available from authenticated tooling and injects the expected Vercel Postgres env surface automatically.

## Vercel Env Status

Preview and Production now have real hosted Postgres envs:

- `DATABASE_URL`
- `DATABASE_URL_UNPOOLED`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- related `PG*` / `POSTGRES_*` variables from the Neon integration

Preview-specific app envs verified:

- `AUTH_URL=https://atrak-pages-preview.charlie2233s-projects.vercel.app`
- `AUTH_SECRET`
- `OPENAI_API_KEY`

Production app envs preserved:

- `AUTH_URL=https://pages.atrak.dev`
- `AUTH_SECRET`
- `OPENAI_API_KEY`
- `OPENAI_SORA_MODEL`

## Prisma And Migration Status

- Updated [prisma.config.ts](/Users/hanfei/.tmp/atrak-pages-launch/prisma.config.ts) to prefer `POSTGRES_PRISMA_URL`, then unpooled provider URLs, before falling back to `DATABASE_URL`.
- Verified the hosted database is reachable over TCP and via a real Postgres client.
- Verified the hosted schema now contains the expected application tables, including:
  - `User`
  - `UserProfile`
  - `GeneratedProfile`
  - `EvidenceItem`
  - `PublicPageSettings`
  - `ProductEvent`
  - `StripeWebhookEvent`
- `npx prisma migrate status` now reports the database schema is up to date.
- No large fake dataset was inserted.
- Minimal smoke fixture created: one real registered preview user created through the live app.

## Preview Deployment

Stable preview alias:

- `https://atrak-pages-preview.charlie2233s-projects.vercel.app`

Current deployment behind that alias:

- `https://atrak-pages-m9gbafojl-charlie2233s-projects.vercel.app`

## Auth And Database Smoke Results

Passed:

- `/` loads current Atrak Pages branding
- `/register` page loads
- registration succeeds for a fresh preview user
- `/login` succeeds for that new user
- authenticated session persists across navigation
- `/dashboard` loads in authenticated state
- `/explore` loads
- one DB-backed public profile loads for the new user
- one DB-backed public resume page loads for the new user

Smoke user created through the live preview:

- username: `codex-1775504229-9pxhtp`
- public profile: `/u/codex-1775504229-9pxhtp`
- public resume: `/u/codex-1775504229-9pxhtp/resume`

Out of scope for this task:

- real Stripe checkout / billing portal smoke, because Stripe values were not part of the database unblock scope

## Remaining Blockers

- Stripe is still not configured for truthful billing smoke on this preview path.
- The Vercel project is still not Git-connected, so durable branch-scoped Preview env management remains a follow-up instead of being fully managed through Git integration.

## Go / No-Go For Later DNS/Cutover

- `No-go`

This task clears the auth/database release-candidate blocker, but it does not clear the full launch path by itself. Billing and final hosting/domain readiness still need their own validation before any later DNS or canonical cutover step.
