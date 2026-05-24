# Vercel Release Candidate

Date: 2026-05-24
Branch: `release/atrak-pages-launch`
Commit: `9d8bc52`

## What Changed

- Kept the Vercel project on the verified settings:
  - Framework Preset -> `Next.js`
  - Node.js Version -> `22.x`
- Added a shared OpenAI structured-output helper that keeps OpenAI reasoning models on the Responses path while preserving the older chat-completions path for compatible third-party providers.
- Switched the launch-default OpenAI models to:
  - advanced -> `gpt-4.1`
  - standard -> `gpt-4.1-mini`
- Redeployed a fresh preview and repointed the stable preview alias:
  - `https://atrak-pages-preview.charlie2233s-projects.vercel.app`
  - -> `https://atrak-pages-6tqdjfqa7-charlie2233s-projects.vercel.app`
- Redeployed Vercel production from the same release head:
  - `https://atrak-pages-8dbp2ikrg-charlie2233s-projects.vercel.app`

## Vercel Settings Fixed

- Framework Preset: `Next.js`
- Node.js Version: `22.x`
- Build Command now resolves as the normal Next.js path:
  - `npm run build` or `next build`
- Output Directory now resolves as:
  - `Next.js default`

## Envs Set

Production:

- `AUTH_URL`
- `AUTH_SECRET`
- `OPENAI_API_KEY`
- `OPENAI_SORA_MODEL`

Preview:

- No durable branch-scoped Preview envs are stored in Vercel yet.
- The current release-candidate preview is using real deployment/runtime values for:
  - `AUTH_SECRET`
  - `DATABASE_URL`
  - `OPENAI_API_KEY`

Production still does not have any Stripe billing envs:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PLUS_MONTHLY_PRICE_ID`
- `STRIPE_PLUS_YEARLY_PRICE_ID`
- `STRIPE_PRO_MONTHLY_PRICE_ID`
- `STRIPE_PRO_YEARLY_PRICE_ID`

## Preview Access Instructions

Stable preview alias:

- `https://atrak-pages-preview.charlie2233s-projects.vercel.app`

Safe access method:

- Keep Vercel Authentication enabled.
- For automated smoke tests, use the project’s existing automation bypass secret with:
  - query param `x-vercel-protection-bypass=<secret>`
  - query param `x-vercel-set-bypass-cookie=true`
- For human/manual testing, either:
  - use the same automation bypass secret, or
  - generate a Vercel share link from the dashboard

## Smoke Results

Verified on the current stable preview alias / latest preview deployment:

- `/` -> passes with current Atrak Pages branding
- `/register` -> passes
- `/login` -> passes
- `/dashboard` -> passes after authenticated sign-in
- `/explore` -> passes
- `/api/auth/register` -> passes with real DB-backed user creation
- `/api/auth/session` -> passes with real authenticated session persistence
- `/api/generate` -> passes with the default OpenAI path and creates a real active profile
- `/api/profile` -> passes and returns the generated profile
- `/api/agent` -> passes and applies a real headline mutation after profile generation
- `/u/<username>` -> passes and serves the user’s DB-backed public profile
- `robots.txt` -> passes and points to the preview host
- `sitemap.xml` -> passes and points to the preview host

The preview is now honestly release-candidate-grade for auth, DB, core AI generation, and first agent-edit flows.

Verified on the fresh production deployment URL:

- canonical/OG/robots/sitemap all point at `https://lifepage.one`
- `/api/auth/register` -> passes
- `/api/auth/session` -> passes after credentials login
- credentials callback -> `302 Location: https://lifepage.one/dashboard`
- `/api/billing/checkout` -> `503 Stripe billing is not configured.`
- `/api/billing/portal` -> `503 Stripe billing is not configured.`

## Remaining Blockers

Preview release-candidate smoke is green, but public launch is still blocked by provider-side production work:

- Production Stripe envs are still missing in Vercel:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_PLUS_MONTHLY_PRICE_ID`
  - `STRIPE_PLUS_YEARLY_PRICE_ID`
  - `STRIPE_PRO_MONTHLY_PRICE_ID`
  - `STRIPE_PRO_YEARLY_PRICE_ID`
- `lifepage.one` is still attached to GitHub Pages.
- Porkbun DNS for `lifepage.one` and `www.lifepage.one` still points to GitHub Pages.

## Exact Remaining Actions

1. Add the six real production Stripe envs in Vercel.
2. Deploy `release/atrak-pages-launch` to Vercel production again after those envs exist.
3. Remove `lifepage.one` from GitHub Pages custom-domain settings.
4. Change Porkbun DNS to Vercel:
   - `A lifepage.one 76.76.21.21`
   - `A www.lifepage.one 76.76.21.21`
5. Wait for propagation, then verify the public host:
   - `https://lifepage.one/`
   - `https://lifepage.one/login`
   - auth callback round-trip on `lifepage.one`
   - checkout and billing portal return paths on `lifepage.one`

## Go / No-Go For Later DNS/Cutover

- `No-go`

Do not move to DNS or canonical cutover yet. The preview is now stable, correctly branded, and honestly browser-testable, but production billing envs plus domain ownership/DNS cleanup are still required before `lifepage.one` can safely serve the real app.
