import { z } from "zod";

export const PROJECT_MEDIA_TYPES = ["video", "image", "link"] as const;
export const PROJECT_MEDIA_STATUSES = [
  "processing",
  "ready",
  "failed",
] as const;

export const ProjectMediaTypeSchema = z.enum(PROJECT_MEDIA_TYPES);
export const ProjectMediaStatusSchema = z.enum(PROJECT_MEDIA_STATUSES);

const ProjectMediaUrlSchema = z
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
  }, "Enter a valid media URL.");

export const ProjectMediaObjectSchema = z.object({
  type: ProjectMediaTypeSchema,
  url: ProjectMediaUrlSchema,
  posterUrl: ProjectMediaUrlSchema.nullable().optional(),
  title: z.string().trim().max(160).nullable().optional(),
  provider: z.string().trim().min(1).max(60).nullable().optional(),
  status: ProjectMediaStatusSchema.default("ready"),
  durationSeconds: z.number().int().min(1).max(60).nullable().optional(),
  storageKey: z.string().trim().max(260).nullable().optional(),
  sourceArtifactId: z.string().trim().max(120).nullable().optional(),
  error: z.string().trim().max(240).nullable().optional(),
});

export const ProjectMediaSchema = z.union([
  ProjectMediaUrlSchema,
  ProjectMediaObjectSchema,
]);

export type ProjectMediaInput = z.infer<typeof ProjectMediaSchema>;
export type ProjectMediaObject = z.infer<typeof ProjectMediaObjectSchema>;
export type ProjectMediaType = z.infer<typeof ProjectMediaTypeSchema>;
export type ProjectMediaStatus = z.infer<typeof ProjectMediaStatusSchema>;

export function normalizeProjectMediaItem(
  item: ProjectMediaInput
): ProjectMediaObject {
  if (typeof item === "string") {
    return {
      type: "link",
      url: item,
      posterUrl: null,
      title: null,
      provider: "legacy",
      status: "ready",
      durationSeconds: null,
      storageKey: null,
      sourceArtifactId: null,
      error: null,
    };
  }

  return {
    type: item.type,
    url: item.url,
    posterUrl: item.posterUrl ?? null,
    title: item.title ?? null,
    provider: item.provider ?? null,
    status: item.status ?? "ready",
    durationSeconds: item.durationSeconds ?? null,
    storageKey: item.storageKey ?? null,
    sourceArtifactId: item.sourceArtifactId ?? null,
    error: item.error ?? null,
  };
}

export function normalizeProjectMedia(
  items: ProjectMediaInput[] | null | undefined
) {
  return (items ?? []).map(normalizeProjectMediaItem);
}
