/**
 * AI Agent Tool Registry
 * Each tool is a callable function the agent can invoke via the /api/agent endpoint.
 * Tools produce structured JSON outputs stored as AgentArtifacts.
 */

import OpenAI from "openai";
import { z } from "zod";
import {
  describePortfolioThemesForAgent,
  getPortfolioThemePreset,
  normalizePortfolioThemeId,
  PortfolioThemeConfigSchema,
} from "@/lib/portfolio-themes";
import {
  describeResumeModelsForAgent,
  getResumeModelPreset,
  normalizeResumeModelId,
  ResumeModelConfigSchema,
} from "@/lib/resume-models";

function getOpenAI(clientConfig?: { apiKey: string; baseURL?: string }) {
  return new OpenAI({
    apiKey: clientConfig?.apiKey ?? process.env.OPENAI_API_KEY,
    baseURL: clientConfig?.baseURL,
  });
}

// ─── Shared types ──────────────────────────────────────────────────────────────

export type ToolName =
  | "generate_timeline"
  | "generate_video_script"
  | "generate_tree"
  | "set_portfolio_theme"
  | "set_resume_model"
  | "regenerate_profile"
  | "recrawl_url"
  | "chat";

export interface ToolResult {
  tool: ToolName;
  style?: string;
  output: unknown;
}

interface AgentPromptOptions {
  focusLabel?: string | null;
  focusContext?: string | null;
  userRequest?: string | null;
}

function buildFocusPrompt(options?: AgentPromptOptions) {
  if (!options?.focusLabel || !options.focusContext) {
    return "";
  }

  return `Primary focus area:
${options.focusLabel}
${options.focusContext}

Treat this focus area as the main place to work. Keep suggestions and generated output anchored to it while still respecting the overall brand story.
`;
}

// ─── Timeline tool ─────────────────────────────────────────────────────────────

export const TIMELINE_STYLES = ["vertical", "horizontal", "documentary", "minimal"] as const;
export type TimelineStyle = (typeof TIMELINE_STYLES)[number];

const TimelineEventSchema = z.object({
  year: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.enum(["education", "work", "project", "achievement", "personal"]),
  icon: z.string().optional(),
  highlight: z.boolean().default(false),
});

const TimelineOutputSchema = z.object({
  title: z.string(),
  subtitle: z.string().nullable(),
  events: z.array(TimelineEventSchema),
  style: z.string(),
});

export type TimelineOutput = z.infer<typeof TimelineOutputSchema>;

export async function generateTimeline(
  context: string,
  model: string,
  style: TimelineStyle = "vertical",
  options?: AgentPromptOptions,
  clientConfig?: { apiKey: string; baseURL?: string },
  maxTokens?: number
): Promise<TimelineOutput> {
  const styleDescriptions: Record<TimelineStyle, string> = {
    vertical: "A clean vertical chronological timeline with year markers and category icons.",
    horizontal: "A horizontal scrollable timeline showing the journey from left to right.",
    documentary: "A narrative-style timeline that reads like a personal documentary, with rich descriptions and story arcs.",
    minimal: "A minimal stripped-down timeline with just year, title, and one-line descriptions.",
  };

  const prompt = `You are a senior personal brand strategist and documentary storyteller. Create a rich timeline from this person's story and evidence.

Context about the person:
${context}

${buildFocusPrompt(options)}
${options?.userRequest ? `User request:\n${options.userRequest}\n` : ""}

Timeline style: ${style} — ${styleDescriptions[style]}

Return a JSON object with this structure:
{
  "title": "My Journey" (creative title),
  "subtitle": "optional subtitle or tagline",
  "events": [
    {
      "year": "2021",
      "title": "Short event title",
      "description": "1-3 sentence description",
      "category": "education|work|project|achievement|personal",
      "icon": "one emoji representing this event",
      "highlight": true/false (mark 2-3 most important events as true)
    }
  ],
  "style": "${style}"
}

Rules:
- Generate 5-12 meaningful events from the evidence
- Order chronologically (oldest first)
- Use vivid, active language
- Stay grounded in the provided evidence and profile details
- For documentary style: make descriptions feel like narration ("It was 2021 when...")
- Mark truly pivotal moments as highlight: true
- If a primary focus area is provided, make sure at least half of the timeline is directly relevant to it`;

  const completion = await getOpenAI(clientConfig).chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.5,
    ...(maxTokens ? { max_tokens: maxTokens } : {}),
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as unknown;
  return TimelineOutputSchema.parse(parsed);
}

