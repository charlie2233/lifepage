# Release Integration Summary

Date: 2026-04-01
Branch: `release/atrak-pages-launch`
Base release commit before PR #21 integration: `898d108`

## Integration result

The release branch is already a superset of the three prerequisite PRs plus one release-packaging commit:

- `8c949aa` captures the intent of PR #17
- `fb557ec` captures the intent of PR #18
- `dbb79b6` captures the intent of PR #19
- `19794c6` adds release-specific Atrak Pages packaging, rename, and launch docs

Recommended integration order, if replayed from `main`, remains:

1. PR #17
2. PR #18
3. PR #19
4. release packaging / surface-brand rename

For the release candidate pass on 2026-04-01, PR #21 was reviewed separately and only the low-risk launch-adjacent subset was approved for integration.

### PR #21 release-candidate decision

Recommendation:

- use a cherry-pick, not a merge

Why:

- PR #21 is a single commit directly on top of `release/atrak-pages-launch`
- `release/atrak-pages-launch` is an ancestor of `codex/post-launch-polish-sprint-1`
- the change applies cleanly without conflicts, so cherry-pick keeps the history tighter and avoids carrying a sprint branch merge into the release candidate

Included from PR #21:

- signup instrumentation additions in [src/lib/product-analytics.ts](/Users/hanfei/.tmp/atrak-pages-launch/src/lib/product-analytics.ts) and [src/app/register/page.tsx](/Users/hanfei/.tmp/atrak-pages-launch/src/app/register/page.tsx)
- dashboard first-run clarity in [src/app/dashboard/page.tsx](/Users/hanfei/.tmp/atrak-pages-launch/src/app/dashboard/page.tsx)
- public profile and resume cleanup in [src/components/public-profile-page.tsx](/Users/hanfei/.tmp/atrak-pages-launch/src/components/public-profile-page.tsx), [src/components/public-resume-page.tsx](/Users/hanfei/.tmp/atrak-pages-launch/src/components/public-resume-page.tsx), and [src/components/public-share-actions.tsx](/Users/hanfei/.tmp/atrak-pages-launch/src/components/public-share-actions.tsx)
- safer image handling on public surfaces through `next/image`

Explicitly excluded from PR #21:

- [notes/post-launch-polish-sprint-1.md](/Users/hanfei/.tmp/atrak-pages-launch/notes/post-launch-polish-sprint-1.md)
- any follow-on polish work that is not needed for launch readiness

That order keeps product and SEO changes in place before domain hardening, then layers the hosting memo after code changes, and only then applies launch-specific branding and cutover docs.

## What Each PR Contributes

### PR #17: post-launch enhancement sprint

Primary contribution:

- conversion and onboarding improvements
- stronger landing, dashboard, and public-page experience
- SEO, structured-data, OG, and shareability work
- measurement/funnel instrumentation

Representative files:

- [src/app/page.tsx](/Users/hanfei/.tmp/atrak-pages-launch/src/app/page.tsx)
- [src/app/register/page.tsx](/Users/hanfei/.tmp/atrak-pages-launch/src/app/register/page.tsx)
- [src/app/dashboard/page.tsx](/Users/hanfei/.tmp/atrak-pages-launch/src/app/dashboard/page.tsx)
- [src/app/layout.tsx](/Users/hanfei/.tmp/atrak-pages-launch/src/app/layout.tsx)
- [src/app/sitemap.ts](/Users/hanfei/.tmp/atrak-pages-launch/src/app/sitemap.ts)
- [src/app/api/analytics/route.ts](/Users/hanfei/.tmp/atrak-pages-launch/src/app/api/analytics/route.ts)

Why it matters:

- this is the product-quality baseline the launch branch depends on

### PR #18: custom-domain hardening

Primary contribution:

- launch-safe subdomain custom-domain flow
- graceful dashboard behavior when Cloudflare for SaaS is incomplete
- clearer verification, SSL, and troubleshooting states
- explicit subdomain-only product posture

Representative files:

