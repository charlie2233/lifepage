import { z } from "zod";
import {
  PersonaSkillIdSchema,
  WorkflowSkillIdSchema,
} from "@/lib/agent-skills";
import {
  AgentMutationSummarySchema,
  AgentPortfolioPatchSchema,
} from "@/lib/agent-mutations";

export const AgentArtifactMetaSchema = z.object({
  executionMode: z.enum(["artifact", "mutate"]),
  strategy: z.record(z.string(), z.unknown()),
  resolvedPersonaSkillId: PersonaSkillIdSchema.nullable().optional(),
  resolvedWorkflowSkillId: WorkflowSkillIdSchema.nullable().optional(),
  mutationSummary: AgentMutationSummarySchema.nullable().optional(),
  beforeSnapshot: AgentPortfolioPatchSchema.nullable().optional(),
  afterSnapshot: AgentPortfolioPatchSchema.nullable().optional(),
  revertPatch: AgentPortfolioPatchSchema.nullable().optional(),
  revertable: z.boolean().optional(),
  revertedAt: z.string().datetime().nullable().optional(),
  revertedByArtifactId: z.string().nullable().optional(),
});

export type AgentArtifactMeta = z.infer<typeof AgentArtifactMetaSchema>;

export function parseAgentArtifactMeta(input: unknown): AgentArtifactMeta | null {
  const parsed = AgentArtifactMetaSchema.safeParse(input);
  return parsed.success ? parsed.data : null;
}
