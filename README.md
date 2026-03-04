# LifePage — AI Personal Brand Builder

> Built with ❤️ by [atrak.dev](https://atrak.dev)

Turn your work into a stunning portfolio in minutes. Give LifePage a URL — your website, GitHub, YouTube channel, or any project page — and the AI **crawls it, screenshots it, and builds a world-class portfolio page** for you automatically.

## ✨ Features

- 🕷️ **Web Crawler** — Paste any URL. The AI agent visits the page, takes a screenshot, extracts content (title, headings, meta tags, body text), and feeds it all to OpenAI. No manual input required.
- 🤖 **AI Generation** — GPT-4o-mini synthesizes evidence into a structured profile: headline, about, skills, projects (as case studies), timeline, achievements, and resume bullets — all with Zod schema validation.
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
| AI | OpenAI API (GPT-4o-mini, JSON mode) |
| Schema Validation | Zod v4 |
| Web Crawling | axios + cheerio (HTML) + puppeteer-core + @sparticuz/chromium (screenshots) |
| PDF Export | @react-pdf/renderer |
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
NEXTAUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
OPENAI_API_KEY="sk-your-openai-key-from-platform.openai.com"
```

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
