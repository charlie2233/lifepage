# Atrak Pages — AI Personal Brand Builder

> Built with ❤️ by [atrak.dev](https://atrak.dev)

Turn your work into a stunning portfolio in minutes. Give Atrak Pages a URL — your website, GitHub, YouTube channel, or any project page — and the AI **crawls it, screenshots it, and builds a world-class portfolio page** for you automatically.

## ✨ Features

- 🕷️ **Web Crawler** — Paste any URL. The AI agent visits the page, takes a screenshot, extracts content (title, headings, meta tags, body text), and feeds it all to OpenAI. No manual input required.
- 🤖 **AI Generation** — GPT-4o-mini synthesizes evidence into a structured profile: headline, about, skills, projects (as case studies), timeline, achievements, and resume bullets — all with Zod schema validation.
- 🎬 **Project Demo Videos** — Generate polished 8-second Sora demo clips for portfolio projects, attach them to project cards, and render them inline on public pages.
- 🎨 **Two Premium Themes** — **Obsidian** (dark glass neon) + **Paper** (clean editorial serif). Theme applied per user to their public page.
- 💼 **Hiring ↔ Admissions Mode** — Same data, different emphasis. Toggle between recruiter view (skills, impact, case studies) and admissions view (story, growth, leadership).
- 📄 **Resume PDF Export** — One-click resume download with action verbs and measurable outcomes.
- 🔒 **Privacy Controls** — Public/private toggle per user + per-evidence-item visibility.
- 📊 **Story Timeline** — Documentary-style timeline of your growth, generated from evidence.
- 🏆 **Proof Gallery** — Screenshots of crawled pages as visual proof of your work.
- 🌐 **Public Portfolio** — Permanent URL at `/u/yourname`, SEO-friendly, fast server rendering.

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 App Router + TypeScript |
| Styling | TailwindCSS v4 (custom Obsidian + Paper themes) |
| Database | Prisma v7 + PostgreSQL |
| Auth | NextAuth v5 (JWT, credentials provider) |
| AI | OpenAI API (GPT-5 / GPT-4.1 family + Sora video generation) |
| Schema Validation | Zod v4 |
| Web Crawling | axios + cheerio (HTML) + puppeteer-core + @sparticuz/chromium (screenshots) |
| PDF Export | @react-pdf/renderer |
| Asset Storage | Cloudflare R2 (with local dev fallback for project videos) |
| Password Hashing | bcryptjs (12 rounds) |

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/charlie2233/My_portforlio
cd My_portforlio
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/lifepage"
AUTH_SECRET="run: openssl rand -base64 32"
AUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
OPENAI_API_KEY="sk-your-openai-key-from-platform.openai.com"
OPENAI_SORA_MODEL="sora-2"
STRIPE_SECRET_KEY="sk_test_or_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PLUS_MONTHLY_PRICE_ID="price_..."
STRIPE_PLUS_YEARLY_PRICE_ID="price_..."
STRIPE_PRO_MONTHLY_PRICE_ID="price_..."
STRIPE_PRO_YEARLY_PRICE_ID="price_..."
R2_ACCESS_KEY_ID="your-r2-access-key"
R2_SECRET_ACCESS_KEY="your-r2-secret-key"
R2_BUCKET="lifepage-project-videos"
R2_ACCOUNT_ID="your-cloudflare-account-id"
R2_PUBLIC_BASE_URL="https://your-public-r2-host.example.com"
CLOUDFLARE_API_TOKEN="your-cloudflare-api-token"
CLOUDFLARE_SAAS_ZONE_ID="your-cloudflare-zone-id"
CLOUDFLARE_SAAS_CNAME_TARGET="customers.your-saas-zone.com"
CLOUDFLARE_SAAS_FALLBACK_ORIGIN="origin.your-saas-zone.com"
```

If the R2 variables are missing, project demo videos still work locally and are served from `/api/project-videos/assets/...` using files written under `output/project-videos/`.

### Stripe Billing Setup

Create exactly four recurring Stripe prices:

- `Atrak Pages Plus Monthly` — `$5/month`
- `Atrak Pages Plus Yearly` — `$50/year`
- `Atrak Pages Pro Monthly` — `$10/month`
- `Atrak Pages Pro Yearly` — `$100/year`

Then wire the resulting price ids into the Stripe env vars above.

Atrak Pages only trusts the server-side Stripe price map. Do not expose price ids or amounts from the client as the source of truth.

### 3. Set Up Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations (creates tables)
npx prisma migrate dev --name init
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## End-to-End Tests

Atrak Pages now ships with a Playwright release-gate suite for auth, billing webhook sync, crawl imports, profile generation, public pages, resume export, and Cloudflare SaaS domain activation.

### Local E2E environment

Set the test-specific env vars before running the suite:

```env
TEST_DATABASE_URL="postgresql://user:password@localhost:5432/lifepage_test"
E2E_BASE_URL="http://127.0.0.1:3001"
E2E_TEST_MODE="1"
E2E_FAKE_STRIPE="1"
E2E_FAKE_CLOUDFLARE="1"
E2E_FAKE_DNS="1"
E2E_FAKE_CRAWL="1"
```

The Playwright harness uses deterministic fake providers instead of live Stripe, Cloudflare, DNS, crawl, or OpenAI calls. It still exercises the real app routes and UI.

### Run the suite

```bash
npx prisma db push --force-reset
npx playwright install chromium
npm run test:e2e
```

For CI-style reporting:

```bash
npm run test:e2e:ci
```

## Deployment

Atrak Pages should launch publicly at `https://pages.atrak.dev`.

Recommended release posture:

- Canonical app runtime: Vercel on `pages.atrak.dev`
- Legacy transition domain: `lifepage.one` redirecting to `pages.atrak.dev`
- GitHub Pages: fallback-only landing page at `https://charlie2233.github.io/My_portforlio/`, never the real runtime
- Cloudflare Workers: secondary/contingency runtime path retained in-repo

Release runbook: [`notes/atrak-pages-launch-checklist.md`](notes/atrak-pages-launch-checklist.md)

## ☁️ Cloudflare Workers Deploy

Atrak Pages still includes an OpenNext + Wrangler path for Cloudflare Workers.

Treat this as a contingency runtime for now, not the preferred public launch target.

### Local preview

```bash
cp .dev.vars.example .dev.vars
npm run cf:preview
```

This builds the production Worker bundle and serves it through Wrangler on `http://127.0.0.1:8787`.

### Production secrets

Verify Wrangler auth before the first deploy:

```bash
npx wrangler whoami
```

If that fails, authenticate with `wrangler login` locally or set `CLOUDFLARE_API_TOKEN` in CI.

Set secrets before the first deploy:

```bash
npx wrangler secret put DATABASE_URL
npx wrangler secret put AUTH_SECRET
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put CRON_SECRET
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put STRIPE_PLUS_MONTHLY_PRICE_ID
npx wrangler secret put STRIPE_PLUS_YEARLY_PRICE_ID
npx wrangler secret put STRIPE_PRO_MONTHLY_PRICE_ID
npx wrangler secret put STRIPE_PRO_YEARLY_PRICE_ID
npx wrangler secret put CLOUDFLARE_API_TOKEN
npx wrangler secret put CLOUDFLARE_SAAS_ZONE_ID
npx wrangler secret put CLOUDFLARE_SAAS_CNAME_TARGET
npx wrangler secret put CLOUDFLARE_SAAS_FALLBACK_ORIGIN
```

If you want Auth.js to use a fixed canonical hostname instead of trusting forwarded headers, also set:

```bash
npx wrangler secret put AUTH_URL
```

If you are validating the Workers path directly, set `AUTH_URL` to your Worker hostname, for example:

```text
https://lifepage-web.<your-subdomain>.workers.dev
```

For the real launch, set `AUTH_URL` to `https://pages.atrak.dev`. `NEXTAUTH_URL` can remain local-only for development.

### Deploy

```bash
npm run cf:deploy
```

The `*.workers.dev` hostname defined in `wrangler.jsonc` is a runtime fallback, not the intended public URL.

## Cloudflare for SaaS Domains

Atrak Pages supports customer-owned custom domains through Cloudflare for SaaS custom hostnames.

Detailed launch and operator guidance lives in [`docs/custom-domains.md`](docs/custom-domains.md).

Temporary operating mode: custom domains should stay detached until DNS is intentionally repointed to the Cloudflare-managed target. Do not leave GitHub Pages DNS records in place for production domains, and reserve `lifepage.one` for transition redirect traffic rather than the canonical app runtime.

### Required SaaS hostnames

Configure two provider-owned hostnames inside a Cloudflare-managed zone:

- `CLOUDFLARE_SAAS_CNAME_TARGET`: the hostname customers point their CNAME at, for example `customers.your-saas-zone.com`
- `CLOUDFLARE_SAAS_FALLBACK_ORIGIN`: the proxied fallback origin for custom hostnames, for example `origin.your-saas-zone.com`

Do not use `*.workers.dev` as the customer-facing CNAME target in production.

### Launch scope

- Subdomain custom domains only
- Apex domains are intentionally out of scope for now and should not be promised in product copy

### How verification works

1. Saving a domain provisions a Cloudflare custom hostname.
2. The dashboard shows the required customer CNAME target.
3. `Verify DNS` confirms the customer CNAME is in place and refreshes Cloudflare hostname validation.
4. The domain becomes active only when both the Cloudflare hostname status and SSL status are active.

### Graceful fallback when provider config is incomplete

- The dashboard should never hard-error just because Cloudflare SaaS is incomplete in an environment.
- A requested hostname can still be saved locally while provider setup is paused.
- Verification remains paused with actionable copy until the Cloudflare SaaS configuration is finished.

## Stripe Billing Runbook

### 1. Create prices in Stripe

Create the four recurring prices listed above in both Stripe test mode and live mode.

### 2. Set environment variables

Set all six Stripe variables in local `.env.local` for development and in your deployed platform secrets for production.

### 3. Register the webhook

Point Stripe at:

```text
https://<your-host>/api/stripe/webhook
```

Subscribe to:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

Atrak Pages stores Stripe webhook event ids in the database to dedupe retries and keep an audit trail.

### 4. Local webhook testing

Use the Stripe CLI during local development:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the emitted signing secret into `STRIPE_WEBHOOK_SECRET`, then run test card flows against the app.

### 5. Production smoke checks

1. Sign in with a real test account.
2. Start a `Plus` monthly checkout.
3. Complete payment with a Stripe test card.
4. Confirm the Stripe dashboard shows successful webhook delivery.
5. Confirm `/api/billing` and the dashboard update to `Plus`.
6. Open `Manage subscription` and verify the Billing Portal opens.
7. Cancel at period end in Stripe and confirm the dashboard reflects that state.

### 6. Rollback

If webhook sync fails in production:

1. disable billing CTAs by removing the Stripe env vars for the environment
2. fix webhook delivery or price config
3. replay failed Stripe events from the Stripe dashboard

### Rollback

Cloudflare keeps prior Worker versions. Roll back from the dashboard or redeploy the last known-good commit.

### Smoke checks after deploy

1. Load `/`
2. Register or sign in
3. Confirm `/dashboard` opens without redirect loops
4. Open `/explore`
5. Open a public portfolio and `/resume`
6. Hit one AI-backed action and one Prisma-backed save flow

### Current limitation

Customer-owned custom domains still require a Cloudflare-managed SaaS zone and the four Cloudflare SaaS environment variables listed above for full provisioning. When those values are incomplete, the dashboard now falls back to a paused/config-required state instead of hard-failing the user flow.

## 🎬 Project Demo Videos

Atrak Pages can generate inline project demo videos for public portfolio pages.

### How it works

1. A user or the Atrak Pages agent requests a project demo video.
2. Atrak Pages builds a Sora prompt from the project title, problem, approach, impact, tech stack, portfolio mode, and related evidence screenshots when available.
3. Sora renders an 8-second polished product demo.
4. The completed video and poster image are uploaded to Cloudflare R2 when configured, or written to local output storage during development.
5. The active generated profile is patched with a structured media object so the demo renders inline on the public project card.

### API routes

- `POST /api/project-videos` queues a new project video job for a profile project.
- `GET /api/project-videos/:artifactId` polls the job, attaches completed media, and returns the updated profile when ready.
- `GET /api/project-videos/assets/...` serves local development assets when R2 is not configured.

### Sample video rollout

To generate the sample demo portfolio videos locally:

```bash
npm run demo:project-videos
```

This writes a manifest to `output/demo-project-videos/manifest.json` and stores local development assets under `output/project-videos/`.

## 🕷️ How the Web Crawler Works

This is the key feature. When you paste a URL (e.g. `https://atrak.dev`):

1. **HTTP Fetch** — `axios` fetches the raw HTML with a browser-like User-Agent
2. **Content Extraction** — `cheerio` parses the HTML to extract:
   - Page title + meta description
   - OG/Twitter card tags
   - All `h1/h2/h3` headings
   - Outbound links
   - Body text (up to 5,000 chars, scripts/styles removed)
3. **Screenshot** — `puppeteer-core` + `@sparticuz/chromium` launches a headless browser, navigates to the URL, and captures a JPEG screenshot
4. **Storage** — Everything is stored as an `EvidenceItem` in PostgreSQL
5. **AI Analysis** — When you click "Generate", all evidence items are sent to OpenAI which synthesizes them into a structured `ProfileJSON`

You can crawl **multiple URLs** (your portfolio site, GitHub profile, YouTube channel, project demos) and the AI combines them all.

## 🧠 AI Output Schema

The AI generates strict JSON validated by Zod:

```typescript
{
  headline: string,          // "Full-Stack Engineer building AI products"
  about: string,             // 2-4 sentence bio
  skills: [{ tag, level, evidenceRefs }],
  experiences: [{ role, org, startDate, endDate, bullets, evidenceRefs }],
  projects: [{ title, problem, approach, impact, tech, links, media }],
  achievements: [{ title, context, date, proof }],
  timeline: [{ year, milestones }],
  resume: { summary, bullets },
  stats: { projectsShipped, yearsBuilding, competitions },
  confidence: 0.0–1.0        // how much data the AI had
}
```

## 📁 Folder Structure

```
src/
├── app/
│   ├── page.tsx                   # Landing page (dark, Obsidian theme)
│   ├── login/page.tsx             # Sign in
│   ├── register/page.tsx          # Create account
│   ├── dashboard/page.tsx         # Main dashboard (crawl, generate, settings)
│   ├── u/[username]/page.tsx      # Public portfolio page
│   └── api/
│       ├── auth/[...nextauth]/    # NextAuth handlers
│       ├── auth/register/         # User registration
│       ├── crawl/                 # Web crawler endpoint
│       ├── evidence/              # Evidence CRUD (list, toggle, delete)
│       ├── generate/              # AI generation endpoint
│       ├── profile/               # Active profile retrieval
│       └── resume/                # PDF export data
├── lib/
│   ├── ai.ts                      # OpenAI generation functions
│   ├── auth.ts                    # NextAuth v5 config
│   ├── crawler.ts                 # Web crawler + screenshot logic
│   ├── db.ts                      # Prisma client singleton
│   ├── schema.ts                  # Zod schemas for AI output
│   └── utils.ts                   # cn() utility
├── proxy.ts                        # Route protection (/dashboard requires auth)
└── types/next-auth.d.ts           # Extended session types
prisma/
└── schema.prisma                  # DB models
```

## 🔒 Security

- Passwords hashed with bcrypt (12 rounds)
- All API routes validate session before any DB operation
- Zod validates all AI output and API inputs
- Users can only access their own data (userId scoping on all queries)

---

Credits: Built by [atrak.dev](https://atrak.dev) · Atrak Pages AI Personal Brand Builder
