import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const PatchSchema = z.object({
  enabled: z.boolean().optional(),
  schedule: z.enum(["daily", "weekly", "monthly"]).optional(),
  name: z.string().min(1).max(100).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = (await req.json()) as unknown;
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const automation = await prisma.automation.updateMany({
    where: { id, userId: session.user.id },
    data: parsed.data,
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
