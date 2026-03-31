import { z } from "zod";
import { prisma } from "@/lib/db";

const jsonValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.string()),
]);

export const clientTrackedEventSchema = z.enum([
  "signup_cta_clicked",
  "signup_viewed",
  "signup_submitted",
  "public_profile_shared",
]);

export const productAnalyticsEventSchema = z.enum([
  ...clientTrackedEventSchema.options,
  "signup_completed",
  "generate_profile_requested",
  "generate_profile_succeeded",
  "generate_profile_failed",
]);

export type ProductAnalyticsEventName = z.infer<
  typeof productAnalyticsEventSchema
>;

export const productAnalyticsPayloadSchema = z.object({
  event: clientTrackedEventSchema,
  metadata: z.record(z.string(), jsonValueSchema).optional(),
  path: z.string().max(240).optional(),
  sessionId: z.string().max(120).optional(),
  source: z.string().max(120).optional(),
});

export async function recordProductAnalyticsEvent(input: {
  event: ProductAnalyticsEventName;
  metadata?: Record<string, string | number | boolean | null | string[]>;
  path?: string | null;
  sessionId?: string | null;
  source?: string | null;
  userId?: string | null;
}) {
  try {
    await prisma.productAnalyticsEvent.create({
      data: {
        event: input.event,
        metadata: input.metadata as object | undefined,
        path: input.path ?? undefined,
        sessionId: input.sessionId ?? undefined,
        source: input.source ?? undefined,
        userId: input.userId ?? undefined,
      },
    });
  } catch (error) {
    console.error("Product analytics event failed:", error);
  }
}
