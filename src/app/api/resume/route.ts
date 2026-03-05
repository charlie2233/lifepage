import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [profile, user] = await Promise.all([
    prisma.generatedProfile.findFirst({
      where: { userId: session.user.id, isActive: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findUnique({ where: { id: session.user.id } }),
  ]);

  if (!profile) {
    return NextResponse.json(
      { error: "No profile generated yet" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    profile,
    user: {
      name: user?.name,
      email: user?.email,
      username: user?.username,
    },
  });
}
