import { z } from "zod";

type ThemeVariant = "dark" | "light";
type ThemeDisplay = "serif" | "sans";
type ThemeCategory = "product" | "editorial" | "story";

export const PORTFOLIO_DISPLAY_FONT_IDS = [
  "fraunces",
  "cormorant",
  "space",
  "sora",
] as const;
export const PORTFOLIO_BODY_FONT_IDS = [
  "manrope",
  "space",
  "sora",
] as const;
export const PORTFOLIO_HERO_LAYOUT_IDS = [
  "split",
  "centered",
  "editorial",
] as const;
export const PORTFOLIO_PROJECT_LAYOUT_IDS = [
  "grid",
  "feature",
  "stack",
] as const;
export const PORTFOLIO_TIMELINE_LAYOUT_IDS = [
  "cards",
  "rail",
  "minimal",
] as const;
export const PORTFOLIO_STATS_LAYOUT_IDS = [
  "tiles",
  "band",
  "pills",
] as const;
export const PORTFOLIO_PROOF_LAYOUT_IDS = [
  "grid",
  "spotlight",
  "mosaic",
] as const;

export type PortfolioDisplayFontId = (typeof PORTFOLIO_DISPLAY_FONT_IDS)[number];
export type PortfolioBodyFontId = (typeof PORTFOLIO_BODY_FONT_IDS)[number];
export type PortfolioHeroLayout = (typeof PORTFOLIO_HERO_LAYOUT_IDS)[number];
export type PortfolioProjectLayout = (typeof PORTFOLIO_PROJECT_LAYOUT_IDS)[number];
export type PortfolioTimelineLayout = (typeof PORTFOLIO_TIMELINE_LAYOUT_IDS)[number];
export type PortfolioStatsLayout = (typeof PORTFOLIO_STATS_LAYOUT_IDS)[number];
export type PortfolioProofLayout = (typeof PORTFOLIO_PROOF_LAYOUT_IDS)[number];

interface PortfolioThemePresetDefinition {
  id: PortfolioThemePresetId;
  label: string;
  description: string;
  category: ThemeCategory;
  variant: ThemeVariant;
  display: ThemeDisplay;
  displayFont: PortfolioDisplayFontId;
  bodyFont: PortfolioBodyFontId;
  heroLayout: PortfolioHeroLayout;
  projectLayout: PortfolioProjectLayout;
  timelineLayout: PortfolioTimelineLayout;
  statsLayout: PortfolioStatsLayout;
  proofLayout: PortfolioProofLayout;
  accent: string;
  accentSoft: string;
  accentSecondary: string;
  accentWarm: string;
  pageStart: string;
  pageEnd: string;
  previewBackground: string;
}

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export const PORTFOLIO_THEME_PRESET_IDS = [
  "obsidian",
  "paper",
  "aurora",
  "ember",
  "cobalt",
  "moss",
  "sunrise",
  "velvet",
  "atlas",
  "dune",
  "lunar",
  "orchard",
  "signal",
  "graphite",
  "bloom",
  "summit",
  "tide",
  "vellum",
  "forge",
  "prism",
  "noir",
  "terrace",
  "academy",
  "monograph",
  "venture",
  "harbor",
  "kinetic",
  "solstice",
  "quarry",
  "meadow",
] as const;

export type PortfolioThemePresetId = (typeof PORTFOLIO_THEME_PRESET_IDS)[number];
export type PortfolioThemeId = PortfolioThemePresetId | "custom";

export const PortfolioThemePresetIdSchema = z.enum(PORTFOLIO_THEME_PRESET_IDS);
export const PortfolioThemeIdSchema = z.enum([
  ...PORTFOLIO_THEME_PRESET_IDS,
  "custom",
]);

export const PortfolioThemeConfigSchema = z
  .object({
    baseThemeId: PortfolioThemePresetIdSchema.optional(),
    variant: z.enum(["dark", "light"]).optional(),
    accent: z.string().regex(HEX_COLOR_PATTERN).optional(),
    accentSecondary: z.string().regex(HEX_COLOR_PATTERN).optional(),
    accentWarm: z.string().regex(HEX_COLOR_PATTERN).optional(),
    display: z.enum(["serif", "sans"]).optional(),
    displayFont: z.enum(PORTFOLIO_DISPLAY_FONT_IDS).optional(),
    bodyFont: z.enum(PORTFOLIO_BODY_FONT_IDS).optional(),
    heroLayout: z.enum(PORTFOLIO_HERO_LAYOUT_IDS).optional(),
    projectLayout: z.enum(PORTFOLIO_PROJECT_LAYOUT_IDS).optional(),
    timelineLayout: z.enum(PORTFOLIO_TIMELINE_LAYOUT_IDS).optional(),
    statsLayout: z.enum(PORTFOLIO_STATS_LAYOUT_IDS).optional(),
    proofLayout: z.enum(PORTFOLIO_PROOF_LAYOUT_IDS).optional(),
  })
  .strict();

