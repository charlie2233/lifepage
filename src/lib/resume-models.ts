import { z } from "zod";
import {
  getPortfolioBodyFontFamily,
  getPortfolioDisplayFontFamily,
  PORTFOLIO_BODY_FONT_IDS,
  PORTFOLIO_DISPLAY_FONT_IDS,
  type PortfolioBodyFontId,
  type PortfolioDisplayFontId,
} from "@/lib/portfolio-themes";

type ResumeTone = "executive" | "editorial" | "technical" | "academic" | "creative";
type ResumeHeaderLayout = "split" | "centered" | "stacked";
type ResumeAsideLayout = "right" | "left" | "top" | "hidden";
type ResumeSectionStyle = "dividers" | "cards" | "bands";
type ResumeBulletStyle = "dot" | "dash" | "diamond";

interface ResumeModelPresetDefinition {
  id: ResumeModelPresetId;
  label: string;
  description: string;
  tone: ResumeTone;
  displayFont: PortfolioDisplayFontId;
  bodyFont: PortfolioBodyFontId;
  headerLayout: ResumeHeaderLayout;
  asideLayout: ResumeAsideLayout;
  sectionStyle: ResumeSectionStyle;
  bulletStyle: ResumeBulletStyle;
  accent: string;
  accentSoft: string;
  sheetStart: string;
  sheetEnd: string;
}

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export const RESUME_MODEL_PRESET_IDS = [
  "executive",
  "editorial",
  "compact",
  "technical",
  "academic",
  "boardroom",
  "monograph",
  "dossier",
  "slate",
  "signal",
  "scholar",
  "summit",
  "archive",
  "skyline",
  "elegant",
  "minimal",
  "product",
  "narrative",
  "studio",
  "modernist",
] as const;

export type ResumeModelPresetId = (typeof RESUME_MODEL_PRESET_IDS)[number];
export type ResumeModelId = ResumeModelPresetId | "custom";

export const ResumeModelPresetIdSchema = z.enum(RESUME_MODEL_PRESET_IDS);
export const ResumeModelIdSchema = z.enum([
  ...RESUME_MODEL_PRESET_IDS,
  "custom",
]);

export const ResumeModelConfigSchema = z
  .object({
    baseModelId: ResumeModelPresetIdSchema.optional(),
    displayFont: z.enum(PORTFOLIO_DISPLAY_FONT_IDS).optional(),
    bodyFont: z.enum(PORTFOLIO_BODY_FONT_IDS).optional(),
    headerLayout: z.enum(["split", "centered", "stacked"]).optional(),
    asideLayout: z.enum(["right", "left", "top", "hidden"]).optional(),
    sectionStyle: z.enum(["dividers", "cards", "bands"]).optional(),
    bulletStyle: z.enum(["dot", "dash", "diamond"]).optional(),
    accent: z.string().regex(HEX_COLOR_PATTERN).optional(),
  })
  .strict();

export type ResumeModelConfig = z.infer<typeof ResumeModelConfigSchema>;

export interface ResolvedResumeModel {
  id: ResumeModelId;
  label: string;
  description: string;
  tone: ResumeTone;
  presetId: ResumeModelPresetId;
  displayFont: PortfolioDisplayFontId;
  bodyFont: PortfolioBodyFontId;
  displayFontFamily: string;
  bodyFontFamily: string;
  headerLayout: ResumeHeaderLayout;
  asideLayout: ResumeAsideLayout;
  sectionStyle: ResumeSectionStyle;
  bulletStyle: ResumeBulletStyle;
  accent: string;
  accentSoft: string;
  sheetBackground: string;
  sheetBorder: string;
  sheetText: string;
  sheetMuted: string;
  articleBackground: string;
  articleBorder: string;
}

function createPreset(
  preset: ResumeModelPresetDefinition
): ResumeModelPresetDefinition {
  return preset;
}

