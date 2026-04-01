# Hosting Contingency Decision Memo

Date: 2026-03-31
Audit basis: local branch `97c9b22` plus current official platform docs

## Executive summary

Recommendation:

1. Use **Vercel as the contingency production host** for the full Next.js app if you need the lowest-risk path to a stable public deployment soon.
2. Keep **Cloudflare DNS, Cloudflare R2, and Cloudflare for SaaS** in the architecture.
3. Do **not** choose Netlify as the first contingency path for this repo.
4. Stay on **Cloudflare Workers** only if you are willing to pay for Workers and continue owning the OpenNext-specific build/runtime path.

Why:

- The repo already builds cleanly with plain `next build`.
- The Cloudflare OpenNext build also succeeds, but the current Worker upload is too large for the Workers free plan.
- The app is materially Cloudflare-aware for screenshots and custom domains, but those pieces can stay on Cloudflare even if the app runtime moves to Vercel.
- Netlify does not remove any hard problem that Vercel leaves unsolved, and it adds more migration and validation work for this codebase.

## Local verification from this audit

Commands run locally in a clean worktree:

- `npm run build`
- `npm run cf:build`
- `npx wrangler deploy --dry-run --outdir bundled`

Observed result:

- Plain Next.js production build passed.
- OpenNext Cloudflare build passed.
- Wrangler dry-run reported:

```text
Total Upload: 17436.95 KiB / gzip: 4247.75 KiB
```

That matters because Cloudflare Workers currently document a **3 MB free plan Worker size limit** and a **10 MB paid plan Worker size limit**. As audited, this repo is not a free-plan fit for Workers without more bundle reduction work.

## Repo requirement audit

### 1. Next.js runtime

Current repo facts:

- Framework: `next@16.1.6`
- App Router
- Middleware/auth gate
- Multiple server routes explicitly pinned to `runtime = "nodejs"`
- Cloudflare deploy path uses `@opennextjs/cloudflare` and `wrangler.jsonc`

Relevant files:

- `package.json`
- `wrangler.jsonc`
- `next.config.ts`
- `scripts/cf-build.mjs`
- `src/middleware.entry.ts`
- `src/proxy.ts`
- `src/middleware.ts` on newer local work

Implication:

- This app is not a static site and not an edge-only app.
- It is a mixed-runtime Next app that fits **Vercel first**, **Cloudflare second via OpenNext**, and **Netlify third**.

### 2. Auth

Current repo facts:

- Auth.js / NextAuth credentials flow
- `trustHost: true`
- canonical URL logic reads `AUTH_URL`, then `NEXTAUTH_URL`, then public fallback
- dashboard auth gate depends on Next middleware/proxy behavior

Relevant files:

- `src/lib/auth.ts`
- `src/lib/site.ts`
- `src/lib/runtime-env.ts`
- `src/lib/dashboard-auth-gate.ts`

Implication:

- Vercel migration is low-risk here: set `AUTH_URL` to the Vercel production hostname.
- Netlify is also possible, but Vercel is the more common fit for this exact Auth.js + Next pattern.
- Workers remains viable, but only through the OpenNext compatibility layer.

### 3. Prisma / Postgres

Current repo facts:

- Prisma 7 with PostgreSQL
- `@prisma/adapter-pg`
- custom `src/lib/db.ts` creates a fresh Prisma client in Workers runtime and a cached client elsewhere

Relevant files:

- `prisma/schema.prisma`
- `prisma.config.ts`
- `src/lib/db.ts`

Implication:

- The database layer is already written to tolerate both Workers and Node-like runtimes.
- Vercel needs only `DATABASE_URL`.
- Netlify also needs only `DATABASE_URL`.
- Workers keeps the current special-case logic alive, which is functional but increases platform-specific complexity.

### 4. Stripe

Current repo facts:

- Stripe checkout, portal, webhook sync
- webhook route explicitly uses `runtime = "nodejs"`
- billing state is stored in Postgres

Relevant files:

- `src/app/api/stripe/webhook/route.ts`
- `src/app/api/billing/checkout/route.ts`
- `src/app/api/billing/portal/route.ts`
- `src/lib/stripe-billing.ts`

Implication:

- Vercel is the easiest fit.
- Netlify can support this, but it is not a better fit than Vercel.
- Workers can run it through OpenNext, but Stripe webhooks are exactly the sort of route where plain Node hosting is operationally simpler.

### 5. Crawler / screenshot logic

Current repo facts:

