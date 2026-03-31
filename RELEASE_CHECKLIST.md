# LifePage Release Checklist

Last updated: 2026-03-31

## Phase 1: hosting clarity

- [x] Audit package scripts, Next config, Wrangler config, workflows, and fallback assets
- [x] Confirm GitHub Pages is publishing `docs/`
- [x] Confirm GitHub Pages still owns `lifepage.one`
- [x] Document Cloudflare Workers as canonical production
- [x] Document GitHub Pages as fallback-only
- [x] Remove repo-level Pages custom-domain file

## Phase 2: Worker staging

- [ ] Resolve the current Cloudflare Worker deployment blocker on the target account
- [ ] Add `lifepage.one/*` and `www.lifepage.one/*` routes to `wrangler.jsonc`
- [ ] Provision production Worker secrets
- [ ] Run `npm run cf:build` in a clean environment
- [ ] Deploy to the Worker staging host
- [ ] Smoke-test auth, DB, billing, and public routes on `*.workers.dev`

## Phase 3: domain cutover

- [ ] Remove the GitHub Pages custom-domain setting for `lifepage.one`
- [ ] Point `lifepage.one` DNS at Cloudflare
- [ ] Attach `lifepage.one` and `www.lifepage.one` to the Worker
- [ ] Set `AUTH_URL=https://lifepage.one`
- [ ] Verify the Pages fallback remains only on `github.io`

## Phase 4: launch verification

- [ ] Auth works on `lifepage.one`
- [ ] DB-backed flows work on `lifepage.one`
- [ ] Stripe checkout works
- [ ] Stripe webhook sync works
- [ ] Public pages load
- [ ] Resume export works
- [ ] Monitoring is live
- [ ] Smoke tests pass
