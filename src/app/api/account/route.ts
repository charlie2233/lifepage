import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma";
import { z } from "zod";

const AccountPatchSchema = z.object({
  name: z
    .union([z.string().trim().max(80), z.null()])
    .optional()
    .refine(
      (value) => value === undefined || value === null || value.length > 0,
      "Name cannot be empty"
    ),
  username: z
    .string()
    .trim()
    .min(3)
    .max(32)
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, hyphens, and underscores"
    )
    .transform((value) => value.toLowerCase())
    .optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      username: true,
      email: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ account: user });
}

export async function PATCH(req: Request) {
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

  const parsed = AccountPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid account input." }, { status: 400 });
  }

  if (parsed.data.name === undefined && parsed.data.username === undefined) {
    return NextResponse.json({ error: "No account changes provided." }, { status: 400 });
  }

  if (parsed.data.username) {
    const existing = await prisma.user.findFirst({
      where: {
        username: parsed.data.username,
        NOT: { id: session.user.id },
      },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "That username is already taken." },
        { status: 409 }
      );
    }
  }

  try {
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.username !== undefined ? { username: parsed.data.username } : {}),
      },
      select: {
        name: true,
        username: true,
        email: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ account: user });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "That username is already taken." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to save account settings." },
      { status: 500 }
    );
  }
}
