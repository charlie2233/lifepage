import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export type ProductEventName =
  | "landing_page_viewed"
  | "signup_page_viewed"
  | "signup_completed"
  | "dashboard_onboarding_viewed"
  | "crawl_started"
  | "crawl_completed"
  | "crawl_failed"
  | "generate_profile_started"
  | "generate_profile_succeeded"
  | "generate_profile_failed"
  | "public_profile_viewed"
  | "public_resume_viewed"
  | "profile_share_clicked"
  | "resume_share_clicked"
  | "profile_copy_link_clicked"
  | "resume_copy_link_clicked"
  | "resume_download_clicked";

interface RecordProductEventInput {
  event: ProductEventName;
  metadata?: Record<string, unknown> | null;
  path?: string | null;
  referrer?: string | null;
  userId?: string | null;
}

export async function recordProductEvent(input: RecordProductEventInput) {
  try {
    await prisma.productEvent.create({
      data: {
        event: input.event,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
        path: input.path ?? undefined,
        referrer: input.referrer ?? undefined,
        userId: input.userId ?? undefined,
      },
    });
  } catch (error) {
    console.warn("Product analytics event failed:", error);
  }
}
