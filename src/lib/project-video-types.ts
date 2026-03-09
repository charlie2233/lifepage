import { z } from "zod";

export const PROJECT_VIDEO_STYLES = ["polished-product-demo"] as const;
export const PROJECT_VIDEO_DURATIONS = [4, 8, 12] as const;

export const ProjectVideoStyleSchema = z.enum(PROJECT_VIDEO_STYLES);
export const ProjectVideoDurationSchema = z.union([
  z.literal(4),
  z.literal(8),
  z.literal(12),
]);
export const ProjectVideoStatusSchema = z.enum([
  "queued",
  "in_progress",
  "completed",
  "failed",
]);

const ProjectVideoUrlSchema = z
  .string()
  .trim()
  .min(1)
  .refine((value) => {
    if (value.startsWith("/")) {
      return true;
    }

    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }, "Enter a valid project video URL.");

export const ProjectVideoStateSchema = z.object({
  projectIndex: z.number().int().min(0),
  projectTitle: z.string().trim().min(1).max(180),
  style: ProjectVideoStyleSchema.default("polished-product-demo"),
  durationSeconds: ProjectVideoDurationSchema.default(8),
  provider: z.literal("openai-sora").default("openai-sora"),
  prompt: z.string().trim().min(1),
  status: ProjectVideoStatusSchema,
  progress: z.number().min(0).max(100).nullable().optional(),
  soraVideoId: z.string().trim().min(1).nullable().optional(),
  videoUrl: ProjectVideoUrlSchema.nullable().optional(),
  posterUrl: ProjectVideoUrlSchema.nullable().optional(),
  videoStorageKey: z.string().trim().max(260).nullable().optional(),
  posterStorageKey: z.string().trim().max(260).nullable().optional(),
  evidenceScreenshotUsed: z.boolean().default(false),
  error: z.string().trim().max(240).nullable().optional(),
});

export const ProjectVideoArtifactOutputSchema = ProjectVideoStateSchema.extend({
  summary: z.string().trim().min(1).max(240),
});

export type ProjectVideoStyle = z.infer<typeof ProjectVideoStyleSchema>;
export type ProjectVideoDuration = z.infer<typeof ProjectVideoDurationSchema>;
export type ProjectVideoStatus = z.infer<typeof ProjectVideoStatusSchema>;
export type ProjectVideoState = z.infer<typeof ProjectVideoStateSchema>;
export type ProjectVideoArtifactOutput = z.infer<
  typeof ProjectVideoArtifactOutputSchema
>;
