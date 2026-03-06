import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  AI_PROVIDER_DEFINITIONS,
  AI_PROVIDERS,
  AI_USAGE_RATE_DEFINITIONS,
  AI_USAGE_RATES,
  getBillingSnapshot,
  PLAN_DEFINITIONS,
  PLAN_TIERS,
  updateUserBilling,
} from "@/lib/billing";
import { z } from "zod";

const PatchSchema = z.object({
  planTier: z.enum(PLAN_TIERS).optional(),
  aiProvider: z.enum(AI_PROVIDERS).optional(),
  preferredAiModel: z.union([z.string().max(120), z.null()]).optional(),
  aiUsageRate: z.enum(AI_USAGE_RATES).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const billing = await getBillingSnapshot(session.user.id);
  return NextResponse.json({
    billing,
    plans: Object.values(PLAN_DEFINITIONS),
    providers: Object.values(AI_PROVIDER_DEFINITIONS),
    usageRates: Object.values(AI_USAGE_RATE_DEFINITIONS),
  });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as unknown;
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid plan selection." }, { status: 400 });
  }

  if (
    parsed.data.planTier === undefined &&
    parsed.data.aiProvider === undefined &&
    parsed.data.aiUsageRate === undefined &&
    !Object.prototype.hasOwnProperty.call(parsed.data, "preferredAiModel")
  ) {
    return NextResponse.json({ error: "No billing changes provided." }, { status: 400 });
  }

  try {
    const billing = await updateUserBilling(session.user.id, {
      planTier: parsed.data.planTier,
      aiProvider: parsed.data.aiProvider,
      preferredAiModel: parsed.data.preferredAiModel,
      aiUsageRate: parsed.data.aiUsageRate,
    });
    return NextResponse.json({
      billing,
      plans: Object.values(PLAN_DEFINITIONS),
      providers: Object.values(AI_PROVIDER_DEFINITIONS),
      usageRates: Object.values(AI_USAGE_RATE_DEFINITIONS),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update billing settings.",
      },
      { status: 400 }
    );
  }
}
