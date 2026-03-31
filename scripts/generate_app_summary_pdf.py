from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import landscape, letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph


OUTPUT_PATH = Path("output/pdf/lifepage-repo-summary.pdf")


def build_styles():
    styles = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "Title",
            parent=styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=23,
            leading=26,
            textColor=colors.HexColor("#0f172a"),
            alignment=TA_LEFT,
            spaceAfter=0,
        ),
        "subtitle": ParagraphStyle(
            "Subtitle",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=8.4,
            leading=10.6,
            textColor=colors.HexColor("#475569"),
            spaceAfter=0,
        ),
        "section": ParagraphStyle(
            "Section",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=10.2,
            leading=12.4,
            textColor=colors.HexColor("#0f766e"),
            spaceAfter=0,
        ),
        "body": ParagraphStyle(
            "Body",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=10.7,
            textColor=colors.HexColor("#111827"),
            spaceAfter=0,
        ),
        "bullet": ParagraphStyle(
            "Bullet",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=8.35,
            leading=10.45,
            leftIndent=10,
            firstLineIndent=-8,
            bulletIndent=0,
            textColor=colors.HexColor("#111827"),
            spaceAfter=0,
        ),
        "small": ParagraphStyle(
            "Small",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=7.6,
            leading=9.3,
            textColor=colors.HexColor("#475569"),
            spaceAfter=0,
        ),
    }


def draw_flowables(pdf: canvas.Canvas, items, x: float, y: float, width: float):
    for item in items:
        gap = 5
        if isinstance(item, tuple) and item[0] == "spacer":
            y -= item[1]
            continue

        flowable = item
        _, height = flowable.wrap(width, 1000)
        flowable.drawOn(pdf, x, y - height)
        y -= height + gap
    return y


def paragraph(text: str, style: ParagraphStyle):
    return Paragraph(text, style)


