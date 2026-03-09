import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import {
  getLocalProjectVideoContentType,
  resolveLocalProjectVideoPath,
} from "@/lib/project-video-storage";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ key?: string[] }> }
) {
  const { key } = await context.params;
  if (!key?.length) {
    return NextResponse.json({ error: "Asset not found." }, { status: 404 });
  }

  let absolutePath: string;
  try {
    absolutePath = resolveLocalProjectVideoPath(key);
  } catch {
    return NextResponse.json({ error: "Invalid asset path." }, { status: 400 });
  }

  try {
    const file = await readFile(absolutePath);
    return new NextResponse(file, {
      status: 200,
      headers: {
        "Content-Type": getLocalProjectVideoContentType(absolutePath),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Asset not found." }, { status: 404 });
  }
}