export type PortfolioThemeConfig = z.infer<typeof PortfolioThemeConfigSchema>;

export interface ResolvedPortfolioTheme {
  id: PortfolioThemeId;
  label: string;
  description: string;
  category: ThemeCategory;
  presetId: PortfolioThemePresetId;
  variant: ThemeVariant;
  display: ThemeDisplay;
  displayFont: PortfolioDisplayFontId;
  bodyFont: PortfolioBodyFontId;
  displayFontFamily: string;
  bodyFontFamily: string;
  heroLayout: PortfolioHeroLayout;
  projectLayout: PortfolioProjectLayout;
  timelineLayout: PortfolioTimelineLayout;
  statsLayout: PortfolioStatsLayout;
  proofLayout: PortfolioProofLayout;
  accent: string;
  accentSoft: string;
  accentSecondary: string;
  accentWarm: string;
  pageBackground: string;
  glowPrimary: string;
  glowSecondary: string;
  text: string;
  muted: string;
  panelBackground: string;
  panelBorder: string;
  panelShadow: string;
  statBackground: string;
  statBorder: string;
  chipBackground: string;
  chipBorder: string;
  chipText: string;
  outlineBackground: string;
  outlineBorder: string;
  outlineText: string;
  sheetBackground: string;
  footerBorder: string;
  navBackground: string;
  navBorder: string;
  previewBackground: string;
  isDark: boolean;
}

function createPreset(
  preset: PortfolioThemePresetDefinition
): PortfolioThemePresetDefinition {
  return preset;
}

