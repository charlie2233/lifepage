import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { verifyCustomDomainDns } from "@/lib/domain-verification";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.publicPageSettings.findUnique({
    where: { userId: session.user.id },
  });

  if (!settings?.customDomainNormalized) {
    return NextResponse.json(
      { error: "Save a custom domain first." },
      { status: 400 }
    );
  }

  try {
    const verification = await verifyCustomDomainDns(
      settings.customDomainNormalized
    );
    const nextStatus = verification.ok ? "verified" : "error";

    const updated = await prisma.publicPageSettings.update({
      where: { userId: session.user.id },
      data: {
        customDomainStatus: nextStatus,
        customDomainVerificationName: verification.verification.name,
        customDomainVerificationValue: verification.verification.value,
        customDomainLastCheckedAt: new Date(),
        customDomainError: verification.ok ? null : verification.error,
      },
    });

    return NextResponse.json({
      settings: updated,
      verified: verification.ok,
      error: verification.ok ? null : verification.error,
    });
  } catch (error) {
    const updated = await prisma.publicPageSettings.update({
      where: { userId: session.user.id },
      data: {
        customDomainStatus: "error",
        customDomainLastCheckedAt: new Date(),
        customDomainError:
          error instanceof Error ? error.message : "Domain verification failed.",
      },
    });

    return NextResponse.json(
      {
        settings: updated,
        verified: false,
        error:
          error instanceof Error ? error.message : "Domain verification failed.",
      },
      { status: 400 }
    );
  }
}
