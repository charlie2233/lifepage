import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import {
  AgentPreferencesSchema,
  parseAgentPreferences,
} from "@/lib/agent-preferences";
import { z } from "zod";

function normalizeOptionalText(value: string | null | undefined) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeOptionalUrl(value: string | null | undefined) {
  const normalized = normalizeOptionalText(value);
  if (normalized === undefined || normalized === null) {
    return normalized;
  }

  const withScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(normalized)
    ? normalized
    : `https://${normalized}`;

  try {
    const url = new URL(withScheme);
    return url.toString();
  } catch {
    throw new Error("Enter a valid URL.");
  }
}

const AccountProfilePatchSchema = z.object({
  location: z.union([z.string().trim().max(120), z.null()]).optional(),
  website: z.union([z.string().trim().max(240), z.null()]).optional(),
  github: z.union([z.string().trim().max(240), z.null()]).optional(),
  linkedin: z.union([z.string().trim().max(240), z.null()]).optional(),
  youtube: z.union([z.string().trim().max(240), z.null()]).optional(),
  contactEmail: z.union([z.string().trim().email().max(160), z.null()]).optional(),
  phone: z
    .union([z.string().trim().max(40), z.null()])
    .optional()
    .refine(
      (value) =>
        value === undefined ||
        value === null ||
        /^[0-9+\-().\s]{7,40}$/.test(value),
      "Enter a valid phone number"
    ),
  contactNote: z.union([z.string().trim().max(220), z.null()]).optional(),
});

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
  agentPreferences: AgentPreferencesSchema.optional(),
  profile: AccountProfilePatchSchema.optional(),
});

const accountSelect = {
  name: true,
  username: true,
  email: true,
  createdAt: true,
  agentPreferences: true,
  profile: {
    select: {
      location: true,
      website: true,
      github: true,
      linkedin: true,
      youtube: true,
      contactEmail: true,
      phone: true,
      contactNote: true,
    },
  },
} satisfies Prisma.UserSelect;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: accountSelect,
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    account: {
      ...user,
      agentPreferences: parseAgentPreferences(user.agentPreferences),
      profile: {
        location: user.profile?.location ?? null,
        website: user.profile?.website ?? null,
        github: user.profile?.github ?? null,
        linkedin: user.profile?.linkedin ?? null,
        youtube: user.profile?.youtube ?? null,
        contactEmail: user.profile?.contactEmail ?? null,
        phone: user.profile?.phone ?? null,
        contactNote: user.profile?.contactNote ?? null,
      },
    },
  });
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

  if (
    parsed.data.name === undefined &&
    parsed.data.username === undefined &&
    parsed.data.agentPreferences === undefined &&
    parsed.data.profile === undefined
  ) {
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
    let normalizedProfile:
      | {
          location?: string | null;
          website?: string | null;
          github?: string | null;
          linkedin?: string | null;
          youtube?: string | null;
          contactEmail?: string | null;
          phone?: string | null;
          contactNote?: string | null;
        }
      | undefined;

    if (parsed.data.profile) {
      try {
        normalizedProfile = {
          ...(parsed.data.profile.location !== undefined
            ? { location: normalizeOptionalText(parsed.data.profile.location) }
            : {}),
          ...(parsed.data.profile.website !== undefined
            ? { website: normalizeOptionalUrl(parsed.data.profile.website) }
            : {}),
          ...(parsed.data.profile.github !== undefined
            ? { github: normalizeOptionalUrl(parsed.data.profile.github) }
            : {}),
          ...(parsed.data.profile.linkedin !== undefined
            ? { linkedin: normalizeOptionalUrl(parsed.data.profile.linkedin) }
            : {}),
          ...(parsed.data.profile.youtube !== undefined
            ? { youtube: normalizeOptionalUrl(parsed.data.profile.youtube) }
            : {}),
          ...(parsed.data.profile.contactEmail !== undefined
            ? { contactEmail: normalizeOptionalText(parsed.data.profile.contactEmail) }
            : {}),
          ...(parsed.data.profile.phone !== undefined
            ? { phone: normalizeOptionalText(parsed.data.profile.phone) }
            : {}),
          ...(parsed.data.profile.contactNote !== undefined
            ? { contactNote: normalizeOptionalText(parsed.data.profile.contactNote) }
            : {}),
        };
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Invalid profile input." },
          { status: 400 }
        );
      }
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.username !== undefined ? { username: parsed.data.username } : {}),
        ...(parsed.data.agentPreferences !== undefined
          ? {
              agentPreferences: parsed.data.agentPreferences
                ? (parsed.data.agentPreferences as Prisma.InputJsonValue)
                : Prisma.JsonNull,
            }
          : {}),
        ...(normalizedProfile && Object.keys(normalizedProfile).length > 0
          ? {
              profile: {
                upsert: {
                  create: {
                    theme: "obsidian",
                    ...normalizedProfile,
                  },
                  update: normalizedProfile,
                },
              },
            }
          : {}),
      },
      select: accountSelect,
    });

    return NextResponse.json({
      account: {
        ...user,
        agentPreferences: parseAgentPreferences(user.agentPreferences),
        profile: {
          location: user.profile?.location ?? null,
          website: user.profile?.website ?? null,
          github: user.profile?.github ?? null,
          linkedin: user.profile?.linkedin ?? null,
          youtube: user.profile?.youtube ?? null,
          contactEmail: user.profile?.contactEmail ?? null,
          phone: user.profile?.phone ?? null,
          contactNote: user.profile?.contactNote ?? null,
        },
      },
    });
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