export const PORTFOLIO_THEME_PRESETS: PortfolioThemePresetDefinition[] = [
  createPreset({
    id: "obsidian",
    label: "Obsidian",
    description: "Dark glass product profile with split hero, rail timeline, and clean case-study cards.",
    category: "product",
    variant: "dark",
    display: "sans",
    displayFont: "space",
    bodyFont: "sora",
    heroLayout: "split",
    projectLayout: "grid",
    timelineLayout: "rail",
    statsLayout: "tiles",
    proofLayout: "grid",
    accent: "#79e5d2",
    accentSoft: "#cffff6",
    accentSecondary: "#8fa9ff",
    accentWarm: "#f3b276",
    pageStart: "#091015",
    pageEnd: "#111820",
    previewBackground: "linear-gradient(135deg, rgba(121,229,210,0.3), rgba(143,169,255,0.22), rgba(8,16,21,0.92))",
  }),
  createPreset({
    id: "paper",
    label: "Paper",
    description: "Editorial serif portfolio with centered resume cues, feature projects, and spotlight proof.",
    category: "editorial",
    variant: "light",
    display: "serif",
    displayFont: "fraunces",
    bodyFont: "manrope",
    heroLayout: "editorial",
    projectLayout: "feature",
    timelineLayout: "cards",
    statsLayout: "pills",
    proofLayout: "spotlight",
    accent: "#8c5f34",
    accentSoft: "#f7e0c5",
    accentSecondary: "#cda47b",
    accentWarm: "#e9bb8b",
    pageStart: "#f8f1e8",
    pageEnd: "#efe5d6",
    previewBackground: "linear-gradient(135deg, rgba(247,224,197,0.95), rgba(239,229,214,0.96), rgba(255,255,255,0.9))",
  }),
  createPreset({
    id: "aurora",
    label: "Aurora",
    description: "Cinematic story-forward portfolio with centered hero and luminous spotlight sections.",
    category: "story",
    variant: "dark",
    display: "serif",
    displayFont: "cormorant",
    bodyFont: "sora",
    heroLayout: "centered",
    projectLayout: "feature",
    timelineLayout: "cards",
    statsLayout: "band",
    proofLayout: "spotlight",
    accent: "#72f2d0",
    accentSoft: "#d7fff7",
    accentSecondary: "#c68bff",
    accentWarm: "#ff9d7d",
    pageStart: "#0a0f1e",
    pageEnd: "#13162a",
    previewBackground: "linear-gradient(135deg, rgba(114,242,208,0.28), rgba(198,139,255,0.24), rgba(255,157,125,0.16), rgba(10,15,30,0.96))",
  }),
  createPreset({
    id: "ember",
    label: "Ember",
    description: "Warm dark portfolio with stacked project cards and a stripped-back timeline.",
    category: "story",
    variant: "dark",
    display: "sans",
    displayFont: "sora",
    bodyFont: "manrope",
    heroLayout: "split",
    projectLayout: "stack",
    timelineLayout: "minimal",
    statsLayout: "band",
    proofLayout: "grid",
    accent: "#ff9b71",
    accentSoft: "#ffe2d4",
    accentSecondary: "#ffcf94",
    accentWarm: "#ffd8b3",
    pageStart: "#15100f",
    pageEnd: "#201615",
    previewBackground: "linear-gradient(135deg, rgba(255,155,113,0.28), rgba(255,207,148,0.2), rgba(32,22,21,0.95))",
  }),
  createPreset({
    id: "cobalt",
    label: "Cobalt",
    description: "Sharp startup look with high-clarity cards, rail timeline, and product typography.",
    category: "product",
    variant: "dark",
    display: "sans",
    displayFont: "space",
    bodyFont: "sora",
    heroLayout: "split",
    projectLayout: "grid",
    timelineLayout: "rail",
    statsLayout: "band",
    proofLayout: "grid",
    accent: "#7db8ff",
    accentSoft: "#d9ebff",
    accentSecondary: "#a8c7ff",
    accentWarm: "#d5e0ff",
    pageStart: "#08111c",
    pageEnd: "#101a27",
    previewBackground: "linear-gradient(135deg, rgba(125,184,255,0.32), rgba(168,199,255,0.22), rgba(8,17,28,0.96))",
  }),
  createPreset({
    id: "moss",
    label: "Moss",
    description: "Quiet, grounded light theme with editorial hero and mosaic proof gallery.",
    category: "editorial",
    variant: "light",
    display: "serif",
    displayFont: "fraunces",
    bodyFont: "manrope",
    heroLayout: "editorial",
    projectLayout: "stack",
    timelineLayout: "cards",
    statsLayout: "pills",
    proofLayout: "mosaic",
    accent: "#557b54",
    accentSoft: "#dbe8d7",
    accentSecondary: "#92ad86",
    accentWarm: "#cbb687",
    pageStart: "#eef2e8",
    pageEnd: "#e3eadc",
    previewBackground: "linear-gradient(135deg, rgba(219,232,215,0.96), rgba(226,234,220,0.97), rgba(255,255,255,0.9))",
  }),
  createPreset({
    id: "sunrise",
    label: "Sunrise",
    description: "Warm optimistic layout with centered hero, band stats, and standout proof spotlight.",
    category: "story",
    variant: "light",
    display: "serif",
    displayFont: "cormorant",
    bodyFont: "manrope",
    heroLayout: "centered",
    projectLayout: "feature",
    timelineLayout: "cards",
    statsLayout: "band",
    proofLayout: "spotlight",
    accent: "#c26c2f",
    accentSoft: "#ffe6d1",
    accentSecondary: "#f1b562",
    accentWarm: "#ffd7a4",
    pageStart: "#fff4ea",
    pageEnd: "#f7eadc",
    previewBackground: "linear-gradient(135deg, rgba(255,230,209,0.98), rgba(255,215,164,0.96), rgba(255,255,255,0.9))",
  }),
  createPreset({
    id: "velvet",
    label: "Velvet",
    description: "Luxe dark model with dramatic centered hero, spotlight proof, and serif headlines.",
    category: "editorial",
    variant: "dark",
    display: "serif",
    displayFont: "cormorant",
    bodyFont: "manrope",
    heroLayout: "centered",
    projectLayout: "feature",
    timelineLayout: "minimal",
    statsLayout: "pills",
    proofLayout: "spotlight",
    accent: "#e9a6ff",
    accentSoft: "#fde4ff",
    accentSecondary: "#ffb8d9",
    accentWarm: "#ffc08d",
    pageStart: "#140b1c",
    pageEnd: "#23102a",
    previewBackground: "linear-gradient(135deg, rgba(233,166,255,0.3), rgba(255,184,217,0.24), rgba(20,11,28,0.95))",
  }),
  createPreset({
    id: "atlas",
    label: "Atlas",
    description: "Expansive editorial travel-like layout with feature projects and mosaic proof blocks.",
    category: "editorial",
    variant: "light",
    display: "serif",
    displayFont: "fraunces",
    bodyFont: "sora",
    heroLayout: "editorial",
    projectLayout: "feature",
    timelineLayout: "rail",
    statsLayout: "band",
    proofLayout: "mosaic",
    accent: "#2c6f8a",
    accentSoft: "#d5eff8",
    accentSecondary: "#77b6cb",
    accentWarm: "#e4b98f",
    pageStart: "#eef5f8",
    pageEnd: "#e2edf2",
    previewBackground: "linear-gradient(135deg, rgba(213,239,248,0.96), rgba(119,182,203,0.2), rgba(255,255,255,0.9))",
  }),
  createPreset({
    id: "dune",
    label: "Dune",
    description: "Warm neutral application layout with stacked projects and compact minimal timeline.",
    category: "editorial",
    variant: "light",
    display: "serif",
    displayFont: "fraunces",
    bodyFont: "manrope",
    heroLayout: "split",
    projectLayout: "stack",
    timelineLayout: "minimal",
    statsLayout: "pills",
    proofLayout: "grid",
    accent: "#966245",
    accentSoft: "#f2dfcf",
    accentSecondary: "#c99d7d",
    accentWarm: "#e8c89c",
    pageStart: "#f6ede6",
    pageEnd: "#ecdfd2",
    previewBackground: "linear-gradient(135deg, rgba(242,223,207,0.96), rgba(201,157,125,0.22), rgba(255,255,255,0.9))",
  }),
  createPreset({
    id: "lunar",
    label: "Lunar",
    description: "Monochrome futuristic model with centered hero, rail timeline, and pill stats.",
    category: "product",
    variant: "dark",
    display: "sans",
    displayFont: "space",
    bodyFont: "sora",
    heroLayout: "centered",
    projectLayout: "grid",
    timelineLayout: "rail",
    statsLayout: "pills",
    proofLayout: "grid",
    accent: "#c7d4ff",
    accentSoft: "#eef2ff",
    accentSecondary: "#97a4d9",
    accentWarm: "#d7dfff",
    pageStart: "#0b1020",
    pageEnd: "#151b27",
    previewBackground: "linear-gradient(135deg, rgba(199,212,255,0.28), rgba(151,164,217,0.18), rgba(11,16,32,0.95))",
  }),
  createPreset({
    id: "orchard",
    label: "Orchard",
    description: "Organic light model with editorial hero, soft cards, and mosaic proof layout.",
    category: "story",
    variant: "light",
    display: "serif",
    displayFont: "cormorant",
    bodyFont: "manrope",
    heroLayout: "editorial",
    projectLayout: "stack",
    timelineLayout: "cards",
    statsLayout: "tiles",
    proofLayout: "mosaic",
    accent: "#5b7f3d",
    accentSoft: "#e2f0d4",
    accentSecondary: "#95b26d",
    accentWarm: "#d3b98c",
    pageStart: "#f2f7eb",
    pageEnd: "#e7efde",
    previewBackground: "linear-gradient(135deg, rgba(226,240,212,0.96), rgba(149,178,109,0.2), rgba(255,255,255,0.92))",
  }),
  createPreset({
    id: "signal",
    label: "Signal",
    description: "Bright product portfolio with sharp sans display, grid projects, and energetic timelines.",
    category: "product",
    variant: "dark",
    display: "sans",
    displayFont: "space",
    bodyFont: "sora",
    heroLayout: "split",
    projectLayout: "grid",
    timelineLayout: "cards",
    statsLayout: "band",
    proofLayout: "grid",
    accent: "#5cf1ff",
    accentSoft: "#d8fbff",
    accentSecondary: "#53ffc7",
    accentWarm: "#ffd166",
    pageStart: "#04131a",
    pageEnd: "#0d1c24",
    previewBackground: "linear-gradient(135deg, rgba(92,241,255,0.34), rgba(83,255,199,0.22), rgba(4,19,26,0.96))",
  }),
  createPreset({
    id: "graphite",
    label: "Graphite",
    description: "Industrial minimal dark model with stacked projects and restrained motionless structure.",
    category: "product",
    variant: "dark",
    display: "sans",
    displayFont: "sora",
    bodyFont: "manrope",
    heroLayout: "split",
    projectLayout: "stack",
    timelineLayout: "minimal",
    statsLayout: "tiles",
    proofLayout: "grid",
    accent: "#b8c1c9",
    accentSoft: "#eef1f4",
    accentSecondary: "#8f9aa4",
    accentWarm: "#d8c6ae",
    pageStart: "#111416",
    pageEnd: "#1b1f23",
    previewBackground: "linear-gradient(135deg, rgba(184,193,201,0.24), rgba(143,154,164,0.18), rgba(17,20,22,0.97))",
  }),
  createPreset({
    id: "bloom",
    label: "Bloom",
    description: "Soft expressive model with centered hero, feature projects, and gentle highlight rhythm.",
    category: "story",
    variant: "light",
    display: "serif",
    displayFont: "cormorant",
    bodyFont: "sora",
    heroLayout: "centered",
    projectLayout: "feature",
    timelineLayout: "cards",
    statsLayout: "pills",
    proofLayout: "spotlight",
    accent: "#b85e8a",
    accentSoft: "#f8dce8",
    accentSecondary: "#e59fbb",
    accentWarm: "#efc18d",
    pageStart: "#fff1f7",
    pageEnd: "#f8e6ee",
    previewBackground: "linear-gradient(135deg, rgba(248,220,232,0.97), rgba(229,159,187,0.22), rgba(255,255,255,0.9))",
  }),
  createPreset({
    id: "summit",
    label: "Summit",
    description: "Alpine portfolio with split hero, rail timeline, and large featured case studies.",
    category: "story",
    variant: "light",
    display: "serif",
    displayFont: "fraunces",
    bodyFont: "sora",
    heroLayout: "split",
    projectLayout: "grid",
    timelineLayout: "rail",
    statsLayout: "tiles",
    proofLayout: "spotlight",
    accent: "#416b83",
    accentSoft: "#dcebf3",
    accentSecondary: "#6c9bb2",
    accentWarm: "#d4b17a",
    pageStart: "#edf4f7",
    pageEnd: "#e2ebef",
    previewBackground: "linear-gradient(135deg, rgba(220,235,243,0.97), rgba(108,155,178,0.2), rgba(255,255,255,0.92))",
  }),
  createPreset({
    id: "tide",
    label: "Tide",
    description: "Oceanic dark story model with feature projects and a long-form rail timeline.",
    category: "story",
    variant: "dark",
    display: "sans",
    displayFont: "space",
    bodyFont: "manrope",
    heroLayout: "split",
    projectLayout: "feature",
    timelineLayout: "rail",
    statsLayout: "band",
    proofLayout: "spotlight",
    accent: "#57d6d1",
    accentSoft: "#d5fffd",
    accentSecondary: "#66a8ff",
    accentWarm: "#ffd09c",
    pageStart: "#07161a",
    pageEnd: "#0d2328",
    previewBackground: "linear-gradient(135deg, rgba(87,214,209,0.28), rgba(102,168,255,0.2), rgba(7,22,26,0.96))",
  }),
  createPreset({
    id: "vellum",
    label: "Vellum",
    description: "Academic resume-friendly model with editorial hero and minimal project rhythm.",
    category: "editorial",
    variant: "light",
    display: "serif",
    displayFont: "cormorant",
    bodyFont: "manrope",
    heroLayout: "editorial",
    projectLayout: "stack",
    timelineLayout: "minimal",
    statsLayout: "pills",
    proofLayout: "grid",
    accent: "#7e5c46",
    accentSoft: "#efe1d4",
    accentSecondary: "#b99780",
    accentWarm: "#e4c59f",
    pageStart: "#f8f1eb",
    pageEnd: "#efe4da",
    previewBackground: "linear-gradient(135deg, rgba(239,225,212,0.97), rgba(185,151,128,0.2), rgba(255,255,255,0.9))",
  }),
  createPreset({
    id: "forge",
    label: "Forge",
    description: "Industrial builder model with stacked project cards and strong technical contrast.",
    category: "product",
    variant: "dark",
    display: "sans",
    displayFont: "sora",
    bodyFont: "space",
    heroLayout: "split",
    projectLayout: "stack",
    timelineLayout: "rail",
    statsLayout: "tiles",
    proofLayout: "grid",
    accent: "#ff875d",
    accentSoft: "#ffd8ca",
    accentSecondary: "#ffb36d",
    accentWarm: "#ffd6a5",
    pageStart: "#160f0c",
    pageEnd: "#251711",
    previewBackground: "linear-gradient(135deg, rgba(255,135,93,0.3), rgba(255,179,109,0.22), rgba(22,15,12,0.96))",
  }),
  createPreset({
    id: "prism",
    label: "Prism",
    description: "Color-forward light model with centered hero, card timeline, and mosaic proof wall.",
    category: "story",
    variant: "light",
    display: "sans",
    displayFont: "sora",
    bodyFont: "manrope",
    heroLayout: "centered",
    projectLayout: "grid",
    timelineLayout: "cards",
    statsLayout: "band",
    proofLayout: "mosaic",
    accent: "#6b5cff",
    accentSoft: "#e4e1ff",
    accentSecondary: "#ff7ac9",
    accentWarm: "#ffba6f",
    pageStart: "#f6f3ff",
    pageEnd: "#ebe8ff",
    previewBackground: "linear-gradient(135deg, rgba(228,225,255,0.96), rgba(255,122,201,0.16), rgba(255,255,255,0.9))",
  }),
  createPreset({
    id: "noir",
    label: "Noir",
    description: "Magazine-like dark editorial model with dramatic serif display and spotlight proof.",
    category: "editorial",
    variant: "dark",
    display: "serif",
    displayFont: "cormorant",
    bodyFont: "manrope",
    heroLayout: "editorial",
    projectLayout: "feature",
    timelineLayout: "minimal",
    statsLayout: "pills",
    proofLayout: "spotlight",
    accent: "#f1e7da",
    accentSoft: "#fff7ef",
    accentSecondary: "#d9c7ae",
    accentWarm: "#d0a16f",
    pageStart: "#0e0d11",
    pageEnd: "#18151a",
    previewBackground: "linear-gradient(135deg, rgba(241,231,218,0.16), rgba(208,161,111,0.18), rgba(14,13,17,0.97))",
  }),
  createPreset({
    id: "terrace",
    label: "Terrace",
    description: "Sunny social portfolio with centered intro, stacked projects, and mosaic proof tiles.",
    category: "story",
    variant: "light",
    display: "serif",
    displayFont: "fraunces",
    bodyFont: "manrope",
    heroLayout: "centered",
    projectLayout: "stack",
    timelineLayout: "cards",
    statsLayout: "tiles",
    proofLayout: "mosaic",
    accent: "#c56f3c",
    accentSoft: "#ffe5d2",
    accentSecondary: "#f2a96e",
    accentWarm: "#ffd79f",
    pageStart: "#fff3ea",
    pageEnd: "#f7e7db",
    previewBackground: "linear-gradient(135deg, rgba(255,229,210,0.98), rgba(242,169,110,0.24), rgba(255,255,255,0.9))",
  }),
  createPreset({
    id: "academy",
    label: "Academy",
    description: "Application-focused editorial model optimized for achievements, experience, and chronology.",
    category: "editorial",
    variant: "light",
    display: "serif",
    displayFont: "fraunces",
    bodyFont: "manrope",
    heroLayout: "editorial",
    projectLayout: "stack",
    timelineLayout: "rail",
    statsLayout: "band",
    proofLayout: "grid",
    accent: "#3f5d8c",
    accentSoft: "#dde7f9",
    accentSecondary: "#8aa7da",
    accentWarm: "#d5ba8a",
    pageStart: "#f3f6fb",
    pageEnd: "#e9eef7",
    previewBackground: "linear-gradient(135deg, rgba(221,231,249,0.97), rgba(138,167,218,0.22), rgba(255,255,255,0.9))",
  }),
  createPreset({
    id: "monograph",
    label: "Monograph",
    description: "Magazine monograph layout with feature projects, restrained timeline, and polished spotlight proof.",
    category: "editorial",
    variant: "light",
    display: "serif",
    displayFont: "cormorant",
    bodyFont: "sora",
    heroLayout: "editorial",
    projectLayout: "feature",
    timelineLayout: "minimal",
    statsLayout: "band",
    proofLayout: "spotlight",
    accent: "#73553f",
    accentSoft: "#f1e1d5",
    accentSecondary: "#b38b6c",
    accentWarm: "#e2b687",
    pageStart: "#fbf4ee",
    pageEnd: "#f1e7de",
    previewBackground: "linear-gradient(135deg, rgba(241,225,213,0.97), rgba(179,139,108,0.2), rgba(255,255,255,0.92))",
  }),
  createPreset({
    id: "venture",
    label: "Venture",
    description: "Startup operator model with sharp split hero, grid projects, and efficient product typography.",
    category: "product",
    variant: "light",
    display: "sans",
    displayFont: "space",
    bodyFont: "sora",
    heroLayout: "split",
    projectLayout: "grid",
    timelineLayout: "cards",
    statsLayout: "band",
    proofLayout: "grid",
    accent: "#356ae6",
    accentSoft: "#dce7ff",
    accentSecondary: "#65b8ff",
    accentWarm: "#ffbf7b",
    pageStart: "#f3f7ff",
    pageEnd: "#e9f0ff",
    previewBackground: "linear-gradient(135deg, rgba(220,231,255,0.97), rgba(101,184,255,0.18), rgba(255,255,255,0.9))",
  }),
  createPreset({
    id: "harbor",
    label: "Harbor",
    description: "Calm dark editorial model with feature projects and soft, spacious rhythm.",
    category: "editorial",
    variant: "dark",
    display: "serif",
    displayFont: "fraunces",
    bodyFont: "manrope",
    heroLayout: "split",
    projectLayout: "feature",
    timelineLayout: "rail",
    statsLayout: "pills",
    proofLayout: "spotlight",
    accent: "#74c7c5",
    accentSoft: "#d6fbfa",
    accentSecondary: "#8cb8de",
    accentWarm: "#edc28d",
    pageStart: "#081317",
    pageEnd: "#102127",
    previewBackground: "linear-gradient(135deg, rgba(116,199,197,0.26), rgba(140,184,222,0.22), rgba(8,19,23,0.96))",
  }),
  createPreset({
    id: "kinetic",
    label: "Kinetic",
    description: "High-energy builder model with centered hero, mosaic proof, and bold sans display.",
    category: "product",
    variant: "dark",
    display: "sans",
    displayFont: "sora",
    bodyFont: "space",
    heroLayout: "centered",
    projectLayout: "grid",
    timelineLayout: "cards",
    statsLayout: "tiles",
    proofLayout: "mosaic",
    accent: "#a4ff6d",
    accentSoft: "#efffd6",
    accentSecondary: "#46e7ff",
    accentWarm: "#ffd36d",
    pageStart: "#0b1510",
    pageEnd: "#132018",
    previewBackground: "linear-gradient(135deg, rgba(164,255,109,0.24), rgba(70,231,255,0.18), rgba(11,21,16,0.96))",
  }),
  createPreset({
    id: "solstice",
    label: "Solstice",
    description: "Glowing dark story model with centered hero, feature projects, and minimal timeline pacing.",
    category: "story",
    variant: "dark",
    display: "serif",
    displayFont: "cormorant",
    bodyFont: "manrope",
    heroLayout: "centered",
    projectLayout: "feature",
    timelineLayout: "minimal",
    statsLayout: "band",
    proofLayout: "spotlight",
    accent: "#ffb067",
    accentSoft: "#ffe6cb",
    accentSecondary: "#ff7e67",
    accentWarm: "#ffd8a6",
    pageStart: "#16100e",
    pageEnd: "#241816",
    previewBackground: "linear-gradient(135deg, rgba(255,176,103,0.28), rgba(255,126,103,0.2), rgba(22,16,14,0.96))",
  }),
  createPreset({
    id: "quarry",
    label: "Quarry",
    description: "Stone-toned application model with rail timeline, stacked projects, and restrained palette.",
    category: "product",
    variant: "light",
    display: "sans",
    displayFont: "space",
    bodyFont: "manrope",
    heroLayout: "split",
    projectLayout: "stack",
    timelineLayout: "rail",
    statsLayout: "tiles",
    proofLayout: "grid",
    accent: "#5f6874",
    accentSoft: "#e4e8ed",
    accentSecondary: "#97a1ae",
    accentWarm: "#cfb495",
    pageStart: "#f2f4f6",
    pageEnd: "#e6eaee",
    previewBackground: "linear-gradient(135deg, rgba(228,232,237,0.97), rgba(151,161,174,0.2), rgba(255,255,255,0.92))",
  }),
  createPreset({
    id: "meadow",
    label: "Meadow",
    description: "Fresh optimistic light model with centered hero, cards timeline, and mosaic proof energy.",
    category: "story",
    variant: "light",
    display: "serif",
    displayFont: "fraunces",
    bodyFont: "manrope",
    heroLayout: "centered",
    projectLayout: "stack",
    timelineLayout: "cards",
    statsLayout: "pills",
    proofLayout: "mosaic",
    accent: "#4f8f5f",
    accentSoft: "#ddf5e1",
    accentSecondary: "#8ac29a",
    accentWarm: "#e1c182",
    pageStart: "#f1f8f1",
    pageEnd: "#e7f1e7",
    previewBackground: "linear-gradient(135deg, rgba(221,245,225,0.97), rgba(138,194,154,0.2), rgba(255,255,255,0.9))",
  }),
];