// ─── Video script / presentation tool ─────────────────────────────────────────

export const VIDEO_STYLES = ["documentary", "pitch", "cinematic", "tutorial", "story"] as const;
export type VideoStyle = (typeof VIDEO_STYLES)[number];

const VideoSceneSchema = z.object({
  sceneNumber: z.number(),
  duration: z.string(), // e.g. "0:05-0:15"
  visualDirection: z.string(), // what to show on screen
  narration: z.string(), // what is said
  bRoll: z.string().optional(), // suggested B-roll footage
  textOverlay: z.string().optional(), // text shown on screen
  musicMood: z.string().optional(), // e.g. "uplifting", "dramatic"
});

const VideoScriptOutputSchema = z.object({
  title: z.string(),
  style: z.string(),
  totalDuration: z.string(),
  hook: z.string(), // first 5-10 second hook
  scenes: z.array(VideoSceneSchema),
  callToAction: z.string(),
  productionNotes: z.string().optional(),
});

export type VideoScriptOutput = z.infer<typeof VideoScriptOutputSchema>;

export async function generateVideoScript(
  context: string,
  model: string,
  style: VideoStyle = "documentary",
  options?: AgentPromptOptions,
  clientConfig?: { apiKey: string; baseURL?: string },
  maxTokens?: number
): Promise<VideoScriptOutput> {
  const styleDescriptions: Record<VideoStyle, string> = {
    documentary: "First-person narrated documentary style — honest, reflective, professional. Like a TED Talk intro.",
    pitch: "60-second investor/employer pitch — confident, punchy, results-focused. Think Y Combinator pitch.",
    cinematic: "Cinematic portfolio reel — visual storytelling, minimal words, powerful imagery directions.",
    tutorial: "Educational walkthrough — shows how this person solves problems. Screen-recording + narration style.",
    story: "Personal brand story — origin story, struggles, breakthroughs. Authentic and emotional.",
  };

  const prompt = `You are a professional creative director and personal brand copywriter. Create a video script for this person's portfolio and brand.

Context about the person:
${context}

${buildFocusPrompt(options)}
${options?.userRequest ? `User request:\n${options.userRequest}\n` : ""}

Video style: ${style} — ${styleDescriptions[style]}

Return a JSON object:
{
  "title": "video title",
  "style": "${style}",
  "totalDuration": "e.g. 1:30",
  "hook": "The opening 5-10 second hook that grabs attention",
  "scenes": [
    {
      "sceneNumber": 1,
      "duration": "0:00-0:10",
      "visualDirection": "What appears on screen (e.g. 'Close-up of hands typing code')",
      "narration": "Exact words spoken or text shown",
      "bRoll": "Suggested B-roll (optional)",
      "textOverlay": "Any text on screen (optional)",
      "musicMood": "e.g. 'uplifting electronic' (optional)"
    }
  ],
  "callToAction": "What viewers should do at the end",
  "productionNotes": "Overall production tips for this style"
}

Rules:
- Generate 4-8 scenes appropriate to the total duration
- Make narration natural and authentic — no corporate speak
- Be specific about visual directions
- Anchor the script in real evidence and concrete outcomes
- ${style === "cinematic" ? "Minimize words, maximize visual impact" : ""}
- ${style === "pitch" ? "Every second counts — be ruthlessly concise" : ""}
- If a primary focus area is provided, make it the center of the narrative`;

  const completion = await getOpenAI(clientConfig).chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.6,
    ...(maxTokens ? { max_tokens: maxTokens } : {}),
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as unknown;
  return VideoScriptOutputSchema.parse(parsed);
}

// ─── Tree / mind-map tool ──────────────────────────────────────────────────────

export const TREE_STYLES = ["skills", "projects", "career", "goals"] as const;
export type TreeStyle = (typeof TREE_STYLES)[number];