export const RESUME_MODEL_PRESETS: ResumeModelPresetDefinition[] = [
  createPreset({
    id: "executive",
    label: "Executive",
    description: "Balanced screening-first resume with split header, right sidebar, and clean dividers.",
    tone: "executive",
    displayFont: "fraunces",
    bodyFont: "manrope",
    headerLayout: "split",
    asideLayout: "right",
    sectionStyle: "dividers",
    bulletStyle: "dot",
    accent: "#7c5b42",
    accentSoft: "#efe2d6",
    sheetStart: "#fffaf3",
    sheetEnd: "#f7efe3",
  }),
  createPreset({
    id: "editorial",
    label: "Editorial",
    description: "Magazine-like resume with centered masthead, bands, and elegant serif hierarchy.",
    tone: "editorial",
    displayFont: "cormorant",
    bodyFont: "sora",
    headerLayout: "centered",
    asideLayout: "top",
    sectionStyle: "bands",
    bulletStyle: "diamond",
    accent: "#8b5b40",
    accentSoft: "#f4e5da",
    sheetStart: "#fffaf4",
    sheetEnd: "#f5ece2",
  }),
  createPreset({
    id: "compact",
    label: "Compact",
    description: "Dense recruiter-oriented model with stacked header and minimal spacing.",
    tone: "executive",
    displayFont: "space",
    bodyFont: "manrope",
    headerLayout: "stacked",
    asideLayout: "hidden",
    sectionStyle: "dividers",
    bulletStyle: "dash",
    accent: "#4f6578",
    accentSoft: "#dee8f0",
    sheetStart: "#fbfbfb",
    sheetEnd: "#f0f3f5",
  }),
  createPreset({
    id: "technical",
    label: "Technical",
    description: "Sharp engineering model with mono cues, left rail details, and card sections.",
    tone: "technical",
    displayFont: "space",
    bodyFont: "space",
    headerLayout: "split",
    asideLayout: "left",
    sectionStyle: "cards",
    bulletStyle: "dash",
    accent: "#2d6cdf",
    accentSoft: "#dbe7ff",
    sheetStart: "#f8fbff",
    sheetEnd: "#edf4ff",
  }),
  createPreset({
    id: "academic",
    label: "Academic",
    description: "Application and admissions model with top summary rail and orderly chronology.",
    tone: "academic",
    displayFont: "fraunces",
    bodyFont: "manrope",
    headerLayout: "stacked",
    asideLayout: "top",
    sectionStyle: "dividers",
    bulletStyle: "dot",
    accent: "#45608a",
    accentSoft: "#dce6f7",
    sheetStart: "#fbfcff",
    sheetEnd: "#eff3fa",
  }),
  createPreset({
    id: "boardroom",
    label: "Boardroom",
    description: "Polished leadership resume with right rail highlights and restrained bands.",
    tone: "executive",
    displayFont: "sora",
    bodyFont: "manrope",
    headerLayout: "split",
    asideLayout: "right",
    sectionStyle: "bands",
    bulletStyle: "dot",
    accent: "#564b63",
    accentSoft: "#ece7f0",
    sheetStart: "#fbfafc",
    sheetEnd: "#f0eef4",
  }),
  createPreset({
    id: "monograph",
    label: "Monograph",
    description: "Long-form narrative resume with centered header and article-like cards.",
    tone: "editorial",
    displayFont: "cormorant",
    bodyFont: "manrope",
    headerLayout: "centered",
    asideLayout: "hidden",
    sectionStyle: "cards",
    bulletStyle: "diamond",
    accent: "#7a5b46",
    accentSoft: "#efe0d5",
    sheetStart: "#fffaf5",
    sheetEnd: "#f5ede7",
  }),
  createPreset({
    id: "dossier",
    label: "Dossier",
    description: "Structured file-style resume with left metadata rail and boxed sections.",
    tone: "technical",
    displayFont: "space",
    bodyFont: "manrope",
    headerLayout: "split",
    asideLayout: "left",
    sectionStyle: "cards",
    bulletStyle: "dash",
    accent: "#5d6c74",
    accentSoft: "#e3eaed",
    sheetStart: "#fbfcfc",
    sheetEnd: "#eef2f3",
  }),
  createPreset({
    id: "slate",
    label: "Slate",
    description: "Minimal modern model with centered title and clean divider rhythm.",
    tone: "technical",
    displayFont: "sora",
    bodyFont: "sora",
    headerLayout: "centered",
    asideLayout: "hidden",
    sectionStyle: "dividers",
    bulletStyle: "dash",
    accent: "#44505f",
    accentSoft: "#e0e6ec",
    sheetStart: "#fcfcfd",
    sheetEnd: "#eff2f5",
  }),
  createPreset({
    id: "signal",
    label: "Signal",
    description: "Bright product resume with split header and strong action rail.",
    tone: "technical",
    displayFont: "space",
    bodyFont: "sora",
    headerLayout: "split",
    asideLayout: "right",
    sectionStyle: "cards",
    bulletStyle: "dot",
    accent: "#0ea5e9",
    accentSoft: "#d8f1ff",
    sheetStart: "#f8fcff",
    sheetEnd: "#ebf7ff",
  }),
  createPreset({
    id: "scholar",
    label: "Scholar",
    description: "Quiet serif application model with top details band and soft dividers.",
    tone: "academic",
    displayFont: "fraunces",
    bodyFont: "manrope",
    headerLayout: "stacked",
    asideLayout: "top",
    sectionStyle: "bands",
    bulletStyle: "dot",
    accent: "#556b78",
    accentSoft: "#dfeaf0",
    sheetStart: "#fbfcfc",
    sheetEnd: "#eef3f4",
  }),
  createPreset({
    id: "summit",
    label: "Summit",
    description: "Achievement-forward model with right highlights rail and mountain-clean section cards.",
    tone: "executive",
    displayFont: "fraunces",
    bodyFont: "sora",
    headerLayout: "split",
    asideLayout: "right",
    sectionStyle: "cards",
    bulletStyle: "diamond",
    accent: "#4c7082",
    accentSoft: "#deedf4",
    sheetStart: "#fbfcfd",
    sheetEnd: "#eef4f7",
  }),
  createPreset({
    id: "archive",
    label: "Archive",
    description: "Documentary record model with left metadata rail and narrative cards.",
    tone: "editorial",
    displayFont: "cormorant",
    bodyFont: "manrope",
    headerLayout: "stacked",
    asideLayout: "left",
    sectionStyle: "cards",
    bulletStyle: "dash",
    accent: "#6f5948",
    accentSoft: "#efe1d2",
    sheetStart: "#fffaf5",
    sheetEnd: "#f3ebe3",
  }),
  createPreset({
    id: "skyline",
    label: "Skyline",
    description: "Modern city resume with centered header and clean bands.",
    tone: "technical",
    displayFont: "sora",
    bodyFont: "manrope",
    headerLayout: "centered",
    asideLayout: "top",
    sectionStyle: "bands",
    bulletStyle: "dot",
    accent: "#566f93",
    accentSoft: "#e0e8f8",
    sheetStart: "#fafcff",
    sheetEnd: "#edf2f9",
  }),
  createPreset({
    id: "elegant",
    label: "Elegant",
    description: "Soft luxury resume with centered title and high-contrast serif rhythm.",
    tone: "editorial",
    displayFont: "cormorant",
    bodyFont: "manrope",
    headerLayout: "centered",
    asideLayout: "right",
    sectionStyle: "bands",
    bulletStyle: "diamond",
    accent: "#8d5f74",
    accentSoft: "#f2e3eb",
    sheetStart: "#fffafe",
    sheetEnd: "#f4ecf2",
  }),
  createPreset({
    id: "minimal",
    label: "Minimal",
    description: "Very stripped-back one-column resume for fast scanning.",
    tone: "executive",
    displayFont: "space",
    bodyFont: "manrope",
    headerLayout: "stacked",
    asideLayout: "hidden",
    sectionStyle: "dividers",
    bulletStyle: "dash",
    accent: "#2e3f50",
    accentSoft: "#dae5ee",
    sheetStart: "#ffffff",
    sheetEnd: "#f3f6f8",
  }),
  createPreset({
    id: "product",
    label: "Product",
    description: "Product-builder resume with left rail, card sections, and clean sans hierarchy.",
    tone: "technical",
    displayFont: "space",
    bodyFont: "sora",
    headerLayout: "split",
    asideLayout: "left",
    sectionStyle: "cards",
    bulletStyle: "dot",
    accent: "#4f6df6",
    accentSoft: "#e0e6ff",
    sheetStart: "#f8f9ff",
    sheetEnd: "#ecefff",
  }),
  createPreset({
    id: "narrative",
    label: "Narrative",
    description: "Story-led resume with centered header, full-width sections, and softer hierarchy.",
    tone: "creative",
    displayFont: "fraunces",
    bodyFont: "manrope",
    headerLayout: "centered",
    asideLayout: "hidden",
    sectionStyle: "bands",
    bulletStyle: "diamond",
    accent: "#a16044",
    accentSoft: "#f6e5d9",
    sheetStart: "#fffaf5",
    sheetEnd: "#f6eee7",
  }),
  createPreset({
    id: "studio",
    label: "Studio",
    description: "Creative studio resume with top details band and boxed showcase sections.",
    tone: "creative",
    displayFont: "cormorant",
    bodyFont: "sora",
    headerLayout: "stacked",
    asideLayout: "top",
    sectionStyle: "cards",
    bulletStyle: "dot",
    accent: "#bf6d4d",
    accentSoft: "#f9e3d7",
    sheetStart: "#fffaf7",
    sheetEnd: "#f5ede8",
  }),
  createPreset({
    id: "modernist",
    label: "Modernist",
    description: "Sharp structured resume with centered masthead, hidden sidebar, and technical typography.",
    tone: "technical",
    displayFont: "sora",
    bodyFont: "space",
    headerLayout: "centered",
    asideLayout: "hidden",
    sectionStyle: "cards",
    bulletStyle: "dash",
    accent: "#3a5162",
    accentSoft: "#dde7ee",
    sheetStart: "#fcfdfe",
    sheetEnd: "#eef3f7",
  }),
];

