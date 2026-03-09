# LifePage — AI Personal Brand Builder

> Built with ❤️ by [atrak.dev](https://atrak.dev)

Turn your work into a stunning portfolio in minutes. Give LifePage a URL — your website, GitHub, YouTube channel, or any project page — and the AI **crawls it, screenshots it, and builds a world-class portfolio page** for you automatically.

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
R2_ACCESS_KEY_ID="your-r2-access-key"
R2_SECRET_ACCESS_KEY="your-r2-secret-key"
R2_BUCKET="lifepage-project-videos"
R2_ACCOUNT_ID="your-cloudflare-account-id"
R2_PUBLIC_BASE_URL="https://your-public-r2-host.example.com"
```

If the R2 variables are missing, project demo videos still work locally and are served from `/api/project-videos/assets/...` using files written under `output/project-videos/`.

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

## ☁️ Cloudflare Workers Deploy

LifePage now includes an OpenNext + Wrangler path for Cloudflare Workers.

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
```

If you want Auth.js to use a fixed canonical hostname instead of trusting forwarded headers, also set:

```bash
npx wrangler secret put AUTH_URL
```

For the first production launch, set `AUTH_URL` to your Worker hostname, for example:

```text
https://lifepage-web.<your-subdomain>.workers.dev
```

### Deploy

```bash
npm run cf:deploy
```

The initial launch target is the Worker's `*.workers.dev` hostname defined in `wrangler.jsonc`.

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

The crawler still captures screenshots locally with Puppeteer, but the Cloudflare runtime path treats screenshots as best-effort and may return `null` until a later Browser Rendering integration is added.

## 🎬 Project Demo Videos

LifePage can generate inline project demo videos for public portfolio pages.

### How it works

1. A user or LifeAgent requests a project demo video.
2. LifePage builds a Sora prompt from the project title, problem, approach, impact, tech stack, portfolio mode, and related evidence screenshots when available.
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
├── middleware.ts                   # Route protection (/dashboard requires auth)
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

Credits: Built by [atrak.dev](https://atrak.dev) · LifePage AI Personal Brand Builder
