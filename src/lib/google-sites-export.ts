import type { ProfileJSON } from "@/lib/schema";

interface ExportLink {
  label: string;
  url: string;
}

export interface GoogleSitesExportData {
  name: string;
  headline: string;
  about: string;
  mode: "hiring" | "admissions";
  username?: string | null;
  links: ExportLink[];
  skills: string[];
  experiences: ProfileJSON["experiences"];
  projects: ProfileJSON["projects"];
  achievements: ProfileJSON["achievements"];
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderList(items: string[]) {
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function renderLinks(links: ExportLink[]) {
  return links
    .map(
      (link) =>
        `<a class="link-pill" href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)}</a>`
    )
    .join("");
}

export function buildGoogleSitesHtml(data: GoogleSitesExportData) {
  const projectHeading = data.mode === "admissions" ? "Projects and Work" : "Case Studies";

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(data.name)} - Portfolio Export</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f7f9fc;
        --surface: #ffffff;
        --surface-alt: #eef4ff;
        --text: #10213a;
        --muted: #51627f;
        --border: #d7e0ef;
        --accent: #1d4ed8;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: linear-gradient(180deg, #f3f6fb 0%, #f7f9fc 100%);
        color: var(--text);
        font-family: Arial, Helvetica, sans-serif;
        line-height: 1.6;
      }
      .page {
        max-width: 960px;
        margin: 0 auto;
        padding: 40px 20px 72px;
      }
      .hero {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 24px;
        padding: 40px;
        box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
        margin-bottom: 28px;
      }
      .eyebrow {
        display: inline-block;
        padding: 6px 12px;
        border-radius: 999px;
        background: var(--surface-alt);
        color: var(--accent);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      h1 {
        font-size: 44px;
        line-height: 1.05;
        margin: 18px 0 8px;
      }
      .headline {
        color: var(--accent);
        font-size: 20px;
        font-weight: 700;
        margin: 0 0 16px;
      }
      .summary {
        max-width: 760px;
        color: var(--muted);
        font-size: 17px;
        margin: 0;
      }
      .links {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 22px;
      }
      .link-pill {
        display: inline-flex;
        align-items: center;
        padding: 8px 12px;
        border: 1px solid var(--border);
        border-radius: 999px;
        text-decoration: none;
        color: var(--text);
        background: #fff;
        font-size: 14px;
      }
      .section {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 20px;
        padding: 24px;
        margin-bottom: 20px;
      }
      .section h2 {
        margin: 0 0 14px;
        font-size: 15px;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }
      .skill-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      .skill {
        padding: 8px 12px;
        border-radius: 999px;
        background: var(--surface-alt);
        color: var(--accent);
        font-weight: 700;
        font-size: 14px;
      }
      .item + .item {
        margin-top: 18px;
        padding-top: 18px;
        border-top: 1px solid var(--border);
      }
      .item-header {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: baseline;
      }
      .item-title {
        font-size: 18px;
        font-weight: 700;
        margin: 0;
      }
      .item-meta {
        color: var(--muted);
        font-size: 14px;
        white-space: nowrap;
      }
      .item-copy {
        color: var(--muted);
        margin: 8px 0 0;
      }
      ul {
        margin: 10px 0 0 20px;
        padding: 0;
      }
      .footer {
        color: var(--muted);
        font-size: 13px;
        text-align: center;
        margin-top: 28px;
      }
      @media (max-width: 720px) {
        .hero,
        .section {
          padding: 22px;
        }
        h1 {
          font-size: 34px;
        }
        .item-header {
          flex-direction: column;
          align-items: flex-start;
        }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <section class="hero">
        <span class="eyebrow">Exported from LifePage</span>
        <h1>${escapeHtml(data.name)}</h1>
        <p class="headline">${escapeHtml(data.headline)}</p>
        <p class="summary">${escapeHtml(data.about)}</p>
        ${
          data.links.length > 0
            ? `<div class="links">${renderLinks(data.links)}</div>`
            : ""
        }
      </section>

      ${
        data.skills.length > 0
          ? `<section class="section">
              <h2>Skills</h2>
              <div class="skill-grid">${data.skills
                .map((skill) => `<span class="skill">${escapeHtml(skill)}</span>`)
                .join("")}</div>
            </section>`
          : ""
      }

      ${
        data.experiences.length > 0
          ? `<section class="section">
              <h2>Experience</h2>
              ${data.experiences
                .map(
                  (experience) => `<article class="item">
                      <div class="item-header">
                        <p class="item-title">${escapeHtml(experience.role)} | ${escapeHtml(experience.org)}</p>
                        <span class="item-meta">${escapeHtml(
                          [experience.startDate, experience.endDate ?? "Present"]
                            .filter(Boolean)
                            .join(" - ")
                        )}</span>
                      </div>
                      ${
                        experience.bullets.length > 0
                          ? `<ul>${renderList(experience.bullets)}</ul>`
                          : ""
                      }
                    </article>`
                )
                .join("")}
            </section>`
          : ""
      }

      ${
        data.projects.length > 0
          ? `<section class="section">
              <h2>${escapeHtml(projectHeading)}</h2>
              ${data.projects
                .map((project) => {
                  const body =
                    project.impact ?? project.approach ?? project.problem ?? "";
                  const tech = project.tech.length > 0
                    ? `<p class="item-copy"><strong>Tech:</strong> ${escapeHtml(project.tech.join(", "))}</p>`
                    : "";
                  const links = project.links.length > 0
                    ? `<p class="item-copy"><strong>Links:</strong> ${escapeHtml(
                        project.links.map((link) => `${link.label}: ${link.url}`).join(" | ")
                      )}</p>`
                    : "";

                  return `<article class="item">
                    <p class="item-title">${escapeHtml(project.title)}</p>
                    ${body ? `<p class="item-copy">${escapeHtml(body)}</p>` : ""}
                    ${tech}
                    ${links}
                  </article>`;
                })
                .join("")}
            </section>`
          : ""
      }

      ${
        data.achievements.length > 0
          ? `<section class="section">
              <h2>Achievements</h2>
              ${data.achievements
                .map((achievement) => {
                  const details = [achievement.context, achievement.date, achievement.proof]
                    .filter(Boolean)
                    .join(" | ");

                  return `<article class="item">
                    <p class="item-title">${escapeHtml(achievement.title)}</p>
                    ${details ? `<p class="item-copy">${escapeHtml(details)}</p>` : ""}
                  </article>`;
                })
                .join("")}
            </section>`
          : ""
      }

      <p class="footer">Saved as HTML for manual use in Google Sites or other website builders.</p>
    </div>
  </body>
</html>`;
}
