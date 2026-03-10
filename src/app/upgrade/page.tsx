"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle, TriangleAlert } from "lucide-react";

type PaidPlanTier = "plus" | "pro";
type BillingInterval = "month" | "year";

function isPaidPlanTier(value: string | null): value is PaidPlanTier {
  return value === "plus" || value === "pro";
}

function isBillingInterval(value: string | null): value is BillingInterval {
  return value === "month" || value === "year";
}

function UpgradePageContent() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  const selection = useMemo(() => {
    const plan = searchParams.get("plan");
    const interval = searchParams.get("interval");

    if (!isPaidPlanTier(plan) || !isBillingInterval(interval)) {
      return null;
    }

    return { plan, interval };
  }, [searchParams]);

  useEffect(() => {
    if (!selection) {
      setError("Invalid billing selection. Choose a Plus or Pro plan first.");
      return;
    }

    if (status === "loading") {
      return;
    }

    if (status === "unauthenticated") {
      const callbackUrl = `/upgrade?plan=${selection.plan}&interval=${selection.interval}`;
      router.replace(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }

    let cancelled = false;

    const startCheckout = async () => {
      try {
        const res = await fetch("/api/billing/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(selection),
        });
        const data = (await res.json()) as {
          url?: string;
          checkoutUrl?: string;
          error?: string;
        };
        const checkoutUrl = data.checkoutUrl ?? data.url;
        if (!res.ok || !checkoutUrl) {
          throw new Error(data.error ?? "Unable to start Stripe checkout.");
        }
        if (!cancelled) {
          window.location.href = checkoutUrl;
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(
            nextError instanceof Error
              ? nextError.message
              : "Unable to start Stripe checkout."
          );
        }
      }
    };

    void startCheckout();
    return () => {
      cancelled = true;
    };
  }, [router, selection, status]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080e12] px-4">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-orb-float absolute -top-20 left-[10%] h-[24rem] w-[24rem] rounded-full bg-[#79e5d2]/10 blur-[110px]" />
        <div className="animate-orb-float-alt absolute bottom-[10%] right-[8%] h-[20rem] w-[20rem] rounded-full bg-[#8fa9ff]/12 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-lg rounded-[1.75rem] border border-white/10 bg-[rgba(14,22,28,0.88)] p-8 text-white shadow-[0_32px_80px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
        {error ? (
          <>
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300">
              <TriangleAlert className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-semibold">Billing setup blocked</h1>
            <p className="mt-3 text-sm leading-7 text-gray-300">{error}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/dashboard#settings-billing"
                className="rounded-xl bg-[#00f5ff] px-4 py-2.5 text-sm font-semibold text-black hover:bg-[#00e5ef]"
              >
                Back to billing
              </Link>
              <Link
                href="/"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white hover:border-white/20 hover:bg-white/8"
              >
                Back home
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#79e5d2]/25 bg-[#79e5d2]/10 text-[#79e5d2]">
              <LoaderCircle className="h-6 w-6 animate-spin" />
            </div>
            <h1 className="mt-5 text-2xl font-semibold">
              Redirecting to Stripe
            </h1>
            <p className="mt-3 text-sm leading-7 text-gray-300">
              We&apos;re opening secure checkout for your {selection?.plan ?? "paid"}{" "}
              plan on the {selection?.interval === "year" ? "yearly" : "monthly"}{" "}
              interval.
            </p>
            <p className="mt-6 text-xs text-gray-500">
              If nothing happens, go back to the dashboard billing section and
              try again.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function UpgradePageFallback() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080e12] px-4">
      <div className="text-sm text-gray-300">Loading billing…</div>
    </div>
  );
}

export default function UpgradePage() {
  return (
    <Suspense fallback={<UpgradePageFallback />}>
      <UpgradePageContent />
    </Suspense>
  );
}
