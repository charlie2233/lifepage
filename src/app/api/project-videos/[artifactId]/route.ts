import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getBillingSnapshot } from "@/lib/billing";
import { refreshProjectVideoArtifact } from "@/lib/project-videos";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ artifactId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { artifactId } = await context.params;
  if (!artifactId) {
    return NextResponse.json({ error: "Missing artifact id." }, { status: 400 });
  }

  try {
    const result = await refreshProjectVideoArtifact({
      artifactId,
      userId: session.user.id,
    });
    const billing = await getBillingSnapshot(session.user.id);

    return NextResponse.json({
      artifactId: result.artifactId,
      output: result.output,
      profile: result.profile ?? null,
      billing,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load project video job.",
      },
      { status: 400 }
    );
  }
}