- [src/app/api/settings/route.ts](/Users/hanfei/.tmp/atrak-pages-launch/src/app/api/settings/route.ts)
- [src/app/api/settings/domain/verify/route.ts](/Users/hanfei/.tmp/atrak-pages-launch/src/app/api/settings/domain/verify/route.ts)
- [src/lib/custom-domain-lifecycle.ts](/Users/hanfei/.tmp/atrak-pages-launch/src/lib/custom-domain-lifecycle.ts)
- [src/lib/custom-domain-observability.ts](/Users/hanfei/.tmp/atrak-pages-launch/src/lib/custom-domain-observability.ts)
- [docs/custom-domains.md](/Users/hanfei/.tmp/atrak-pages-launch/docs/custom-domains.md)

Why it matters:

- this makes the customer-domain feature understandable and safe enough to launch incrementally

### PR #19: hosting contingency memo

Primary contribution:

- repo-specific hosting recommendation and fallback analysis
- explicit Vercel recommendation as the fastest contingency host
- migration cost, risk framing, and rollback planning

Representative file:

- [notes/hosting-contingency-decision-memo.md](/Users/hanfei/.tmp/atrak-pages-launch/notes/hosting-contingency-decision-memo.md)

Why it matters:

- it gives the release branch an explicit, non-hand-wavy hosting decision path

## Conflict Summary

Integration overlap was concentrated in:

- [src/app/dashboard/page.tsx](/Users/hanfei/.tmp/atrak-pages-launch/src/app/dashboard/page.tsx)
- [prisma/schema.prisma](/Users/hanfei/.tmp/atrak-pages-launch/prisma/schema.prisma)
- [.gitignore](/Users/hanfei/.tmp/atrak-pages-launch/.gitignore)

The only confirmed integration adjustment that mattered was `.gitignore`:

- PR #17 and PR #18 both needed migration allowlist entries
- the release branch preserves both entries cleanly

No functional exclusions from PR #17, PR #18, or PR #19 remain on the release branch. The largest divergence from those original PRs is the later release-packaging commit, not the integration replay itself.

## Intentionally Excluded Changes

The release branch intentionally does **not** do a deep internal rename. Still excluded on purpose:

- env var renames
- Prisma model/database identifier renames
- bucket or storage identifier renames
- API route path renames
- broad e2e fixture renames
- provider-side cutover actions
- apex custom-domain support

The only low-risk exception is the private npm package display name, which can move to `atrak-pages` without affecting imports or deploy wiring.

This keeps the launch branch focused on user-facing release work and avoids schema/runtime churn.

## Test And Build Summary

Revalidated on the current release branch:

- `npx tsc --noEmit`: passed
- targeted `eslint` on the PR #21 touched files: passed
- `npm run test:unit`: passed
- `npm run build`: passed
  - known local warning: sitemap and explore generation fall back when the local `hanfei` database is absent
- targeted release-gate test run:
  - `e2e/auth.spec.ts` unauthenticated redirect test passed when run with the local env file
  - the full authenticated Playwright suite remains a known release-branch blocker from prior runs and was not reopened by the PR #21 integration

Current interpretation:

- integration is clean
- build health is acceptable
- PR #21 does not introduce a new regression signal
- release automation is still blocked by the existing authenticated e2e failure and host/provider readiness

## Unresolved Production Blockers

Ranked blockers after integration:

1. `pages.atrak.dev` is not live yet
2. no Vercel project exists yet for the app runtime
3. `lifepage.one` is still attached to GitHub Pages in provider state
4. authenticated Playwright flows still fail on the release branch
5. customer custom domains are code-ready but still depend on provider-side completion before launch announcement
6. crawler screenshot behavior still needs validation on the eventual Vercel runtime

## Exact Next-Step Recommendation For Rename Phase

If replaying from the pre-rename integrated base, the next step should be a **surface-only rename phase**:

1. rename visible product copy from `LifePage` to `Atrak Pages`
2. set `pages.atrak.dev` as the canonical public host in metadata and docs
3. treat `lifepage.one` as a legacy transition domain
4. update OG/share assets and user-facing export labels
5. avoid deep internal/runtime identifier changes

For the current branch, that rename phase has already been packaged. The exact next step now is:

1. unlock the production host on Vercel or paid Workers
2. cut over `pages.atrak.dev`
3. move `lifepage.one` to redirect-only behavior
4. rerun release smoke checks on the real host
5. keep the release branch closed to further product-scope expansion unless a change directly resolves a launch blocker

That is the fastest path from integrated branch to actual launch readiness.
