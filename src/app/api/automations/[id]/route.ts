import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  computeNextRun,
  normalizeAutomationSchedule,
  normalizeAutomationScheduleTime,
  normalizeAutomationTimezone,
} from "@/lib/automations";
import { z } from "zod";

const PatchSchema = z.object({
  enabled: z.boolean().optional(),
  schedule: z.enum(["daily", "weekly", "monthly"]).optional(),
  scheduleTime: z.string().optional(),
  scheduleTimezone: z.string().optional(),
  name: z.string().min(1).max(100).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = (await req.json()) as unknown;
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const existing = await prisma.automation.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const schedule = normalizeAutomationSchedule(
    parsed.data.schedule ?? existing.schedule
  );
  const scheduleTime = normalizeAutomationScheduleTime(
    parsed.data.scheduleTime ?? existing.scheduleTime
  );
  const scheduleTimezone = normalizeAutomationTimezone(
    parsed.data.scheduleTimezone ?? existing.scheduleTimezone
  );
  const shouldRecomputeNextRun =
    parsed.data.schedule !== undefined ||
    parsed.data.scheduleTime !== undefined ||
    parsed.data.scheduleTimezone !== undefined;

  const automation = await prisma.automation.update({
    where: { id: existing.id },
    data: {
      enabled: parsed.data.enabled,
      name: parsed.data.name,
      schedule,
      scheduleTime,
      scheduleTimezone,
      ...(shouldRecomputeNextRun
        ? {
            nextRun: computeNextRun(schedule, {
              from: new Date(),
              timeOfDay: scheduleTime,
              timeZone: scheduleTimezone,
            }),
          }
        : {}),
    },
  });

  return NextResponse.json({ automation });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  await prisma.automation.deleteMany({ where: { id, userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
