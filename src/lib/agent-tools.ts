/**
 * AI Agent Tool Registry
 * Each tool is a callable function the agent can invoke via the /api/agent endpoint.
 * Tools produce structured JSON outputs stored as AgentArtifacts.
 */

import OpenAI from "openai";
import { z } from "zod";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// ─── Shared types ──────────────────────────────────────────────────────────────

export type ToolName =
  | "generate_timeline"
  | "generate_video_script"
  | "generate_tree"
  | "regenerate_profile"
  | "recrawl_url"
  | "chat";

export interface ToolResult {
  tool: ToolName;
  style?: string;
  output: unknown;
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
  style: TimelineStyle = "vertical"
): Promise<TimelineOutput> {
  const styleDescriptions: Record<TimelineStyle, string> = {
    vertical: "A clean vertical chronological timeline with year markers and category icons.",
    horizontal: "A horizontal scrollable timeline showing the journey from left to right.",
    documentary: "A narrative-style timeline that reads like a personal documentary, with rich descriptions and story arcs.",
    minimal: "A minimal stripped-down timeline with just year, title, and one-line descriptions.",
  };

  const prompt = `You are a personal brand storyteller. Create a rich timeline from this person's story/evidence.

Context about the person:
${context}

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
- For documentary style: make descriptions feel like narration ("It was 2021 when...")
- Mark truly pivotal moments as highlight: true`;

  const completion = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.5,
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
  style: VideoStyle = "documentary"
): Promise<VideoScriptOutput> {
  const styleDescriptions: Record<VideoStyle, string> = {
    documentary: "First-person narrated documentary style — honest, reflective, professional. Like a TED Talk intro.",
    pitch: "60-second investor/employer pitch — confident, punchy, results-focused. Think Y Combinator pitch.",
    cinematic: "Cinematic portfolio reel — visual storytelling, minimal words, powerful imagery directions.",
    tutorial: "Educational walkthrough — shows how this person solves problems. Screen-recording + narration style.",
    story: "Personal brand story — origin story, struggles, breakthroughs. Authentic and emotional.",
  };

  const prompt = `You are a professional video director and copywriter. Create a video script for this person's portfolio/brand.

Context about the person:
${context}

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
- ${style === "cinematic" ? "Minimize words, maximize visual impact" : ""}
- ${style === "pitch" ? "Every second counts — be ruthlessly concise" : ""}`;

  const completion = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.6,
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
  style: TreeStyle = "skills"
): Promise<TreeOutput> {
  const styleDescriptions: Record<TreeStyle, string> = {
    skills: "A skills tree showing expertise areas with sub-skills branching out. Like a tech tree in a game.",
    projects: "A project dependency tree showing how projects relate to each other and build on each other.",
    career: "A career tree showing the growth path — roles, companies, and milestones branching out.",
    goals: "A goals tree showing where this person is heading — aspirations broken down into milestones.",
  };

  const prompt = `You are a visual information designer. Create a hierarchical tree/mind-map for this person.

Context about the person:
${context}

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
- Base everything on actual evidence from the context`;

  const completion = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.4,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as unknown;
  return TreeOutputSchema.parse(parsed);
}

// ─── Chat / general agent tool ─────────────────────────────────────────────────

export async function agentChat(
  message: string,
  context: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string> {
  const systemPrompt = `You are a helpful AI personal brand assistant called LifeAgent. 
You help users build and improve their personal portfolio and brand.

You have access to these tools you can suggest using:
- generate_timeline: Create timeline trees in styles: ${TIMELINE_STYLES.join(", ")}
- generate_video_script: Create video scripts in styles: ${VIDEO_STYLES.join(", ")}  
- generate_tree: Create skill/project/career trees in styles: ${TREE_STYLES.join(", ")}
- regenerate_profile: Refresh the AI-generated portfolio profile
- recrawl_url: Re-crawl a specific URL to get fresh content

Context about this user's portfolio:
${context}

When a user asks you to create something (timeline, video script, tree, etc.), 
respond with what you'll do and then output a special tool call marker like:
[TOOL: generate_timeline style=documentary]
or
[TOOL: generate_video_script style=pitch]
or
[TOOL: generate_tree style=skills]

Otherwise, give helpful advice about personal branding, portfolio building, and career development.
Be concise, practical, and encouraging.`;

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...conversationHistory,
    { role: "user", content: message },
  ];

  const completion = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    temperature: 0.7,
    max_tokens: 600,
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
