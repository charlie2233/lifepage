import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  username: z.string().min(3).regex(
    /^[a-zA-Z0-9_-]+$/,
    "Username can only contain letters, numbers, hyphens, and underscores"
  ),
});

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as unknown;
    const { name, email, password, username } = schema.parse(body);

    const exists = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (exists) {
      return NextResponse.json(
        { error: "Email or username already taken" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        username,
        passwordHash,
        profile: { create: { theme: "obsidian" } },
        publicPageSettings: {
          create: {
            isPublic: true,
            visibility: "public",
            mode: "hiring",
            theme: "obsidian",
          },
        },
      },
    });

    return NextResponse.json({
      user: { id: user.id, email: user.email, username: user.username },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? "Validation error" },
        { status: 400 }
      );
    }
    console.error("Register error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
