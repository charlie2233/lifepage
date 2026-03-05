import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.generatedProfile.findFirst({
    where: { userId: session.user.id, isActive: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ profile });
}
