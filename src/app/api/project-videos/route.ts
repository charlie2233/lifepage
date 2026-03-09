import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  ProjectVideoDurationSchema,
  ProjectVideoStyleSchema,
} from "@/lib/project-video-types";
import { createProjectVideoArtifact } from "@/lib/project-videos";
import { ProfileJSONSchema } from "@/lib/schema";

export const runtime = "nodejs";

const CreateProjectVideoSchema = z.object({
  projectIndex: z.number().int().min(0),
  style: ProjectVideoStyleSchema.optional(),
  durationSeconds: ProjectVideoDurationSchema.optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = (await req.json()) as unknown;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = CreateProjectVideoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid project video request." },
      { status: 400 }
    );
  }

  const [activeProfile, evidenceItems, settings, userRecord] = await Promise.all([
    prisma.generatedProfile.findFirst({
      where: { userId: session.user.id, isActive: true },
      orderBy: { createdAt: "desc" },
      select: { data: true },
    }),
    prisma.evidenceItem.findMany({
      where: { userId: session.user.id, visible: true },
      orderBy: { createdAt: "desc" },
      select: {
        screenshot: true,
        title: true,
        url: true,
      },
    }),
    prisma.publicPageSettings.findUnique({
      where: { userId: session.user.id },
      select: { mode: true },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    }),
  ]);

  const parsedProfile = activeProfile?.data
    ? ProfileJSONSchema.safeParse(activeProfile.data)
    : null;

  if (!parsedProfile?.success) {
    return NextResponse.json(
      { error: "Generate a profile before creating project demo videos." },
      { status: 400 }
    );
  }

  try {
    const created = await createProjectVideoArtifact({
      userId: session.user.id,
      userName: userRecord?.name ?? session.user.name,
      mode: settings?.mode === "admissions" ? "admissions" : "hiring",
      profile: parsedProfile.data,
      projectIndex: parsed.data.projectIndex,
      durationSeconds: parsed.data.durationSeconds,
      evidenceItems,
      input: `Project video generation for project index ${parsed.data.projectIndex}`,
      strategy: {
        intent: "Generate project demo video",
        mode: "artifact",
        tool: "generate_project_video",
      },
    });

    return NextResponse.json({
      artifactId: created.artifactId,
      output: created.output,
      billing: created.billing,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to queue project demo video generation.",
      },
      { status: 400 }
    );
  }
}
