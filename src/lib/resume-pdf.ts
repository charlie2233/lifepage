import type { ProfileJSON } from "@/lib/schema";

interface ResumeLink {
  label: string;
  url: string;
}

export interface ResumePdfData {
  name: string;
  headline: string;
  summary: string;
  username?: string | null;
  email?: string | null;
  location?: string | null;
  links: ResumeLink[];
  skills: string[];
  bullets: string[];
  experiences: ProfileJSON["experiences"];
  projects: ProfileJSON["projects"];
  achievements: ProfileJSON["achievements"];
}

interface PdfLine {
  color: [number, number, number];
  font: "F1" | "F2";
  size: number;
  text: string;
}

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN_LEFT = 44;
const MARGIN_RIGHT = 44;
const MARGIN_TOP = 42;
const MARGIN_BOTTOM = 32;
const BODY_FONT_SIZE = 10;

function normalizePdfText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7e]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function estimateTextWidth(text: string, fontSize: number) {
  let units = 0;
  for (const char of text) {
    if ("ilI1|".includes(char)) {
      units += 0.28;
    } else if ("mwWM@#%&".includes(char)) {
      units += 0.95;
    } else if ("ABCDEFGHJKLMNOPQRSTUVWXYZ".includes(char)) {
      units += 0.72;
    } else if ("abcdefghjknopqrstuvwxyz234567890".includes(char)) {
      units += 0.55;
    } else if (" .,;:'`".includes(char)) {
      units += 0.24;
    } else if ("-_/".includes(char)) {
      units += 0.3;
    } else {
      units += 0.52;
    }
  }

  return units * fontSize;
}