- HTML fetch via `axios`
- parse via `cheerio`
- screenshots via `puppeteer-core` + `@sparticuz/chromium`
- **only** uses Cloudflare Browser Rendering when running inside Cloudflare Workers

Relevant files:

- `src/lib/crawler.ts`
- `src/lib/cloudflare-browser.ts`
- `next.config.ts`

Important detail:

- On **Workers**, screenshots can use Cloudflare Browser Rendering API.
- On **Vercel or Netlify**, the current code path tries to launch embedded Chromium instead of calling Cloudflare Browser Rendering.

Implication:

- Vercel migration is still reasonable, but there is one repo-specific follow-up:
  - either keep Puppeteer/Chromium on Vercel
  - or refactor screenshot capture so Cloudflare Browser Rendering can be used outside Workers too
- Netlify has the same issue, but with less upside than Vercel.

### 6. R2 / storage assumptions

Current repo facts:

- project video storage uses S3-compatible API
- production expects Cloudflare R2 or explicit endpoint
- local disk fallback is for development only

Relevant files:

- `src/lib/project-video-storage.ts`
- `src/app/api/project-videos/assets/[...key]/route.ts`

Implication:

- Hosting can move to Vercel or Netlify without changing storage vendor.
- Keep R2.
- Do not rely on local filesystem storage in production on any contingency host.

### 7. Custom-domain roadmap

Current repo facts:

- customer domains are managed via Cloudflare for SaaS custom hostnames
- app calls Cloudflare API directly
- launch scope is subdomain-only

Relevant files:

- `src/lib/cloudflare-saas.ts`
- `src/lib/domain-verification.ts`
- `src/app/api/settings/route.ts`
- `src/app/api/settings/domain/verify/route.ts`

Implication:

- This feature is **already Cloudflare-dependent** even if app hosting changes.
- Moving the app to Vercel does not remove Cloudflare from the stack.
- That is acceptable: Vercel can host the app while Cloudflare still owns DNS, R2, Browser Rendering, and SaaS custom hostnames.

## Platform comparison for this repo

| Area | Cloudflare Workers | Vercel | Netlify |
| --- | --- | --- | --- |
| Next.js runtime fit | Medium | High | Medium |
| Migration effort from current repo | Low if you stay paid on Workers | Low to medium | Medium to high |
| Free-plan viability | Low, current bundle is too large | Medium | Medium |
| Stripe webhook fit | Medium | High | Medium |
| Prisma/Postgres fit | Medium | High | High |
| Puppeteer screenshot fit | Medium, but Browser Rendering helps | Medium | Low to medium |
| Cloudflare custom-domain roadmap fit | High | High, if Cloudflare remains in front | High, if Cloudflare remains in front |
| Operational simplicity | Medium | High | Medium |
| Reason to choose | Single-vendor Cloudflare stack | Lowest-risk contingency host | No clear repo-specific advantage |

## Recommendation

### Recommended path

Temporarily move **production app hosting to Vercel**, while keeping:

- Cloudflare DNS
- Cloudflare R2
- Cloudflare for SaaS for user custom domains
- optional Cloudflare Browser Rendering after a small crawler refactor

### Why not stay on Workers as the default contingency path

Staying on Workers is reasonable only if all three statements are true:

1. you are fine with a paid Workers plan
2. you are fine keeping the OpenNext-specific deployment path
3. you are fine continuing to debug Cloudflare-specific runtime behavior for mixed Node routes

That is not the lowest-risk contingency answer for this repo. It is the lowest-change answer only if you have already accepted Cloudflare-specific operational complexity.

### Why not Netlify

Netlify does not offer a repo-specific advantage here:

- it is not a closer fit than Vercel for this Next.js app
- it does not remove the crawler/chromium problem
- it still leaves Cloudflare in the architecture for custom domains and R2 if you keep the current product roadmap

## Migration diff

These are the repo changes required for each fallback path.

### Minimal Vercel migration diff

Required:

1. Add Vercel project env vars:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `AUTH_URL=https://<vercel-host>`
   - `OPENAI_API_KEY`
   - all Stripe env vars
   - all R2 env vars
   - all Cloudflare SaaS env vars
   - optionally Cloudflare Browser Rendering env vars
2. Add `vercel.json` only if you want cron ownership on Vercel for `/api/automations/run`.
3. Update docs from Workers-first deployment to Vercel-first contingency deployment.
4. Decide crawler strategy:
   - short-term: keep Puppeteer/Chromium in Node functions
   - better: refactor `src/lib/crawler.ts` so Cloudflare Browser Rendering can be called from any host, not only from Workers
