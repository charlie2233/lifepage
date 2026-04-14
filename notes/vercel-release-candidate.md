# Vercel Release Candidate

Date: 2026-04-03
Branch: `release/atrak-pages-launch`

## What Changed

- Updated the Vercel project itself through the authenticated Vercel API:
  - Framework Preset -> `Next.js`
  - Node.js Version -> `22.x`
- Kept the existing production-scoped real values that were already set:
  - `AUTH_URL=https://pages.atrak.dev`
  - `AUTH_SECRET`
  - `OPENAI_API_KEY`
  - `OPENAI_SORA_MODEL=sora-2`
- Confirmed the project already had an automation protection-bypass secret configured and used it for browser-level preview access without disabling preview protection.
- Redeployed a fresh preview after the project-setting fix and repointed the stable preview alias to the new deployment:
  - `https://atrak-pages-preview.charlie2233s-projects.vercel.app`
  - -> `https://atrak-pages-ebinccag6-charlie2233s-projects.vercel.app`

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
- The current release-candidate preview was deployed with real deployment-level runtime values for:
  - `AUTH_URL=https://atrak-pages-preview.charlie2233s-projects.vercel.app`
  - `AUTH_SECRET`
  - `OPENAI_API_KEY`

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

Verified on the current stable preview alias:

- `/` -> passes, current Atrak Pages branding
- `/register` -> passes as page load
- `/login` -> passes as page load
- `/dashboard` -> passes as unauthenticated redirect
- `/explore` -> passes as page load
- `/u/alexchen` -> passes with preview branding and no localhost canonical leakage
- `/u/alexchen/resume` -> passes with preview branding and no localhost canonical leakage
- `robots.txt` -> passes and points to the preview host
- `sitemap.xml` -> passes and points to the preview host
- `/api/billing` -> reachable but returns `401 Unauthorized` without an authenticated session

Browser-level registration attempt on the current release-candidate preview:

- attempted through the real `/register` form
- failed with visible UI error
- matching runtime log confirms the cause:
  - `POST /api/auth/register -> 500`
  - Prisma `P1001`
  - `Can't reach database server at 127.0.0.1:5432`

## Remaining Blocker

One blocker remains for honest release-candidate smoke:

- `DATABASE_URL`
  - Scope: Preview and Production
  - Expected format: `postgresql://USER:PASSWORD@HOST:PORT/DB?sslmode=require`
  - Why it blocks RC smoke:
    - registration cannot succeed
    - auth/session persistence cannot be verified
    - authenticated dashboard flow cannot be verified
    - public-profile data falls back instead of loading from the real DB

## Non-Blocking Follow-Up

- Git connection for the Vercel project is still not active.
- CLI attempt to connect `https://github.com/charlie2233/My_portforlio.git` failed even though the repo is public and the current GitHub viewer has admin access.
- This is not blocking the current preview alias, but it should be fixed later if you want durable branch-scoped Preview envs in Vercel.

Exact manual follow-up:

1. Open Vercel project `atrak-pages`
2. Go to `Settings -> Git`
3. Connect `charlie2233/My_portforlio`
4. If Vercel says the repo is unavailable, re-authorize the Vercel GitHub integration and explicitly grant access to that repository

## Go / No-Go For Later DNS/Cutover

- `No-go`

Do not move to DNS or canonical cutover yet. The preview is now stable, correctly branded, and honestly browser-testable, but a real hosted `DATABASE_URL` is still required before it becomes a true release candidate.
