import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  agentChat,
  generateTimeline,
  generateVideoScript,
  generateTree,
  type TimelineStyle,
  type VideoStyle,
  type TreeStyle,
  TIMELINE_STYLES,
  VIDEO_STYLES,
  TREE_STYLES,
} from "@/lib/agent-tools";
import { z } from "zod";

const MAX_STORED_INPUT_LENGTH = 500;

const RequestSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .default([]),
  // If provided, directly invoke a tool
  tool: z
    .enum([
      "generate_timeline",
      "generate_video_script",
      "generate_tree",
    ])
    .optional(),
  style: z.string().optional(),
});

function buildContext(
  profile: { data: unknown } | null,
  evidenceItems: Array<{ title: string | null; description: string | null; url: string | null }>
): string {
  const parts: string[] = [];

  if (profile?.data) {
    const d = profile.data as Record<string, unknown>;
    if (d.headline) parts.push(`Headline: ${d.headline}`);
    if (d.about) parts.push(`About: ${d.about}`);
    if (Array.isArray(d.skills)) {
      parts.push(`Skills: ${(d.skills as Array<{ tag: string }>).map((s) => s.tag).join(", ")}`);
    }
    if (Array.isArray(d.projects)) {
      const projs = (d.projects as Array<{ title: string; impact?: string }>)
        .map((p) => `${p.title}${p.impact ? ` (${p.impact})` : ""}`)
        .join("; ");
      parts.push(`Projects: ${projs}`);
    }
    if (Array.isArray(d.timeline)) {
      const tl = (d.timeline as Array<{ year: string; milestones: string[] }>)
        .map((t) => `${t.year}: ${t.milestones.join(", ")}`)
        .join("; ");
      parts.push(`Timeline: ${tl}`);
    }
  }

  if (evidenceItems.length > 0) {
    const ev = evidenceItems
      .map((e) => `${e.title ?? ""}${e.description ? ` — ${e.description}` : ""}`)
      .join("; ");
    parts.push(`Evidence sources: ${ev}`);
  }

  return parts.join("\n") || "No profile generated yet.";
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as unknown;
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { message, history, tool, style } = parsed.data;

  // Load user context
  const [profile, evidenceItems] = await Promise.all([
    prisma.generatedProfile.findFirst({
      where: { userId: session.user.id, isActive: true },
      select: { data: true },
    }),
    prisma.evidenceItem.findMany({
      where: { userId: session.user.id, visible: true },
      select: { title: true, description: true, url: true },
      take: 10,
    }),
  ]);

  const context = buildContext(profile, evidenceItems);

  // Direct tool invocation
  if (tool) {
    try {
      let output: unknown;
      let usedStyle = style ?? "";

      if (tool === "generate_timeline") {
        const s = (TIMELINE_STYLES.includes(style as TimelineStyle) ? style : "vertical") as TimelineStyle;
        usedStyle = s;
        output = await generateTimeline(context, s);
      } else if (tool === "generate_video_script") {
        const s = (VIDEO_STYLES.includes(style as VideoStyle) ? style : "documentary") as VideoStyle;
        usedStyle = s;
        output = await generateVideoScript(context, s);
      } else if (tool === "generate_tree") {
        const s = (TREE_STYLES.includes(style as TreeStyle) ? style : "skills") as TreeStyle;
        usedStyle = s;
        output = await generateTree(context, s);
      }

      // Persist artifact
      const artifact = await prisma.agentArtifact.create({
        data: {
          userId: session.user.id,
          tool,
          style: usedStyle,
          input: context.slice(0, MAX_STORED_INPUT_LENGTH),
          output: output as object,
        },
      });

      return NextResponse.json({ type: "tool_result", tool, style: usedStyle, output, artifactId: artifact.id });
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 });
    }
  }

  // Chat mode — detect if the message implies a tool call
  try {
    const reply = await agentChat(message, context, history);

    // Check if the reply contains a tool call marker
    const toolMatch = reply.match(/\[TOOL:\s*(\w+)\s*(?:style=(\w+))?\]/);
    if (toolMatch) {
      const detectedTool = toolMatch[1] as string;
      const detectedStyle = toolMatch[2] as string | undefined;
      const cleanReply = reply.replace(/\[TOOL:[^\]]+\]/g, "").trim();

      let toolOutput: unknown;
      let finalStyle = detectedStyle ?? "";

      if (detectedTool === "generate_timeline") {
        const s = (TIMELINE_STYLES.includes(detectedStyle as TimelineStyle) ? detectedStyle : "vertical") as TimelineStyle;
        finalStyle = s;
        toolOutput = await generateTimeline(context, s);
      } else if (detectedTool === "generate_video_script") {
        const s = (VIDEO_STYLES.includes(detectedStyle as VideoStyle) ? detectedStyle : "documentary") as VideoStyle;
        finalStyle = s;
        toolOutput = await generateVideoScript(context, s);
      } else if (detectedTool === "generate_tree") {
        const s = (TREE_STYLES.includes(detectedStyle as TreeStyle) ? detectedStyle : "skills") as TreeStyle;
        finalStyle = s;
        toolOutput = await generateTree(context, s);
      }

      if (toolOutput) {
        const artifact = await prisma.agentArtifact.create({
          data: {
            userId: session.user.id,
            tool: detectedTool,
            style: finalStyle,
            input: message.slice(0, MAX_STORED_INPUT_LENGTH),
            output: toolOutput as object,
          },
        });

        return NextResponse.json({
          type: "tool_result",
          reply: cleanReply,
          tool: detectedTool,
          style: finalStyle,
          output: toolOutput,
          artifactId: artifact.id,
        });
      }
    }

    return NextResponse.json({ type: "chat", reply });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// List saved artifacts
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const artifacts = await prisma.agentArtifact.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, tool: true, style: true, createdAt: true, output: true },
  });

  return NextResponse.json({ artifacts });
}