function getDisplayToneFromFontId(fontId: PortfolioDisplayFontId): ThemeDisplay {
  return fontId === "fraunces" || fontId === "cormorant" ? "serif" : "sans";
}

function getPreset(themeId?: string | null) {
  return (
    PORTFOLIO_THEME_PRESETS.find((preset) => preset.id === themeId) ??
    PORTFOLIO_THEME_PRESETS[0]
  );
}

export function getPortfolioThemePreset(themeId?: string | null) {
  return getPreset(themeId);
}

export function getPortfolioDisplayFontFamily(fontId: PortfolioDisplayFontId) {
  switch (fontId) {
    case "fraunces":
      return "var(--font-display), serif";
    case "cormorant":
      return "var(--font-display-alt), serif";
    case "space":
      return "var(--font-sans-alt), sans-serif";
    case "sora":
      return "var(--font-sans-sharp), sans-serif";
  }
}

export function getPortfolioBodyFontFamily(fontId: PortfolioBodyFontId) {
  switch (fontId) {
    case "manrope":
      return "var(--font-sans), sans-serif";
    case "space":
      return "var(--font-sans-alt), sans-serif";
    case "sora":
      return "var(--font-sans-sharp), sans-serif";
  }
}

export function normalizePortfolioThemeId(themeId?: string | null): PortfolioThemeId {
  return PortfolioThemeIdSchema.safeParse(themeId).success
    ? (themeId as PortfolioThemeId)
    : "obsidian";
}