function wrapText(text: string, fontSize: number, maxWidth: number) {
  const normalized = normalizePdfText(text);
  if (!normalized) return [];

  const words = normalized.split(" ");
  const lines: string[] = [];
  let current = words.shift() ?? "";

  for (const word of words) {
    const candidate = `${current} ${word}`;
    if (estimateTextWidth(candidate, fontSize) <= maxWidth) {
      current = candidate;
      continue;
    }

    lines.push(current);
    current = word;
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function createContentStream(commands: string[]) {
  return commands.join("\n");
}

function renderPdfDocument(pageStreams: string[]) {
  const objects: string[] = [];

  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push("");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

  const pageObjectNumbers: number[] = [];

  for (const stream of pageStreams) {
    const pageObjectNumber = objects.length + 1;
    const contentObjectNumber = objects.length + 2;
    pageObjectNumbers.push(pageObjectNumber);

    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`
    );
    objects.push(
      `<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`
    );
  }

  objects[1] = `<< /Type /Pages /Kids [${pageObjectNumbers
    .map((pageNumber) => `${pageNumber} 0 R`)
    .join(" ")}] /Count ${pageObjectNumbers.length} >>`;

  let output = "%PDF-1.4\n";
  const offsets: number[] = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(output, "utf8"));
    output += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(output, "utf8");
  output += `xref\n0 ${objects.length + 1}\n`;
  output += "0000000000 65535 f \n";
  for (let index = 1; index <= objects.length; index += 1) {
    output += `${offsets[index].toString().padStart(10, "0")} 00000 n \n`;
  }
  output += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(output, "utf8");
}

export async function renderResumePdfBuffer(resume: ResumePdfData) {
  const contentWidth = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
  const pageCommands: string[][] = [[]];
  let pageIndex = 0;
  let y = PAGE_HEIGHT - MARGIN_TOP;

  function currentPage() {
    return pageCommands[pageIndex];
  }

  function ensureSpace(lineHeight: number) {
    if (y - lineHeight < MARGIN_BOTTOM) {
      pageCommands.push([]);
      pageIndex += 1;
      y = PAGE_HEIGHT - MARGIN_TOP;
    }
  }

  function pushLine(line: PdfLine, lineHeight: number) {
    ensureSpace(lineHeight);
    currentPage().push(
      `BT`,
      `/${line.font} ${line.size} Tf`,
      `${line.color[0]} ${line.color[1]} ${line.color[2]} rg`,
      `1 0 0 1 ${MARGIN_LEFT} ${y} Tm`,
      `(${escapePdfText(line.text)}) Tj`,
      `ET`
    );
    y -= lineHeight;
  }

  function pushWrappedParagraph(
    text: string,
    options: {
      color?: [number, number, number];
      font?: "F1" | "F2";
      gapAfter?: number;
      lineHeight?: number;
      size?: number;
    } = {}
  ) {
    const size = options.size ?? BODY_FONT_SIZE;
    const lineHeight = options.lineHeight ?? size + 4;
    const color = options.color ?? [0.12, 0.16, 0.23];
    const font = options.font ?? "F1";
    const lines = wrapText(text, size, contentWidth);

    for (const line of lines) {
      pushLine({ text: line, size, color, font }, lineHeight);
    }

    y -= options.gapAfter ?? 4;
  }

  function pushSectionTitle(title: string) {
    y -= 4;
    pushLine(
      {
        text: normalizePdfText(title).toUpperCase(),
        size: 9,
        font: "F2",
        color: [0.06, 0.09, 0.15],
      },
      14
    );
    const dividerY = y + 8;
    currentPage().push(
      `0.88 0.91 0.94 RG`,
      `1 w`,
      `${MARGIN_LEFT} ${dividerY} m`,
      `${PAGE_WIDTH - MARGIN_RIGHT} ${dividerY} l`,
      `S`
    );
    y -= 4;
  }

  function pushBulletList(items: string[]) {
    for (const item of items) {
      const wrapped = wrapText(item, BODY_FONT_SIZE, contentWidth - 16);
      wrapped.forEach((line, index) => {
        const prefix = index === 0 ? "- " : "  ";
        pushLine(
          {
            text: `${prefix}${line}`,
            size: BODY_FONT_SIZE,
            font: "F1",
            color: [0.12, 0.16, 0.23],
          },
          14
        );
      });
      y -= 2;
    }
  }

  pushLine(
    {
      text: normalizePdfText(resume.name || "LifePage User"),
      size: 24,
      font: "F2",
      color: [0.06, 0.09, 0.15],
    },
    30
  );
  pushWrappedParagraph(resume.headline, {
    color: [0.11, 0.31, 0.85],
    lineHeight: 16,
    size: 11,
  });

  const meta = [
    resume.username ? `@${resume.username}` : null,
    resume.location ?? null,
    resume.email ?? null,
    ...resume.links.map((link) => `${link.label}: ${link.url}`),
  ].filter(Boolean);
  if (meta.length > 0) {
    pushWrappedParagraph(meta.join(" | "), {
      color: [0.28, 0.35, 0.45],
      gapAfter: 10,
      lineHeight: 13,
      size: 9,
    });
  } else {
    y -= 8;
  }

  pushSectionTitle("Summary");
  pushWrappedParagraph(resume.summary, { gapAfter: 6 });

  if (resume.bullets.length > 0) {
    pushSectionTitle("Selected Impact");
    pushBulletList(resume.bullets);
    y -= 4;
  }

  if (resume.experiences.length > 0) {
    pushSectionTitle("Experience");
    for (const experience of resume.experiences) {
      const headerParts = [experience.role, experience.org].filter(Boolean);
      pushWrappedParagraph(headerParts.join(" | "), {
        font: "F2",
        gapAfter: 2,
      });
      const dates = [experience.startDate, experience.endDate ?? "Present"]
        .filter(Boolean)
        .join(" - ");
      if (dates) {
        pushWrappedParagraph(dates, {
          color: [0.28, 0.35, 0.45],
          gapAfter: 2,
          lineHeight: 12,
          size: 9,
        });
      }
      if (experience.bullets.length > 0) {
        pushBulletList(experience.bullets);
      }
      y -= 4;
    }
  }

  if (resume.projects.length > 0) {
    pushSectionTitle("Projects");
    for (const project of resume.projects) {
      pushWrappedParagraph(project.title, {
        font: "F2",
        gapAfter: 2,
      });
      const description = project.impact ?? project.approach ?? project.problem ?? "";
      if (description) {
        pushWrappedParagraph(description, { gapAfter: 2 });
      }
      if (project.tech.length > 0) {
        pushWrappedParagraph(`Tech: ${project.tech.join(", ")}`, {
          color: [0.2, 0.27, 0.37],
          gapAfter: 2,
          lineHeight: 12,
          size: 9,
        });
      }
      if (project.links.length > 0) {
        pushWrappedParagraph(
          project.links.map((link) => `${link.label}: ${link.url}`).join(" | "),
          {
            color: [0.2, 0.27, 0.37],
            gapAfter: 4,
            lineHeight: 12,
            size: 9,
          }
        );
      } else {
        y -= 2;
      }
    }
  }

  if (resume.skills.length > 0) {
    pushSectionTitle("Skills");
    pushWrappedParagraph(resume.skills.join(", "));
  }

  if (resume.achievements.length > 0) {
    pushSectionTitle("Achievements");
    for (const achievement of resume.achievements) {
      pushWrappedParagraph(achievement.title, {
        font: "F2",
        gapAfter: 2,
      });
      const details = [
        achievement.context,
        achievement.date,
        achievement.proof,
      ]
        .filter(Boolean)
        .join(" | ");
      if (details) {
        pushWrappedParagraph(details, {
          color: [0.2, 0.27, 0.37],
          gapAfter: 4,
          lineHeight: 12,
          size: 9,
        });
      } else {
        y -= 2;
      }
    }
  }

  pageCommands.forEach((commands, index) => {
    commands.push(
      `BT`,
      `/F1 8 Tf`,
      `0.39 0.45 0.54 rg`,
      `1 0 0 1 ${MARGIN_LEFT} 18 Tm`,
      `(${escapePdfText(
        `${normalizePdfText(resume.name || "LifePage User")} Resume | ${index + 1}/${pageCommands.length}`
      )}) Tj`,
      `ET`
    );
  });

  const pageStreams = pageCommands.map(createContentStream);
  return renderPdfDocument(pageStreams);
}
