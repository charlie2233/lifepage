import { z } from "zod";
import {
  PersonaSkillIdSchema,
  WorkflowSkillIdSchema,
  type PersonaSkillId,
  type WorkflowSkillId,
} from "@/lib/agent-skills";

export const AgentPreferencesSchema = z
  .object({
    pinnedPersonaSkillId: PersonaSkillIdSchema.nullable().optional(),
    pinnedWorkflowSkillId: WorkflowSkillIdSchema.nullable().optional(),
    brandVoiceInstruction: z.string().trim().max(600).nullable().optional(),
  })
  .strict();

export interface AgentPreferences {
  pinnedPersonaSkillId: PersonaSkillId | null;
  pinnedWorkflowSkillId: WorkflowSkillId | null;
  brandVoiceInstruction: string | null;
}

export function parseAgentPreferences(input: unknown): AgentPreferences {
  const parsed = AgentPreferencesSchema.safeParse(input);
  if (!parsed.success) {
    return {
      pinnedPersonaSkillId: null,
      pinnedWorkflowSkillId: null,
      brandVoiceInstruction: null,
    };
  }

  return {
    pinnedPersonaSkillId: parsed.data.pinnedPersonaSkillId ?? null,
    pinnedWorkflowSkillId: parsed.data.pinnedWorkflowSkillId ?? null,
    brandVoiceInstruction: parsed.data.brandVoiceInstruction?.trim() || null,
  };
}
