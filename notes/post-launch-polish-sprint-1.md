# Post-Launch Polish Sprint 1

## Scope

This sprint focused on the highest-signal post-launch surfaces for Atrak Pages:

- landing-page conversion
- first-run onboarding clarity
- public portfolio credibility
- public resume/share clarity
- low-risk performance and analytics improvements

## Prioritized Issue List

### P0: Real traffic funnel analysis is blocked from this environment

- Existing instrumentation is present, but the accessible local database does not contain the `ProductEvent` table, so this environment cannot produce a trustworthy post-launch funnel read.
- Instead of inventing dropoff conclusions, this sprint tightened analytics coverage for the next traffic pass.

### P1: Hero and onboarding still needed a clearer first-run path

- The landing hero explained the product, but it did not make the winning first-run recipe explicit enough.
- Register and dashboard flows still asked users to think about too many branches at once before they saw a first successful publish.

### P1: Public portfolio surfaces still exposed product chrome

- Public profile and resume pages still looked partially like app UI instead of someone’s portfolio and recruiter-facing resume.
- Internal framing such as view/theme/model language was weakening first impression and trust.

### P2: Proof and share surfaces needed to feel more intentional

- Project cards were structurally rich, but the strongest output was not presented early enough.
- Share controls worked, but the copy was generic and the resume view duplicated PDF actions.

### P2: Public media handling had easy optimization headroom

- Public proof and project screenshots were still rendered with raw `img` tags in the portfolio surface.

## What Changed

### Conversion and onboarding

- Tightened the landing-page hero around a clearer proof-to-output promise.
- Replaced generic input examples with typed first-run recipes.
- Strengthened trust copy around proof visibility and share-ready output.
- Made register messaging more explicit about time-to-value and first next step.
- Added input `autocomplete` attributes on the register form.
- Reframed the dashboard around a sequential first-run path:
  - import proof
  - review evidence
  - generate the first version
- Moved link/bio enrichment behind an optional detail pass instead of letting it compete with the first import.
- Improved crawl/generate progress and empty-state messaging.

### Public profile and resume quality

- Removed product-internal framing from public profile hero and resume sidebar.
- Replaced internal resume-model framing with audience-facing guidance.
- Reworked project cards so outcome and proof/source context land earlier.
- Strengthened share copy for portfolio vs resume.
- Removed the duplicate PDF action from the resume share row.

### Performance and analytics

- Converted public profile screenshot surfaces from raw `img` to `next/image` with responsive `sizes`.
- Added new analytics coverage for onboarding blind spots:
  - `signup_submitted`
  - `signup_failed`
  - `crawl_example_set_used`

## Measured Before/After Impact

Because this environment does not have access to a trustworthy production analytics dataset, this section reports objective implementation deltas rather than fake traffic conclusions.

### Instrumentation coverage

- Product event coverage increased from `17` tracked events to `20` tracked events.
- The signup funnel now captures both submit attempts and failures, not just page view and completion.
- Example-set usage in the dashboard now records a dedicated event instead of overloading a generic onboarding-view event.

### Public-surface simplification

- Public profile hero product-state chips reduced from `3` to `0` on the main hero row.
- Resume sidebar reduced from `2` PDF actions to `1`.
- Resume sidebar internal “model” card reduced from `1` to `0`.

### Media/performance hygiene

- Raw screenshot rendering in [public-profile-page.tsx](/Users/hanfei/.tmp/atrak-pages-launch/src/components/public-profile-page.tsx) reduced from `2` raw `img` usages to `0` for the public project/proof surfaces touched in this sprint.
- Those surfaces now use `next/image` with responsive `sizes`, which is the lowest-risk performance improvement available without changing backend media contracts.

### Browser timing note

- Before/after browser timings were captured locally during webpack dev-server runs, but they are not reliable launch KPIs because route compile/warm-cache effects dominate the numbers.
- For that reason, this sprint does not claim production timing wins from those dev-only measurements.

## Changed Files

- [src/app/page.tsx](/Users/hanfei/.tmp/atrak-pages-launch/src/app/page.tsx)
- [src/app/register/page.tsx](/Users/hanfei/.tmp/atrak-pages-launch/src/app/register/page.tsx)
- [src/app/dashboard/page.tsx](/Users/hanfei/.tmp/atrak-pages-launch/src/app/dashboard/page.tsx)
- [src/components/public-profile-page.tsx](/Users/hanfei/.tmp/atrak-pages-launch/src/components/public-profile-page.tsx)
- [src/components/public-resume-page.tsx](/Users/hanfei/.tmp/atrak-pages-launch/src/components/public-resume-page.tsx)
- [src/components/public-share-actions.tsx](/Users/hanfei/.tmp/atrak-pages-launch/src/components/public-share-actions.tsx)
- [src/lib/product-analytics.ts](/Users/hanfei/.tmp/atrak-pages-launch/src/lib/product-analytics.ts)

## Screenshots

### Landing

- Before: [landing-before.png](/Users/hanfei/.tmp/atrak-pages-launch/output/playwright/post-launch-polish/before/landing-before.png)
- After: [landing-after.png](/Users/hanfei/.tmp/atrak-pages-launch/output/playwright/post-launch-polish/after/landing-after.png)

### Register

- Before: [register-before.png](/Users/hanfei/.tmp/atrak-pages-launch/output/playwright/post-launch-polish/before/register-before.png)
- After: [register-after.png](/Users/hanfei/.tmp/atrak-pages-launch/output/playwright/post-launch-polish/after/register-after.png)

### Public Profile

- Before: [profile-before.png](/Users/hanfei/.tmp/atrak-pages-launch/output/playwright/post-launch-polish/before/profile-before.png)
- After: [profile-after.png](/Users/hanfei/.tmp/atrak-pages-launch/output/playwright/post-launch-polish/after/profile-after.png)

### Public Resume

- Before: [resume-before.png](/Users/hanfei/.tmp/atrak-pages-launch/output/playwright/post-launch-polish/before/resume-before.png)
- After: [resume-after.png](/Users/hanfei/.tmp/atrak-pages-launch/output/playwright/post-launch-polish/after/resume-after.png)

## Verification

- `npx tsc --noEmit`
- `npx eslint src/app/page.tsx src/app/register/page.tsx src/app/dashboard/page.tsx src/components/public-profile-page.tsx src/components/public-resume-page.tsx src/components/public-share-actions.tsx src/lib/product-analytics.ts`
- `npm run test:unit`
- `npm run build`

Known build noise:

- sitemap/explore still log the known fallback warning when the local `hanfei` database is unavailable during static generation.

## Next Read

Once production event data is accessible, the first follow-up read should answer:

1. Do users who start from example sets generate more often than users who paste arbitrary URLs?
2. Where does the signup funnel lose people now that submit/failure events are tracked?
3. Does portfolio share rate improve relative to resume share rate after the public-surface polish?
