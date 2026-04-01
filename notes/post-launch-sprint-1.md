# Post-Launch Enhancement Sprint 1

## Goals

- Improve conversion on the landing page
- Improve onboarding clarity on first run
- Improve credibility with stronger proof and trust signals
- Improve perceived and actual performance
- Improve shareability and SEO
- Instrument the key product funnel

## Prioritized Issue List

### P0

- Hero hierarchy made the product feel abstract before users saw proof.
- First-run import flow lacked examples, progress feedback, and actionable empty states.
- Public pages were missing direct sharing hooks and richer metadata for link previews.
- The product had no durable event stream for signup, generation success, and profile sharing.

### P1

- Public project cards underplayed evidence and source credibility.
- Crawl and generate failures were too generic to help users recover quickly.
- Portfolio and resume routes needed stronger route-level metadata and schema markup.
- Explore and public routes needed stronger cache and lazy-loading defaults.

### P2

- Dashboard skeletons and generating states were too weak for perceived performance.
- Resume/export presentation needed cleaner share and download actions.

## Design Notes

- The landing page now leads with proof instead of feature density. The hero copy, CTA labels, and trust section are built to answer three questions quickly: what it does, what I should do first, and why I should trust the output.
- The first-run path is now framed as a guided import instead of a blank form. Example URLs, checklist-style empty states, and explicit progress feedback reduce the "what do I paste here?" drop-off point.
- Public pages now push evidence closer to the projects themselves. Proof badges, evidence blocks, and share actions make portfolio pages feel more publishable and less like raw generated output.
- Shareability and SEO are treated as product UX, not only infra. Metadata, OG assets, structured data, robots, and sitemap coverage are now part of the baseline path.
- Funnel measurement is minimal but actionable. The new event model is focused on the three questions that matter first: who signs up, who successfully generates a profile, and who shares a profile after generation.

## Implemented Scope

- Landing page hero, CTA hierarchy, proof-first trust section, and homepage tracking
- Register and dashboard onboarding clarity improvements
- Example URLs, empty states, progress states, and clearer error messaging
- SEO metadata, robots, sitemap, static OG asset, and route-level structured data
- Public portfolio and resume sharing improvements
- Better project-card proof presentation
- Skeleton and loading-state improvements
- Route caching and lazy media/image loading improvements
- Product analytics API, client helpers, and Prisma schema for funnel events

## Measurement Events

- `landing_page_viewed`
- `signup_page_viewed`
- `signup_completed`
- `dashboard_onboarding_viewed`
- `crawl_started`
- `crawl_completed`
- `crawl_failed`
- `generate_profile_started`
- `generate_profile_succeeded`
- `generate_profile_failed`
- `public_profile_viewed`
- `public_resume_viewed`
- `profile_share_clicked`
- `resume_share_clicked`
- `profile_copy_link_clicked`
- `resume_copy_link_clicked`
- `resume_download_clicked`

## Screenshot Inventory

- Before landing: `output/playwright/before/landing-before.png`
- After landing: `output/playwright/after/landing-after.png`
- Before register: `output/playwright/before/register-before.png`
- After register: `output/playwright/after/register-after.png`
- Before profile: `output/playwright/before/profile-before.png`
- After profile: `output/playwright/after/profile-after.png`

## Verification

- `npx prisma generate`
- `npx tsc --noEmit`
- `npx eslint src/app/layout.tsx src/app/page.tsx src/app/register/page.tsx src/app/dashboard/page.tsx src/app/explore/page.tsx src/app/resume/page.tsx src/app/u/[username]/page.tsx src/app/u/[username]/resume/page.tsx src/components/public-profile-page.tsx src/components/public-resume-page.tsx src/components/public-share-actions.tsx src/components/structured-data.tsx src/components/track-page-view.tsx src/lib/site.ts src/lib/product-analytics.ts src/lib/analytics-client.ts src/app/api/analytics/route.ts src/app/api/auth/register/route.ts src/app/api/crawl/route.ts src/app/api/generate/route.ts`
- `npm run build`

## Notes

- This sprint intentionally stays separate from the unrelated Cloudflare and middleware changes already present in the working tree when the work started.
