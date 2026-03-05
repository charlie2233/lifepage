import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const { visible } = (await req.json()) as { visible: boolean };
  const item = await prisma.evidenceItem.updateMany({
    where: { id, userId: session.user.id },
    data: { visible },
  });
  return NextResponse.json({ item });
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await prisma.evidenceItem.deleteMany({
    where: { id, userId: session.user.id },
  });
  return NextResponse.json({ ok: true });
}