const TreeNodeSchema: z.ZodType<TreeNode> = z.lazy(() =>
  z.object({
    id: z.string(),
    label: z.string(),
    description: z.string().optional(),
    icon: z.string().optional(),
    level: z.number(),
    color: z.string().optional(), // hex color
    children: z.array(TreeNodeSchema).default([]),
  })
);

interface TreeNode {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  level: number;
  color?: string;
  children: TreeNode[];
}

const TreeOutputSchema = z.object({
  title: z.string(),
  style: z.string(),
  root: TreeNodeSchema,
});

export type TreeOutput = z.infer<typeof TreeOutputSchema>;

export async function generateTree(
  context: string,
  model: string,
  style: TreeStyle = "skills",
  options?: AgentPromptOptions,
  clientConfig?: { apiKey: string; baseURL?: string },
  maxTokens?: number
): Promise<TreeOutput> {
  const styleDescriptions: Record<TreeStyle, string> = {
    skills: "A skills tree showing expertise areas with sub-skills branching out. Like a tech tree in a game.",
    projects: "A project dependency tree showing how projects relate to each other and build on each other.",
    career: "A career tree showing the growth path — roles, companies, and milestones branching out.",
    goals: "A goals tree showing where this person is heading — aspirations broken down into milestones.",
  };

  const prompt = `You are a visual information designer and brand strategist. Create a hierarchical tree or mind-map for this person.

Context about the person:
${context}

${buildFocusPrompt(options)}
${options?.userRequest ? `User request:\n${options.userRequest}\n` : ""}

Tree type: ${style} — ${styleDescriptions[style]}

Return a JSON object:
{
  "title": "tree title",
  "style": "${style}",
  "root": {
    "id": "root",
    "label": "Root node label",
    "description": "optional description",
    "icon": "one emoji",
    "level": 0,
    "color": "#hexcolor",
    "children": [
      {
        "id": "unique-id",
        "label": "Child label",
        "description": "optional",
        "icon": "emoji",
        "level": 1,
        "color": "#hexcolor",
        "children": []
      }
    ]
  }
}

Rules:
- Create 2-3 levels deep (root → categories → leaves)
- Each category should have 2-5 children
- Use emoji icons to make it visual
- Use different hex colors for different branches (muted, tasteful)
- Keep labels short (1-4 words)
- Base everything on actual evidence from the context
- If a primary focus area is provided, make it a dominant branch or the root framing`;

  const completion = await getOpenAI(clientConfig).chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.4,
    ...(maxTokens ? { max_tokens: maxTokens } : {}),
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as unknown;
  return TreeOutputSchema.parse(parsed);
}

// ─── Portfolio theme tool ────────────────────────────────────────────────────

const PortfolioThemeOutputSchema = z.object({
  themeId: z.string(),
  themeConfig: PortfolioThemeConfigSchema.nullable().optional(),
  themeLabel: z.string(),
  summary: z.string(),
  rationale: z.string(),
  changes: z.array(z.string()).default([]),
});

export type PortfolioThemeOutput = z.infer<typeof PortfolioThemeOutputSchema>;