5. Point the app’s canonical production hostname at Vercel.
6. Keep Cloudflare custom-domain fallback origin in front of the Vercel origin.

Recommended code follow-up:

- change screenshot selection from runtime-detection to capability-detection, so Cloudflare Browser Rendering is available on Vercel too

Files likely to change:

- `README.md`
- `.env.example`
- `src/lib/crawler.ts`
- `src/lib/cloudflare-browser.ts`
- `src/lib/site.ts`
- optional `vercel.json`

Estimated effort:

- **0.5 to 1 day** for a basic Vercel deploy with current Puppeteer path
- **1 to 2 days** for a hardened cutover with crawler refactor, webhook validation, and custom-domain smoke tests

### Minimal Netlify migration diff

Required:

1. Add Netlify config for Next.js runtime.
2. Add all app env vars in Netlify.
3. Decide cron ownership for `/api/automations/run`.
4. Validate middleware/auth gate behavior under Netlify’s Next runtime.
5. Validate Puppeteer/Chromium route behavior under Netlify functions.
6. Keep Cloudflare custom-domain fallback origin in front of the Netlify origin.

Files likely to change:

- `README.md`
- `.env.example`
- `src/lib/crawler.ts`
- `src/lib/cloudflare-browser.ts`
- `src/lib/site.ts`
- likely `netlify.toml`

Estimated effort:

- **1.5 to 3 days** to reach the same confidence level as a Vercel cutover

## Risk matrix

| Risk | Workers | Vercel | Netlify | Notes |
| --- | --- | --- | --- | --- |
| Deploy blocked by platform limits | High on free plan | Low | Low | Current Wrangler dry-run gzip bundle is 4247.75 KiB |
| Runtime mismatch for Node-heavy routes | Medium | Low | Medium | Resume, billing, video routes are explicitly `nodejs` |
| Screenshot capture instability | Low to medium | Medium | High | Current code favors Browser Rendering only on Workers |
| Auth callback/canonical URL issues | Medium | Low | Medium | `AUTH_URL` handling is already in repo |
| Stripe webhook operational risk | Medium | Low | Medium | Node-hosted webhook is simplest |
| Custom-domain roadmap disruption | Low | Low | Low | Cloudflare for SaaS can remain external to app host |
| Rollback complexity | Medium | Low | Medium | Vercel rollback is simpler than OpenNext + Workers |
| Vendor sprawl | Low | Medium | High | Netlify adds a third major platform without removing Cloudflare |

## Rollback path

### If you move to Vercel

Recommended rollback design:

1. Keep Cloudflare as the DNS control plane.
2. Put the app behind a hostname you control in Cloudflare.
3. Keep all production env vars defined on both platforms during the cutover window.
4. Keep the current Workers deploy path buildable until Vercel is proven stable.
5. If Vercel fails:
   - repoint the Cloudflare-managed origin hostname back to Workers
   - or redeploy the last known-good Worker version
   - keep user custom domains unchanged at the Cloudflare layer

Rollback time:

- DNS/proxy rollback: minutes
- full platform rollback including secret validation and webhook verification: under half a day

### If you stay on Workers

Required before calling Workers the primary production answer:

1. accept paid Workers pricing
2. remove or land the middleware/proxy build workaround cleanly
3. validate live Stripe webhook handling
4. validate crawler screenshots in the deployed runtime
5. finish the custom-domain launch flow and ops runbook

## Final call

For this repo, the best contingency answer is:

- **Primary recommendation:** move the full app to **Vercel**
- **Keep:** Cloudflare DNS, Cloudflare R2, Cloudflare for SaaS
- **Do not choose first:** Netlify
- **Stay on Workers only if:** you intentionally want a paid Cloudflare-first runtime and accept the OpenNext maintenance surface

## Source links

- Cloudflare Next.js on Workers: https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
- Cloudflare Workers limits: https://developers.cloudflare.com/workers/platform/limits/
- Cloudflare for SaaS custom hostnames: https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/domain-support/create-custom-hostnames/
- Vercel Next.js docs: https://vercel.com/docs/frameworks/full-stack/nextjs
- Vercel domains: https://vercel.com/docs/domains/set-up-custom-domain
- Netlify Next.js overview: https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/
- Netlify Background Functions: https://docs.netlify.com/build/functions/background-functions/
