import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { recordProductEvent } from "@/lib/product-analytics";

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
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim().toLowerCase();

    const exists = await prisma.user.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { username: normalizedUsername }],
      },
    });
    if (exists) {
      const duplicateField =
        exists.email === normalizedEmail ? "email" : "username";
      return NextResponse.json(
        {
          error:
            duplicateField === "email"
              ? "That email already has a LifePage account."
              : "That username is already taken. Try another public handle.",
        },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        username: normalizedUsername,
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
    await recordProductEvent({
      event: "signup_completed",
      path: "/register",
      userId: user.id,
      metadata: {
        username: user.username,
      },
    });

    return NextResponse.json({
      user: { id: user.id, email: user.email, username: user.username },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? "Please check the form fields." },
        { status: 400 }
      );
    }
    console.error("Register error:", err);
    return NextResponse.json(
      { error: "Registration failed. Please try again in a moment." },
      { status: 500 }
    );
  }
}