export async function setPortfolioTheme(
  context: string,
  model: string,
  style: string = "custom",
  options?: AgentPromptOptions,
  clientConfig?: { apiKey: string; baseURL?: string },
  maxTokens?: number
): Promise<PortfolioThemeOutput> {
  const normalizedStyle = style === "custom" ? "custom" : normalizePortfolioThemeId(style);

  if (normalizedStyle !== "custom") {
    const preset = getPortfolioThemePreset(normalizedStyle);
    return PortfolioThemeOutputSchema.parse({
      themeId: normalizedStyle,
      themeConfig: null,
      themeLabel: preset.label,
      summary: `Applied the ${preset.label} portfolio model to the public portfolio.`,
      rationale:
        options?.userRequest ??
        `Switch the portfolio to the ${preset.label} model.`,
      changes: [
        `Updated the hero to the ${preset.heroLayout} layout.`,
        `Switched projects to the ${preset.projectLayout} card system and timeline to ${preset.timelineLayout}.`,
        `Applied the ${preset.displayFont}/${preset.bodyFont} font pairing and ${preset.proofLayout} proof layout.`,
        "Reset any previous custom theme overrides.",
      ],
    });
  }

  const prompt = `You are a premium portfolio art director. Create a safe structured theme variant for a personal portfolio.

Context about the person:
${context}

${buildFocusPrompt(options)}
${options?.userRequest ? `User request:\n${options.userRequest}\n` : ""}

Available preset themes:
${describePortfolioThemesForAgent()}

Return a JSON object only:
{
  "themeId": "custom",
  "themeConfig": {
    "baseThemeId": "one available preset id",
    "variant": "dark or light",
    "accent": "#RRGGBB",
    "accentSecondary": "#RRGGBB",
    "accentWarm": "#RRGGBB",
    "display": "serif or sans",
    "displayFont": "fraunces|cormorant|space|sora",
    "bodyFont": "manrope|space|sora",
    "heroLayout": "split|centered|editorial",
    "projectLayout": "grid|feature|stack",
    "timelineLayout": "cards|rail|minimal",
    "statsLayout": "tiles|band|pills",
    "proofLayout": "grid|spotlight|mosaic"
  },
  "themeLabel": "Short title for the variant",
  "summary": "One sentence on the resulting look",
  "rationale": "Why this visual direction fits the person's brand and work",
  "changes": ["3-5 short concrete visual changes"]
}

Rules:
- themeId must be "custom"
- Choose exactly one baseThemeId from the available presets
- All colors must be valid 6-digit hex values
- Keep the selected display/body fonts and layout variants coherent with the requested brand direction
- Stay tasteful and production-safe; no gimmicks, no novelty neon overload
- Match the user's brand context and evidence
- Focus on layout mood, typography direction, and palette; do not mention CSS or code`;

  const completion = await getOpenAI(clientConfig).chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.6,
    ...(maxTokens ? { max_tokens: maxTokens } : {}),
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as unknown;
  const validated = PortfolioThemeOutputSchema.parse(parsed);

  return {
    ...validated,
    themeId: "custom",
    themeConfig: validated.themeConfig ?? {},
  };
}

// ─── Resume model tool ───────────────────────────────────────────────────────

const ResumeModelOutputSchema = z.object({
  modelId: z.string(),
  modelConfig: ResumeModelConfigSchema.nullable().optional(),
  modelLabel: z.string(),
  summary: z.string(),
  rationale: z.string(),
  changes: z.array(z.string()).default([]),
});

export type ResumeModelOutput = z.infer<typeof ResumeModelOutputSchema>;

export async function setResumeModel(
  context: string,
  model: string,
  style: string = "custom",
  options?: AgentPromptOptions,
  clientConfig?: { apiKey: string; baseURL?: string },
  maxTokens?: number
): Promise<ResumeModelOutput> {
  const normalizedStyle = style === "custom" ? "custom" : normalizeResumeModelId(style);

  if (normalizedStyle !== "custom") {
    const preset = getResumeModelPreset(normalizedStyle);
    return ResumeModelOutputSchema.parse({
      modelId: normalizedStyle,
      modelConfig: null,
      modelLabel: preset.label,
      summary: `Applied the ${preset.label} resume model to the public resume page.`,
      rationale:
        options?.userRequest ??
        `Switch the resume to the ${preset.label} model.`,
      changes: [
        `Updated the resume header to the ${preset.headerLayout} layout.`,
        `Switched the resume structure to ${preset.sectionStyle} sections with a ${preset.asideLayout} info rail.`,
        `Applied the ${preset.displayFont}/${preset.bodyFont} font pairing and ${preset.bulletStyle} bullet treatment.`,
        "Reset any previous custom resume-model overrides.",
      ],
    });
  }

  const prompt = `You are a premium resume art director and screening strategist. Create a safe structured resume model variant for a public portfolio resume page.

Context about the person:
${context}

${buildFocusPrompt(options)}
${options?.userRequest ? `User request:\n${options.userRequest}\n` : ""}

Available preset resume models:
${describeResumeModelsForAgent()}

Return a JSON object only:
{
  "modelId": "custom",
  "modelConfig": {
    "baseModelId": "one available preset id",
    "displayFont": "fraunces|cormorant|space|sora",
    "bodyFont": "manrope|space|sora",
    "headerLayout": "split|centered|stacked",
    "asideLayout": "right|left|top|hidden",
    "sectionStyle": "dividers|cards|bands",
    "bulletStyle": "dot|dash|diamond",
    "accent": "#RRGGBB"
  },
  "modelLabel": "Short title for the resume model",
  "summary": "One sentence on the resulting resume look",
  "rationale": "Why this resume direction fits the person's goals",
  "changes": ["3-5 short concrete visual or structural changes"]
}

Rules:
- modelId must be "custom"
- Choose exactly one baseModelId from the available presets
- All colors must be valid 6-digit hex values
- Keep the layout practical for hiring managers or admissions readers
- Stay structured and production-safe; no gimmicks and no raw CSS
- Focus on hierarchy, screening clarity, and tone rather than design jargon`;

  const completion = await getOpenAI(clientConfig).chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.6,
    ...(maxTokens ? { max_tokens: maxTokens } : {}),
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as unknown;
  const validated = ResumeModelOutputSchema.parse(parsed);

  return {
    ...validated,
    modelId: "custom",
    modelConfig: validated.modelConfig ?? {},
  };
}

