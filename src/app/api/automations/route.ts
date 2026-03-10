import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  computeNextRun,
  normalizeAutomationScheduleTime,
  normalizeAutomationTimezone,
} from "@/lib/automations";
import { z } from "zod";

const CreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(300).optional(),
  action: z.enum(["recrawl_url", "regenerate_profile", "refresh_timeline", "refresh_video_script"]),
  config: z.record(z.string(), z.unknown()).default({}),
  schedule: z.enum(["daily", "weekly", "monthly"]).default("weekly"),
  scheduleTime: z.string().optional(),
  scheduleTimezone: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const automations = await prisma.automation.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ automations });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as unknown;
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const scheduleTime = normalizeAutomationScheduleTime(parsed.data.scheduleTime);
  const scheduleTimezone = normalizeAutomationTimezone(
    parsed.data.scheduleTimezone
  );
  const nextRun = computeNextRun(parsed.data.schedule, {
    timeOfDay: scheduleTime,
    timeZone: scheduleTimezone,
  });

  const automation = await prisma.automation.create({
    data: {
      userId: session.user.id,
      ...parsed.data,
      config: parsed.data.config as object,
      scheduleTime,
      scheduleTimezone,
      nextRun,
    },
  });

  return NextResponse.json({ automation });
}
