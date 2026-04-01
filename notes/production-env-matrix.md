# Atrak Pages Production Environment Matrix

Date: 2026-04-01
Branch: `release/atrak-pages-launch`

## Purpose

This is the repo-specific environment matrix for the first real Atrak Pages launch.

Rules:

- Vercel is the preferred production host.
- `AUTH_URL` is the production source of truth for canonical URLs.
- `pages.atrak.dev` is the only canonical app host.
- `lifepage.one` is redirect-only and must never be used as the app host, auth callback host, or billing return host.

## Required For Preview And Production

| Variable | Preview | Production | Purpose | Notes |
|---|---|---|---|---|
| `DATABASE_URL` | required | required | Prisma/Postgres runtime | Must point at a hosted database, not localhost |
| `AUTH_SECRET` | required | required | Auth.js signing secret | `NEXTAUTH_SECRET` can stay unset if `AUTH_SECRET` is used |
| `AUTH_URL` | required | required | Canonical host and billing return base | Preview should use its preview host. Production must be `https://pages.atrak.dev` |
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

- The current Codex environment is not authenticated to a Vercel project yet.
- `pages.atrak.dev` does not resolve yet, so canonical-domain production is not cut over.
- The existing Cloudflare Worker `lifepage-web` has all required secret names populated, but those values are not readable from this session.
- The currently live `workers.dev` host is still serving an older LifePage build.
- A fresh deploy of the current release bundle to Cloudflare fails on the free-plan 3 MiB Worker size limit, so the Worker fallback requires a paid plan or bundle reduction before it can be treated as a real rollout path.