function getPreset(modelId?: string | null) {
  return (
    RESUME_MODEL_PRESETS.find((preset) => preset.id === modelId) ??
    RESUME_MODEL_PRESETS[0]
  );
}

export function getResumeModelPreset(modelId?: string | null) {
  return getPreset(modelId);
}

export function normalizeResumeModelId(modelId?: string | null): ResumeModelId {
  return ResumeModelIdSchema.safeParse(modelId).success
    ? (modelId as ResumeModelId)
    : "executive";
}

export function parseResumeModelConfig(input: unknown): ResumeModelConfig | null {
  const parsed = ResumeModelConfigSchema.safeParse(input);
  return parsed.success ? parsed.data : null;
}

export function resolveResumeModel(
  modelId?: string | null,
  configInput?: unknown
): ResolvedResumeModel {
  const resolvedModelId = normalizeResumeModelId(modelId);
  const config = parseResumeModelConfig(configInput);
  const preset =
    resolvedModelId === "custom"
      ? getPreset(config?.baseModelId ?? "executive")
      : getPreset(resolvedModelId);

  const displayFont = config?.displayFont ?? preset.displayFont;
  const bodyFont = config?.bodyFont ?? preset.bodyFont;
  const accent = config?.accent ?? preset.accent;

  return {
    id: resolvedModelId,
    label: resolvedModelId === "custom" ? "Custom Resume" : preset.label,
    description:
      resolvedModelId === "custom"
        ? `Custom resume model built on ${preset.label}.`
        : preset.description,
    tone: preset.tone,
    presetId: preset.id,
    displayFont,
    bodyFont,
    displayFontFamily: getPortfolioDisplayFontFamily(displayFont),
    bodyFontFamily: getPortfolioBodyFontFamily(bodyFont),
    headerLayout: config?.headerLayout ?? preset.headerLayout,
    asideLayout: config?.asideLayout ?? preset.asideLayout,
    sectionStyle: config?.sectionStyle ?? preset.sectionStyle,
    bulletStyle: config?.bulletStyle ?? preset.bulletStyle,
    accent,
    accentSoft: preset.accentSoft,
    sheetBackground: `linear-gradient(180deg, ${preset.sheetStart}, ${preset.sheetEnd})`,
    sheetBorder: "#d8ccbe",
    sheetText: "#201912",
    sheetMuted: "#6a5d51",
    articleBackground:
      (config?.sectionStyle ?? preset.sectionStyle) === "cards"
        ? "rgba(255,255,255,0.66)"
        : (config?.sectionStyle ?? preset.sectionStyle) === "bands"
          ? "rgba(255,247,238,0.8)"
          : "transparent",
    articleBorder:
      (config?.sectionStyle ?? preset.sectionStyle) === "dividers"
        ? "#dccfbf"
        : "#e1d5c8",
  };
}

export function describeResumeModelsForAgent() {
  return RESUME_MODEL_PRESETS.map(
    (model) =>
      `${model.id}: ${model.label} — ${model.tone}, ${model.headerLayout} header, ${model.asideLayout} aside, ${model.sectionStyle} sections, ${model.displayFont}/${model.bodyFont}`
  ).join("\n");
}
