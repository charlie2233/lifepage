import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  PERSONA_SKILLS,
  WORKFLOW_SKILLS,
} from "@/lib/agent-skills";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    personaSkills: [
      {
        id: "auto",
        label: "Auto",
        category: "persona",
        description: "Let LifeAgent choose the best expert mode for this turn.",
      },
      ...PERSONA_SKILLS,
    ],
    workflowSkills: [
      {
        id: "auto",
        label: "Auto",
        category: "workflow",
        description: "Let LifeAgent choose the right workflow for this turn.",
      },
      ...WORKFLOW_SKILLS,
    ],
  });
}
