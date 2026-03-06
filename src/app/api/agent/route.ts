import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getBillingSnapshot, reserveAiModel } from "@/lib/billing";
import { prisma } from "@/lib/db";
import { buildAgentContext, resolveAgentFocus } from "@/lib/agent-context";
import { AGENT_FOCUS_KINDS } from "@/lib/agent-focus";
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
import { ProfileJSONSchema } from "@/lib/schema";
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
  focus: z
    .object({
      kind: z.enum(AGENT_FOCUS_KINDS),
      index: z.number().int().min(0).optional(),
      evidenceId: z.string().min(1).optional(),
    })
    .optional(),
});

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

  const { message, history, tool, style, focus } = parsed.data;

  // Load user context
  const [profile, evidenceItems] = await Promise.all([
    prisma.generatedProfile.findFirst({
      where: { userId: session.user.id, isActive: true },
      orderBy: { createdAt: "desc" },
      select: { data: true },
    }),
    prisma.evidenceItem.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        url: true,
        rawContent: true,
      },
      take: 20,
    }),
  ]);

  const parsedProfile = profile?.data
    ? ProfileJSONSchema.safeParse(profile.data)
    : null;
  const profileData = parsedProfile?.success ? parsedProfile.data : null;
  const context = buildAgentContext(profileData, evidenceItems);
  const resolvedFocus = resolveAgentFocus(profileData, evidenceItems, focus);

  if (focus && !resolvedFocus) {
    return NextResponse.json(
      { error: "Invalid focus target." },
      { status: 400 }
    );
  }

  const storedInput = [
    resolvedFocus ? `Focus: ${resolvedFocus.label}` : null,
    message,
  ]
    .filter((part): part is string => Boolean(part))
    .join("\n")
    .slice(0, MAX_STORED_INPUT_LENGTH);

  // Direct tool invocation
  if (tool) {
    try {
      let output: unknown;
      let usedStyle = style ?? "";
      const promptOptions = {
        focusLabel: resolvedFocus?.label,
        focusContext: resolvedFocus?.context,
        userRequest: message,
      };

      if (tool === "generate_timeline") {
        const aiReservation = await reserveAiModel(session.user.id, {
          task: "timeline",
        });
        const s = (TIMELINE_STYLES.includes(style as TimelineStyle) ? style : "vertical") as TimelineStyle;
        usedStyle = s;
        output = await generateTimeline(
          context,
          aiReservation.model,
          s,
          promptOptions,
          aiReservation.clientConfig,
          aiReservation.maxTokens
        );
      } else if (tool === "generate_video_script") {
        const aiReservation = await reserveAiModel(session.user.id, {
          task: "video_script",
        });
        const s = (VIDEO_STYLES.includes(style as VideoStyle) ? style : "documentary") as VideoStyle;
        usedStyle = s;
        output = await generateVideoScript(
          context,
          aiReservation.model,
          s,
          promptOptions,
          aiReservation.clientConfig,
          aiReservation.maxTokens
        );
      } else if (tool === "generate_tree") {
        const aiReservation = await reserveAiModel(session.user.id, {
          task: "tree",
        });
        const s = (TREE_STYLES.includes(style as TreeStyle) ? style : "skills") as TreeStyle;
        usedStyle = s;
        output = await generateTree(
          context,
          aiReservation.model,
          s,
          promptOptions,
          aiReservation.clientConfig,
          aiReservation.maxTokens
        );
      }

      // Persist artifact
      const artifact = await prisma.agentArtifact.create({
        data: {
          userId: session.user.id,
          tool,
          style: usedStyle,
          input: storedInput,
          output: output as object,
        },
      });

      const billing = await getBillingSnapshot(session.user.id);

      return NextResponse.json({
        type: "tool_result",
        tool,
        style: usedStyle,
        output,
        artifactId: artifact.id,
        focusLabel: resolvedFocus?.label,
        billing,
      });
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 });
    }
  }

  // Chat mode — detect if the message implies a tool call
  try {
    const chatReservation = await reserveAiModel(session.user.id, {
      task: "chat",
    });
    const reply = await agentChat(
      message,
      context,
      history,
      chatReservation.model,
      {
        focusLabel: resolvedFocus?.label,
        focusContext: resolvedFocus?.context,
      },
      chatReservation.clientConfig,
      chatReservation.maxTokens
    );

    // Check if the reply contains a tool call marker
    const toolMatch = reply.match(/\[TOOL:\s*(\w+)\s*(?:style=(\w+))?\]/);
    if (toolMatch) {
      const detectedTool = toolMatch[1] as string;
      const detectedStyle = toolMatch[2] as string | undefined;
      const cleanReply = reply.replace(/\[TOOL:[^\]]+\]/g, "").trim();

      let toolOutput: unknown;
      let finalStyle = detectedStyle ?? "";
      const promptOptions = {
        focusLabel: resolvedFocus?.label,
        focusContext: resolvedFocus?.context,
        userRequest: message,
      };

      if (detectedTool === "generate_timeline") {
        const aiReservation = await reserveAiModel(session.user.id, {
          task: "timeline",
        });
        const s = (TIMELINE_STYLES.includes(detectedStyle as TimelineStyle) ? detectedStyle : "vertical") as TimelineStyle;
        finalStyle = s;
        toolOutput = await generateTimeline(
          context,
          aiReservation.model,
          s,
          promptOptions,
          aiReservation.clientConfig,
          aiReservation.maxTokens
        );
      } else if (detectedTool === "generate_video_script") {
        const aiReservation = await reserveAiModel(session.user.id, {
          task: "video_script",
        });
        const s = (VIDEO_STYLES.includes(detectedStyle as VideoStyle) ? detectedStyle : "documentary") as VideoStyle;
        finalStyle = s;
        toolOutput = await generateVideoScript(
          context,
          aiReservation.model,
          s,
          promptOptions,
          aiReservation.clientConfig,
          aiReservation.maxTokens
        );
      } else if (detectedTool === "generate_tree") {
        const aiReservation = await reserveAiModel(session.user.id, {
          task: "tree",
        });
        const s = (TREE_STYLES.includes(detectedStyle as TreeStyle) ? detectedStyle : "skills") as TreeStyle;
        finalStyle = s;
        toolOutput = await generateTree(
          context,
          aiReservation.model,
          s,
          promptOptions,
          aiReservation.clientConfig,
          aiReservation.maxTokens
        );
      }

      if (toolOutput) {
        const artifact = await prisma.agentArtifact.create({
          data: {
            userId: session.user.id,
            tool: detectedTool,
            style: finalStyle,
            input: storedInput,
            output: toolOutput as object,
          },
        });

        const billing = await getBillingSnapshot(session.user.id);

        return NextResponse.json({
          type: "tool_result",
          reply: cleanReply,
          tool: detectedTool,
          style: finalStyle,
          output: toolOutput,
          artifactId: artifact.id,
          focusLabel: resolvedFocus?.label,
          billing,
        });
      }
    }

    const billing = await getBillingSnapshot(session.user.id);

    return NextResponse.json({
      type: "chat",
      reply,
      focusLabel: resolvedFocus?.label,
      billing,
    });
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
