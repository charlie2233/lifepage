# LifePage Staging Validation Report

Last updated: 2026-03-31

## URL tested

- Staging Worker hostname: `https://lifepage-web.charliehan-lifepage.workers.dev`
- Cloudflare Worker version: `5a004371-6a61-4ba1-a24a-c55e656ddee2`

## Deployment result

- `wrangler deploy --minify --keep-vars` succeeded on Workers Free.
- Final upload size at deploy time: `9556.42 KiB / gzip: 2921.56 KiB`
- The previous non-minified OpenNext deploy path exceeded the free-plan limit.

## Validation matrix

| Check | Result | Notes |
| --- | --- | --- |
| Homepage loads | Pass | `200` on `/`; browser title `LifePage`. |
| Register works | Fail | `POST /api/auth/register` returns `500 {"error":"Server error"}`. |
| Sign-in works | Fail | Blocked by the same staging DB connectivity issue. |
| `/dashboard` avoids redirect loops | Pass (unauthenticated path) | Single redirect to `/login`, final `200`, no loop. |
| `/explore` works | Pass with fallback data | Page renders, but Worker logs show DB lookup fallback. |
| Public portfolio loads | Pass with fallback data | `/u/alexchen` renders, but Worker logs show DB lookup fallback. |
| Public resume page loads | Pass with fallback data | `/u/alexchen/resume` renders. |
| Resume PDF export works | Pass with fallback data | `/api/resume?username=alexchen` returns `200`, `3843` bytes, valid one-page PDF. |
| Root `/resume` on staging host | Expected `404` | Code only serves `/resume` for custom domains; `workers.dev` is an internal app host. |
| Prisma-backed save flow works | Fail | Auth/register cannot reach Postgres from Workers. |
| AI-backed authenticated flow works | Fail | Blocked behind auth + DB reachability. |

## Evidence

- Homepage screenshot: `/var/folders/zd/0b3nmw551mdgk8ybwgcbt1380000gn/T/playwright-mcp-output/1774989289696/page-2026-03-31T20-48-31-963Z.png`
- Register failure screenshot: `/var/folders/zd/0b3nmw551mdgk8ybwgcbt1380000gn/T/playwright-mcp-output/1774989289696/page-2026-03-31T20-50-06-350Z.png`
- Explore screenshot: `/var/folders/zd/0b3nmw551mdgk8ybwgcbt1380000gn/T/playwright-mcp-output/1774989289696/page-2026-03-31T20-50-17-230Z.png`
- Public portfolio screenshot: `/var/folders/zd/0b3nmw551mdgk8ybwgcbt1380000gn/T/playwright-mcp-output/1774989289696/page-2026-03-31T20-50-38-325Z.png`
- Public resume screenshot: `/var/folders/zd/0b3nmw551mdgk8ybwgcbt1380000gn/T/playwright-mcp-output/1774989289696/page-2026-03-31T20-51-01-605Z.png`
- Dashboard redirect check: `/dashboard` -> `/login` with `status=200 redirects=1`
- Resume PDF check: `/api/resume?username=alexchen` -> `status=200 bytes=3843`; `file` reports `PDF document, version 1.4, 1 pages`

## Worker log findings

- Register failure:
  - `Register error: Error: proxy request failed, cannot connect to the specified address`
- Explore/public-page fallback:
  - `Falling back from explore profile lookup: Error: proxy request failed, cannot connect to the specified address`
  - `Falling back from public page username lookup: Error: proxy request failed, cannot connect to the specified address`
- Resume export now survives the DB miss:
  - `Failed to load resume source user: Error: proxy request failed, cannot connect to the specified address`
  - The route still returns a valid PDF by falling back to demo public data.

## Fixes applied in this phase

1. Replaced the `@react-pdf/renderer` stack with a native PDF generator in [src/lib/resume-pdf.ts](/Users/hanfei/My_portforlio_release_hosting/src/lib/resume-pdf.ts), which removed Worker-incompatible WASM/font dependencies and restored PDF export on Workers.
2. Switched the deploy command to `wrangler deploy --minify --keep-vars` in [package.json](/Users/hanfei/My_portforlio_release_hosting/package.json), which reduced the gzip upload below the Workers Free `3 MiB` limit and enabled the real staging deploy.
3. Added Worker-preview smoke coverage to CI earlier in this branch, and enabled GitHub branch protection on `main` requiring the `test-and-build` check.

## Failed checks still requiring follow-up

1. Fix the Cloudflare `DATABASE_URL` secret so Workers can reach the real Postgres instance.
2. Re-run staging smoke for register, sign-in, dashboard session, Prisma save, AI generation, Stripe checkout, Stripe portal, and webhook sync.
3. Replace demo fallback evidence on staging with real database-backed data once DB connectivity is fixed.

