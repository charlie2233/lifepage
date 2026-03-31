# LifePage Release Checklist

Last updated: 2026-03-31

## Phase 0: audit

- [x] Audit repo scripts, workflows, env vars, docs, and domain assumptions
- [x] Confirm current GitHub Pages configuration
- [x] Confirm current Worker auth and deployment visibility
- [x] Confirm live DNS is still on GitHub Pages
- [x] Confirm production docs were missing and need to be created

## Phase 1: release docs and tasking

- [x] Create `DEPLOYMENT.md`
- [x] Create `OPERATIONS.md`
- [x] Create `RELEASE_CHECKLIST.md`
- [x] Create tracked issues for deferred infra tasks (`HOO-5` to `HOO-10`)

## Phase 2: staging readiness

- [ ] Worker routes/config reviewed for canonical production domain
- [ ] Production secrets present in Cloudflare Worker
- [x] `npm run cf:build` succeeds in a clean environment
- [ ] Worker deploy succeeds
- [ ] `*.workers.dev` staging host passes smoke tests

## Phase 3: domain cutover

- [ ] Remove GitHub Pages custom domain binding for `lifepage.one`
- [ ] Remove or neutralize `docs/CNAME`
- [ ] Put `lifepage.one` DNS under Cloudflare control
- [ ] Attach `lifepage.one` and `www.lifepage.one` to the Worker
- [ ] Set `AUTH_URL=https://lifepage.one`

## Phase 4: launch verification

- [ ] Auth works on `lifepage.one`
- [ ] DB-backed flows work on `lifepage.one`
- [ ] Stripe checkout works
- [ ] Stripe webhook sync works
- [ ] Resume export works
- [ ] Public portfolio routes work
- [ ] Smoke tests pass
- [ ] Monitoring is live

## Explicit blockers from current audit

- [ ] `lifepage.one` is still configured as a GitHub Pages custom domain
- [ ] `www.lifepage.one` still CNAMEs to `charlie2233.github.io`
- [ ] Domain nameservers are still Porkbun, not Cloudflare
- [ ] Worker production routing is not declared in `wrangler.jsonc`
- [ ] Current Cloudflare account still blocks deploys at the Workers Free `3 MiB` compressed script limit
- [ ] Stripe production secrets are not provisioned in the current release environment
- [ ] Cloudflare SaaS secrets are not provisioned in the current release environment
- [ ] R2 storage secrets are not provisioned in the current release environment