def build_column_content(styles):
    left = [
        paragraph("What It Is", styles["section"]),
        paragraph(
            "LifePage is an AI personal brand builder that turns URLs and other proof into a public portfolio site and resume output. The repo shows one product that combines evidence import, profile generation, publishing, billing, and supporting automation.",
            styles["body"],
        ),
        ("spacer", 4),
        paragraph("Who It’s For", styles["section"]),
        paragraph(
            "Primary persona: creators, students, job seekers, and builders who want a proof-backed personal site without hand-writing every section.",
            styles["body"],
        ),
        ("spacer", 4),
        paragraph("What It Does", styles["section"]),
        paragraph(
            "&bull; Imports multiple URLs and expands Google Sites pages into evidence items.",
            styles["bullet"],
        ),
        paragraph(
            "&bull; Crawls pages, extracts metadata/body text, and captures screenshots.",
            styles["bullet"],
        ),
        paragraph(
            "&bull; Uses AI to generate structured profile data, resume bullets, stats, and timeline content.",
            styles["bullet"],
        ),
        paragraph(
            "&bull; Publishes public pages at <font name='Helvetica-Bold'>/u/[username]</font> with privacy and visibility controls.",
            styles["bullet"],
        ),
        paragraph(
            "&bull; Exports resume PDFs and supports separate portfolio/resume presentation presets.",
            styles["bullet"],
        ),
        paragraph(
            "&bull; Handles billing, custom domains, and inline project demo videos.",
            styles["bullet"],
        ),
        paragraph(
            "&bull; Includes agent tools and scheduled automations for refresh/regeneration workflows.",
            styles["bullet"],
        ),
    ]

    right = [
        paragraph("How It Works", styles["section"]),
        paragraph(
            "&bull; <font name='Helvetica-Bold'>UI:</font> Next.js App Router pages for landing, auth, dashboard, explore, public profile, and resume views.",
            styles["bullet"],
        ),
        paragraph(
            "&bull; <font name='Helvetica-Bold'>API:</font> Route handlers for crawl, generate, agent, resume, billing, settings, automations, domains, and project videos.",
            styles["bullet"],
        ),
        paragraph(
            "&bull; <font name='Helvetica-Bold'>Data:</font> Prisma + PostgreSQL models store users, evidence, generated profiles, page settings, Stripe state, automations, and agent artifacts.",
            styles["bullet"],
        ),
        paragraph(
            "&bull; <font name='Helvetica-Bold'>Flow:</font> URL input -> crawl + screenshot -> <font name='Helvetica-Bold'>EvidenceItem</font> rows -> AI generation -> active <font name='Helvetica-Bold'>GeneratedProfile</font> -> public page/resume render. Stripe, Cloudflare SaaS/R2, and OpenNext/Workers extend billing, domains, storage, and deploy.",
            styles["bullet"],
        ),
        ("spacer", 4),
        paragraph("How To Run", styles["section"]),
        paragraph(
            "1. <font name='Helvetica-Bold'>npm install</font>",
            styles["bullet"],
        ),
        paragraph(
            "2. <font name='Helvetica-Bold'>cp .env.example .env.local</font>",
            styles["bullet"],
        ),
        paragraph(
            "3. Set at least <font name='Helvetica-Bold'>DATABASE_URL</font>, auth secrets/URLs, and <font name='Helvetica-Bold'>OPENAI_API_KEY</font>. Stripe/Cloudflare values are only needed for those features.",
            styles["bullet"],
        ),
        paragraph(
            "4. <font name='Helvetica-Bold'>npx prisma generate &amp;&amp; npx prisma migrate dev --name init</font>",
            styles["bullet"],
        ),
        paragraph(
            "5. <font name='Helvetica-Bold'>npm run dev</font> and open <font name='Helvetica-Bold'>http://localhost:3000</font>",
            styles["bullet"],
        ),
        ("spacer", 4),
        paragraph("Tech Used", styles["section"]),
        paragraph(
            "Next.js 16, React 19, TypeScript 5.9, Tailwind CSS 4, Prisma 7, PostgreSQL, NextAuth 5, OpenAI API, Stripe, Cloudflare Workers/R2/SaaS, and Playwright.",
            styles["body"],
        ),
        ("spacer", 6),
        paragraph(
            "Sources: README.md, package.json, prisma/schema.prisma, src/app/*, src/lib/*, and e2e/*.spec.ts.",
            styles["small"],
        ),
    ]

    return left, right


def main():
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(str(OUTPUT_PATH), pagesize=landscape(letter))
    width, height = landscape(letter)
    styles = build_styles()

    margin_x = 28
    top_y = height - 28
    column_gap = 24
    column_width = (width - (margin_x * 2) - column_gap) / 2
    left_x = margin_x
    right_x = margin_x + column_width + column_gap

    title = paragraph("LifePage - Repo Summary", styles["title"])
    subtitle = paragraph(
        "Single-page summary based only on repository evidence as of March 31, 2026.",
        styles["subtitle"],
    )

    _, title_h = title.wrap(width - margin_x * 2, 200)
    title.drawOn(pdf, margin_x, top_y - title_h)
    _, subtitle_h = subtitle.wrap(width - margin_x * 2, 200)
    subtitle.drawOn(pdf, margin_x, top_y - title_h - subtitle_h - 2)

    rule_y = top_y - title_h - subtitle_h - 10
    pdf.setStrokeColor(colors.HexColor("#99f6e4"))
    pdf.setLineWidth(2)
    pdf.line(margin_x, rule_y, width - margin_x, rule_y)

    left_items, right_items = build_column_content(styles)
    column_top = rule_y - 16
    left_bottom = draw_flowables(pdf, left_items, left_x, column_top, column_width)
    right_bottom = draw_flowables(pdf, right_items, right_x, column_top, column_width)

    min_bottom = min(left_bottom, right_bottom)
    if min_bottom < 20:
        raise RuntimeError("Content overflowed the single-page layout.")

    pdf.save()
    print(OUTPUT_PATH.resolve())


if __name__ == "__main__":
    main()
