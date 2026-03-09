import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getBillingSnapshot } from "@/lib/billing";
import {
  applyAgentPortfolioPatch,
  buildArtifactMeta,
  createMutationSummary,
  getCurrentPublicPageState,
} from "@/lib/agent-mutations";
import { parseAgentArtifactMeta } from "@/lib/agent-artifacts";
import { ProfileJSONSchema } from "@/lib/schema";
import { z } from "zod";

const RequestSchema = z.object({
  artifactId: z.string().min(1),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as unknown;
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const artifact = await prisma.agentArtifact.findFirst({
    where: {
      id: parsed.data.artifactId,
      userId: session.user.id,
    },
    select: {
      id: true,
      tool: true,
      meta: true,
    },
  });

  if (!artifact) {
    return NextResponse.json({ error: "Artifact not found." }, { status: 404 });
  }

  const meta = parseAgentArtifactMeta(artifact.meta);
  if (
    !meta ||
    meta.executionMode !== "mutate" ||
    !meta.revertPatch ||
    !meta.resolvedWorkflowSkillId
  ) {
    return NextResponse.json(
      { error: "That artifact cannot be reverted." },
      { status: 400 }
    );
  }

  if (meta.revertedAt) {
    return NextResponse.json(
      { error: "That agent change was already reverted." },
      { status: 409 }
    );
  }

  const [profile, settings] = await Promise.all([
    prisma.generatedProfile.findFirst({
      where: { userId: session.user.id, isActive: true },
      orderBy: { createdAt: "desc" },
      select: { data: true },
    }),
    prisma.publicPageSettings.findUnique({
      where: { userId: session.user.id },
      select: {
        visibility: true,
        mode: true,
        theme: true,
        themeConfig: true,
        resumeModel: true,
        resumeModelConfig: true,
      },
    }),
  ]);

  const parsedProfile = profile?.data
    ? ProfileJSONSchema.safeParse(profile.data)
    : null;
  const currentProfile = parsedProfile?.success ? parsedProfile.data : null;
  const currentSettings = getCurrentPublicPageState(settings);
  const reverted = await applyAgentPortfolioPatch({
    userId: session.user.id,
    currentProfile,
    currentSettings,
    patch: meta.revertPatch,
    workflowSkillId: meta.resolvedWorkflowSkillId,
  });

  const mutationSummary = createMutationSummary({
    title: "Reverted agent changes",
    summary: "Restored the portfolio fields changed by the selected agent run.",
    changes: [
      `Restored ${reverted.changedFields.length} changed field${
        reverted.changedFields.length === 1 ? "" : "s"
      }.`,
      "Reactivated the previous portfolio content and presentation state.",
    ],
    changedFields: reverted.changedFields,
  });

  const revertArtifact = await prisma.agentArtifact.create({
    data: {
      userId: session.user.id,
      tool: "revert_agent_mutation",
      style: null,
      input: `Revert artifact ${artifact.id}`,
      output: mutationSummary as Prisma.InputJsonValue,
      meta: buildArtifactMeta({
        executionMode: "mutate",
        strategy: {
          intent: "Revert prior agent change",
          mode: "mutate",
          workflowSkillId: meta.resolvedWorkflowSkillId,
        },
        resolvedPersonaSkillId: meta.resolvedPersonaSkillId,
        resolvedWorkflowSkillId: meta.resolvedWorkflowSkillId,
        mutationSummary,
        beforeSnapshot: meta.afterSnapshot ?? null,
        afterSnapshot: meta.beforeSnapshot ?? null,
        revertPatch: meta.beforeSnapshot ?? null,
        revertable: false,
      }) as Prisma.InputJsonValue,
    },
    select: { id: true },
  });

  await prisma.agentArtifact.update({
    where: { id: artifact.id },
    data: {
      meta: buildArtifactMeta({
        executionMode: "mutate",
        strategy: meta.strategy,
        resolvedPersonaSkillId: meta.resolvedPersonaSkillId,
        resolvedWorkflowSkillId: meta.resolvedWorkflowSkillId,
        mutationSummary: meta.mutationSummary ?? null,
        beforeSnapshot: meta.beforeSnapshot ?? null,
        afterSnapshot: meta.afterSnapshot ?? null,
        revertPatch: meta.revertPatch ?? null,
        revertable: false,
        revertedAt: new Date().toISOString(),
        revertedByArtifactId: revertArtifact.id,
      }) as Prisma.InputJsonValue,
    },
  });

  const billing = await getBillingSnapshot(session.user.id);

  return NextResponse.json({
    ok: true,
    reply: "Reverted the selected agent change.",
    artifactId: revertArtifact.id,
    revertedArtifactId: artifact.id,
    mutationSummary,
    billing,
    profile: reverted.profile,
    settings: reverted.settings,
  });
}
