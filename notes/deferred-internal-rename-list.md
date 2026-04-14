# Deferred Internal Rename List

Date: 2026-04-01
Branch: `release/atrak-pages-launch`

This release uses a low-risk surface-first rename. Public branding is now **Atrak Pages**. The items below are intentionally deferred because they are internal, operational, or coupled to runtime/provider state.

## Renamed now

- public product name and major UI surfaces
- public metadata, OG references, and share surfaces
- package display name in [package.json](/Users/hanfei/.tmp/atrak-pages-launch/package.json) and [package-lock.json](/Users/hanfei/.tmp/atrak-pages-launch/package-lock.json)
- legacy compatibility OG asset content in [og-lifepage.svg](/Users/hanfei/.tmp/atrak-pages-launch/public/og-lifepage.svg) so old asset paths no longer show the old brand

## Okay To Keep Temporarily

- `lifepage.one`
  Reason: this is the planned legacy transition domain, not the canonical brand domain.

- internal release notes that discuss the rename from `LifePage` to `Atrak Pages`
  Files:
  - [release-integration-summary.md](/Users/hanfei/.tmp/atrak-pages-launch/notes/release-integration-summary.md)
  Reason: these are internal operator docs, not public product surfaces.

## Defer Until Post-Launch Cleanup

- repo and directory name `My_portforlio`
  Recommendation: rename repo and local folder to `atrak-pages` after launch stabilization.

- Worker service id in [wrangler.jsonc](/Users/hanfei/.tmp/atrak-pages-launch/wrangler.jsonc)
  Current value: `lifepage-web`
  Reason: changing it now risks breaking the fallback runtime path and deploy wiring.

- env example database names and bucket names
  Files:
  - [.env.example](/Users/hanfei/.tmp/atrak-pages-launch/.env.example)
  - [README.md](/Users/hanfei/.tmp/atrak-pages-launch/README.md)
  Current examples include `lifepage`, `lifepage_test`, and `lifepage-project-videos`.
  Reason: these are internal/runtime identifiers, not user-facing brand surfaces.

- fake-provider globals and internal test scaffolding
  Files:
  - [src/lib/cloudflare-saas.ts](/Users/hanfei/.tmp/atrak-pages-launch/src/lib/cloudflare-saas.ts)
  - [src/lib/stripe-billing.ts](/Users/hanfei/.tmp/atrak-pages-launch/src/lib/stripe-billing.ts)
  Reason: renaming these now adds churn with no launch value.

- e2e fixture hosts and fake content
  File:
  - [src/lib/e2e-mode.ts](/Users/hanfei/.tmp/atrak-pages-launch/src/lib/e2e-mode.ts)
  Examples:
  - `fixtures.lifepage.test`
  - `LifePage Fixtures`
  - `LifePage Labs`
  Reason: purely test-only data; defer until the authenticated Playwright issue is resolved.

- backend contracts, API routes, Prisma model names, and storage/runtime ids
  Reason: these are stability-sensitive and outside the scope of a surface-first rename.

## Post-Launch Recommendation

After launch stabilizes:

1. rename the repository from `My_portforlio` to `atrak-pages`
2. decide whether to rename the Worker service id from `lifepage-web`
3. rename example database and bucket identifiers if operationally worthwhile
4. clean up internal fixture/test naming once the e2e suite is stable again
