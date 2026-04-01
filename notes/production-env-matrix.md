# Atrak Pages Production Environment Matrix

Date: 2026-04-01
Branch: `release/atrak-pages-launch`

## Summary

- The repo does not contain a production-ready Vercel environment bundle.
- The original checkout includes local development secrets for auth, local Postgres, and OpenAI only.
- The existing Cloudflare Worker service already has the full production secret surface configured, but those values are not readable from this session.
- The `DATABASE_URL` available in `/Users/hanfei/My_portforlio/.env.local` points at `localhost:5432`, so it is not usable from Vercel or any remote host.

## Staging vs production

| Variable | Staging | Production | Notes |
|---|---|---|---|
| `DATABASE_URL` | Required | Required | Must point at a remotely reachable Postgres. The local repo only has `localhost`, which is a hard blocker for Vercel. |
| `AUTH_SECRET` | Required | Required | Used by Auth.js. Existing local source: `/Users/hanfei/My_portforlio/.dev.vars`. |
| `NEXTAUTH_SECRET` | Optional | Optional | Current code prefers `AUTH_SECRET`, but keeping both aligned is safer. |
| `AUTH_URL` | Required | Required | Canonical host. Use preview URL for staging and `https://pages.atrak.dev` for production. |
| `NEXTAUTH_URL` | Optional | Optional | Can mirror `AUTH_URL`, but production should treat `AUTH_URL` as the source of truth. |
| `OPENAI_API_KEY` | Required | Required | Needed for profile generation and project videos. Present locally. |
| `OPENAI_SORA_MODEL` | Optional | Recommended | Defaults to `sora-2` if omitted. |
| `STRIPE_SECRET_KEY` | Optional for non-billing staging, required for billing staging | Required | Missing from local repo/env. Present on the existing Worker service only as a non-readable secret. |
| `STRIPE_WEBHOOK_SECRET` | Optional for non-billing staging, required for billing staging | Required | Same blocker as `STRIPE_SECRET_KEY`. |
| `STRIPE_PLUS_MONTHLY_PRICE_ID` | Optional for non-billing staging, required for billing staging | Required | Missing locally. |
| `STRIPE_PLUS_YEARLY_PRICE_ID` | Optional for non-billing staging, required for billing staging | Required | Missing locally. |
| `STRIPE_PRO_MONTHLY_PRICE_ID` | Optional for non-billing staging, required for billing staging | Required | Missing locally. |
| `STRIPE_PRO_YEARLY_PRICE_ID` | Optional for non-billing staging, required for billing staging | Required | Missing locally. |
| `R2_ACCESS_KEY_ID` | Optional if project videos are disabled in staging | Required for production video generation | Missing locally. Present on the Worker service only as a non-readable secret. |
| `R2_SECRET_ACCESS_KEY` | Optional if project videos are disabled in staging | Required for production video generation | Missing locally. |
| `R2_BUCKET` | Optional if project videos are disabled in staging | Required for production video generation | Missing locally. |
| `R2_PUBLIC_BASE_URL` | Optional if project videos are disabled in staging | Required for production video generation | Missing locally. |
| `R2_ACCOUNT_ID` or `R2_ENDPOINT` | Optional if project videos are disabled in staging | Required for production video generation | Missing locally. |
| `CLOUDFLARE_API_TOKEN` | Optional if custom domains stay in graceful paused mode | Required for live custom-domain provisioning | Missing locally. |
| `CLOUDFLARE_SAAS_ZONE_ID` | Optional if custom domains stay in graceful paused mode | Required for live custom-domain provisioning | Missing locally. |
| `CLOUDFLARE_SAAS_CNAME_TARGET` | Optional if custom domains stay in graceful paused mode | Required for live custom-domain provisioning | Missing locally. |
| `CLOUDFLARE_SAAS_FALLBACK_ORIGIN` | Optional if custom domains stay in graceful paused mode | Required for live custom-domain provisioning | Missing locally. |
| `CLOUDFLARE_ACCOUNT_ID` | Optional | Recommended | Only needed for Browser Rendering screenshots on Workers. |
| `CLOUDFLARE_BROWSER_RENDERING_TOKEN` | Optional | Recommended | Only needed for Browser Rendering screenshots on Workers. |
| `CRON_SECRET` | Optional unless automations are live | Recommended | Missing locally. Present on the Worker service only as a non-readable secret. |
| `KIMI_API_KEY` | Optional | Optional | Present locally. Only required if you want that provider available. |
| `QWEN_API_KEY` | Optional | Optional | Present locally. Only required if you want that provider available. |
| `DASHSCOPE_API_KEY` | Optional | Optional | Present locally. Only required if you want that provider available. |

## Source-of-truth inventory found in this session

### Local original checkout

Found in `/Users/hanfei/My_portforlio/.env.local`:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `OPENAI_API_KEY`
- `KIMI_API_KEY`
- `QWEN_API_KEY`
- `DASHSCOPE_API_KEY`

Found in `/Users/hanfei/My_portforlio/.dev.vars`:

- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_URL`
- `OPENAI_API_KEY`

Critical note:

- The local `DATABASE_URL` resolves to `postgresql://...@localhost:5432/lifepage`.
- That database cannot be reached from Vercel or any remote production runtime.

### Existing Cloudflare Worker service

`wrangler secret list --name lifepage-web` confirms these names exist remotely:

- `AUTH_SECRET`
- `AUTH_URL`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_SAAS_CNAME_TARGET`
- `CLOUDFLARE_SAAS_FALLBACK_ORIGIN`
- `CLOUDFLARE_SAAS_ZONE_ID`
- `CRON_SECRET`
- `DATABASE_URL`
- `OPENAI_API_KEY`
- `R2_ACCESS_KEY_ID`
- `R2_ACCOUNT_ID`
- `R2_BUCKET`
- `R2_PUBLIC_BASE_URL`
- `R2_SECRET_ACCESS_KEY`
- `STRIPE_PLUS_MONTHLY_PRICE_ID`
- `STRIPE_PLUS_YEARLY_PRICE_ID`
- `STRIPE_PRO_MONTHLY_PRICE_ID`
- `STRIPE_PRO_YEARLY_PRICE_ID`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

Critical note:

- The values behind those Worker secrets are not readable from this session, so they cannot be copied into Vercel from here.

## Hard blockers

1. No remotely reachable Postgres URL is available in the repo or current shell environment.
2. No readable Stripe production keys or price ids are available in the repo or current shell environment.
3. No readable R2 or Cloudflare for SaaS production credentials are available in the repo or current shell environment.
4. Vercel project creation and env injection are not possible from the current local CLI because `vercel` is unauthenticated.

## Launch decision

- A real Vercel launch is blocked until the production env values are exported from the existing infrastructure or re-entered manually into a new Vercel project.
- A real Workers launch is blocked until the Cloudflare account is upgraded past the 3 MiB Worker size limit or the bundle is significantly reduced.