export function parsePortfolioThemeConfig(
  input: unknown
): PortfolioThemeConfig | null {
  const parsed = PortfolioThemeConfigSchema.safeParse(input);
  return parsed.success ? parsed.data : null;
}

export function resolvePortfolioTheme(
  themeId?: string | null,
  configInput?: unknown
): ResolvedPortfolioTheme {
  const resolvedThemeId = normalizePortfolioThemeId(themeId);
  const config = parsePortfolioThemeConfig(configInput);
  const preset =
    resolvedThemeId === "custom"
      ? getPreset(config?.baseThemeId ?? "obsidian")
      : getPreset(resolvedThemeId);

  const displayFont =
    config?.displayFont ??
    (config?.display
      ? config.display === "serif"
        ? "fraunces"
        : "space"
      : preset.displayFont);
  const bodyFont = config?.bodyFont ?? preset.bodyFont;
  const display = config?.display ?? getDisplayToneFromFontId(displayFont);
  const variant = config?.variant ?? preset.variant;
  const accent = config?.accent ?? preset.accent;
  const accentSecondary = config?.accentSecondary ?? preset.accentSecondary;
  const accentWarm = config?.accentWarm ?? preset.accentWarm;
  const isDark = variant === "dark";

  const text = isDark ? "#f7f1e8" : "#221b16";
  const muted = isDark ? "#98a5ae" : "#6a5d51";
  const pageBackground = `linear-gradient(180deg, ${preset.pageStart} 0%, ${preset.pageEnd} 100%)`;

  return {
    id: resolvedThemeId,
    label: resolvedThemeId === "custom" ? "Custom" : preset.label,
    description:
      resolvedThemeId === "custom"
        ? `Custom model built on ${preset.label}.`
        : preset.description,
    category: preset.category,
    presetId: preset.id,
    variant,
    display,
    displayFont,
    bodyFont,
    displayFontFamily: getPortfolioDisplayFontFamily(displayFont),
    bodyFontFamily: getPortfolioBodyFontFamily(bodyFont),
    heroLayout: config?.heroLayout ?? preset.heroLayout,
    projectLayout: config?.projectLayout ?? preset.projectLayout,
    timelineLayout: config?.timelineLayout ?? preset.timelineLayout,
    statsLayout: config?.statsLayout ?? preset.statsLayout,
    proofLayout: config?.proofLayout ?? preset.proofLayout,
    accent,
    accentSoft: preset.accentSoft,
    accentSecondary,
    accentWarm,
    pageBackground,
    glowPrimary: accent,
    glowSecondary: accentSecondary,
    text,
    muted,
    panelBackground: isDark
      ? "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.018)), rgba(14,22,28,0.76)"
      : "rgba(255,252,247,0.9)",
    panelBorder: isDark ? "rgba(255,255,255,0.1)" : "#d8ccbe",
    panelShadow: isDark
      ? "0 24px 70px rgba(0,0,0,0.3)"
      : "0 24px 70px rgba(71,56,37,0.1)",
    statBackground: isDark
      ? "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015)), rgba(9,15,19,0.72)"
      : "rgba(255,255,255,0.7)",
    statBorder: isDark ? "rgba(255,255,255,0.08)" : "#ddd1c3",
    chipBackground: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.78)",
    chipBorder: isDark ? "rgba(255,255,255,0.1)" : "#ddd1c3",
    chipText: isDark ? "#d2dae0" : "#51463d",
    outlineBackground: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.78)",
    outlineBorder: isDark ? "rgba(255,255,255,0.1)" : "#ddd1c3",
    outlineText: isDark ? "#d2dae0" : "#4e4339",
    sheetBackground: "linear-gradient(180deg, rgba(255,250,243,0.98), rgba(247,239,227,0.98))",
    footerBorder: isDark ? "rgba(255,255,255,0.08)" : "#d8ccbe",
    navBackground: isDark ? "rgba(9,16,21,0.7)" : "rgba(246,239,231,0.88)",
    navBorder: isDark ? "rgba(255,255,255,0.08)" : "#d8ccbe",
    previewBackground: preset.previewBackground,
    isDark,
  };
}

export function describePortfolioThemesForAgent() {
  return PORTFOLIO_THEME_PRESETS.map(
    (theme) =>
      `${theme.id}: ${theme.label} — ${theme.category}, ${theme.heroLayout} hero, ${theme.projectLayout} projects, ${theme.timelineLayout} timeline, ${theme.displayFont}/${theme.bodyFont}`
  ).join("\n");
}