// ─── Chat / general agent tool ─────────────────────────────────────────────────

export async function agentChat(
  message: string,
  context: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
  model: string,
  options?: AgentPromptOptions,
  clientConfig?: { apiKey: string; baseURL?: string },
  maxTokens?: number
): Promise<string> {
  const systemPrompt = `You are LifeAgent, an advanced AI personal brand strategist, editor, and portfolio operator.
You help users sharpen positioning, improve proof-of-work, and decide exactly what to build next.

You have access to these tools you can suggest using:
- generate_timeline: Create timeline trees in styles: ${TIMELINE_STYLES.join(", ")}
- generate_video_script: Create video scripts in styles: ${VIDEO_STYLES.join(", ")}  
- generate_tree: Create skill/project/career trees in styles: ${TREE_STYLES.join(", ")}
- set_portfolio_theme: Apply a public portfolio theme in styles: custom, ${describePortfolioThemesForAgent()}
- set_resume_model: Apply a public resume model in styles: custom, ${describeResumeModelsForAgent()}
- regenerate_profile: Refresh the AI-generated portfolio profile
- recrawl_url: Re-crawl a specific URL to get fresh content

Context about this user's portfolio:
${context}

${buildFocusPrompt(options)}

How to behave:
- Be specific, grounded, and practical. Do not give generic fluff.
- Use the selected focus area first when one is provided.
- For critique or strategy requests, prioritize: what is strong, what is unclear, what to change next.
- For rewriting requests, provide improved copy that is concise and usable.
- Stay anchored to the evidence and profile context. If context is thin, say what is missing.

When a user asks you to create something (timeline, video script, tree, etc.),
respond with what you'll do and then output a special tool call marker like:
[TOOL: generate_timeline style=documentary]
or
[TOOL: generate_video_script style=pitch]
or
[TOOL: generate_tree style=skills]
or
[TOOL: set_portfolio_theme style=custom]
or
[TOOL: set_resume_model style=executive]

Otherwise, give helpful advice about personal branding, portfolio building, and career development.
Be concise, practical, and direct.`;

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...conversationHistory,
    { role: "user", content: message },
  ];

  const completion = await getOpenAI(clientConfig).chat.completions.create({
    model,
    messages,
    temperature: 0.7,
    max_tokens: maxTokens ?? 600,
  });

  return completion.choices[0]?.message?.content ?? "I couldn't generate a response.";
}

// ─── Automation executor ───────────────────────────────────────────────────────

export async function computeNextRun(schedule: string, from: Date = new Date()): Promise<Date> {
  const next = new Date(from);
  switch (schedule) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    default:
      // Unrecognised schedule — fall back to weekly
      console.warn(`computeNextRun: unknown schedule "${schedule}", defaulting to weekly`);
      next.setDate(next.getDate() + 7);
  }
  return next;
}
