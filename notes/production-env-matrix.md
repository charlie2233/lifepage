# Atrak Pages Production Environment Matrix

Date: 2026-04-27
Branch: `release/atrak-pages-launch`

## Purpose

This is the repo-specific environment matrix for the first real Atrak Pages launch.

Rules:

- Vercel is the preferred production host.
- `AUTH_URL` is the production source of truth for canonical URLs.
- `lifepage.one` is the canonical app host for the current release branch.
- `www.lifepage.one`, `pages.atrak.dev`, and `www.pages.atrak.dev` should behave as aliases or redirects to the primary app host.

## Required For Preview And Production

| Variable | Preview | Production | Purpose | Notes |
|---|---|---|---|---|
| `DATABASE_URL` | required | required | Prisma/Postgres runtime | Must point at a hosted database, not localhost |
| `AUTH_SECRET` | required | required | Auth.js signing secret | `NEXTAUTH_SECRET` can stay unset if `AUTH_SECRET` is used |
| `AUTH_URL` | required | required | Canonical host and billing return base | Preview should use its preview host. Production must be `https://lifepage.one` |
| `OPENAI_API_KEY` | required | required | AI generation, profile synthesis, project videos | Required for real crawl/generate flows |

## Usually Required For Production

| Variable | Preview | Production | Purpose | Notes |
|---|---|---|---|---|
| `OPENAI_SORA_MODEL` | optional | recommended | Project demo video model selection | Defaults to `sora-2` if omitted |
| `CRON_SECRET` | optional | recommended | Protects automation run endpoint | Needed if cron/automation entrypoints are enabled |
| `CLOUDFLARE_ACCOUNT_ID` | optional | recommended | Cloudflare Browser Rendering | Only needed if you use Browser Rendering on the deployed host |
| `CLOUDFLARE_BROWSER_RENDERING_TOKEN` | optional | recommended | Cloudflare Browser Rendering | Same as above |

## Required For Stripe Billing

| Variable | Preview | Production | Purpose | Notes |
|---|---|---|---|---|
| `STRIPE_SECRET_KEY` | required for billing smoke | required | Stripe API access | Use test key in preview, live key in production |
| `STRIPE_WEBHOOK_SECRET` | required for billing smoke | required | Stripe webhook validation | Must match the deployed webhook destination |
| `STRIPE_PLUS_MONTHLY_PRICE_ID` | required for billing smoke | required | Price map | |
| `STRIPE_PLUS_YEARLY_PRICE_ID` | required for billing smoke | required | Price map | |
| `STRIPE_PRO_MONTHLY_PRICE_ID` | required for billing smoke | required | Price map | |
| `STRIPE_PRO_YEARLY_PRICE_ID` | required for billing smoke | required | Price map | |

## Required For R2 Project Video Storage

| Variable | Preview | Production | Purpose | Notes |
|---|---|---|---|---|
| `R2_ACCESS_KEY_ID` | optional | required if using hosted video storage | R2 API access | |
| `R2_SECRET_ACCESS_KEY` | optional | required if using hosted video storage | R2 API access | |
| `R2_BUCKET` | optional | required if using hosted video storage | Bucket name | |
| `R2_ACCOUNT_ID` | optional | required if using hosted video storage | R2 endpoint derivation | |
| `R2_PUBLIC_BASE_URL` | optional | required if using hosted video storage | Public asset base URL | |

## Required For Customer Custom Domains

| Variable | Preview | Production | Purpose | Notes |
|---|---|---|---|---|
| `CLOUDFLARE_API_TOKEN` | optional | required for live provider operations | Cloudflare for SaaS API | Dashboard should degrade gracefully if missing |
| `CLOUDFLARE_SAAS_ZONE_ID` | optional | required for live provider operations | Cloudflare zone id | |
| `CLOUDFLARE_SAAS_CNAME_TARGET` | optional | required for live provider operations | Customer-facing CNAME target | Launch scope is subdomains only |
| `CLOUDFLARE_SAAS_FALLBACK_ORIGIN` | optional | required for live provider operations | Fallback origin | Must front the deployed runtime |

## Launch Notes

- No production secrets live in the repo.
- The current Cloudflare Worker already has a populated production secret set, but that does not automatically provision Vercel.
- A real Vercel launch still requires creating or linking the Vercel project and entering these env vars there.
- If preview and production use different Stripe modes, keep webhook URLs and secrets separated cleanly.

## Current Operator Findings

- The current Codex environment is linked to `charlie2233s-projects/atrak-pages` and can deploy to Vercel.
- Production `AUTH_URL` is now set to `https://lifepage.one`.
- Production Stripe billing envs are still missing in Vercel:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_PLUS_MONTHLY_PRICE_ID`
  - `STRIPE_PLUS_YEARLY_PRICE_ID`
  - `STRIPE_PRO_MONTHLY_PRICE_ID`
  - `STRIPE_PRO_YEARLY_PRICE_ID`
- The current production deployment is `dpl_5A9H46jJGSmmkM6427Jc7MELvMcU` at `https://atrak-pages-8z93iquwa-charlie2233s-projects.vercel.app`.
- That deployment emits canonical, OG, robots, and sitemap URLs under `https://lifepage.one`.
- `lifepage.one` and `www.lifepage.one` are attached to the Vercel project, but public DNS still points to GitHub Pages.
- GitHub Pages still owns the custom domain `lifepage.one` on `main:/docs`, so it must be detached only after Stripe envs are completed and Porkbun DNS is ready to flip.
