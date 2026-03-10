"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";

type BillingInterval = "month" | "year";

interface LandingPricingPlan {
  id: "free" | "plus" | "pro";
  name: string;
  monthlyPriceUsd: number;
  yearlyPriceUsd: number;
  detail: string;
  body: string;
  badge: string;
}

function getPrice(plan: LandingPricingPlan, interval: BillingInterval) {
  return interval === "year" ? plan.yearlyPriceUsd : plan.monthlyPriceUsd;
}

function getSavingsCopy(plan: LandingPricingPlan) {
  if (plan.monthlyPriceUsd === 0 || plan.yearlyPriceUsd === 0) {
    return null;
  }

  const savedAmount = plan.monthlyPriceUsd * 12 - plan.yearlyPriceUsd;
  if (savedAmount <= 0) {
    return null;
  }

  return `Save $${savedAmount}/year`;
}

export function LandingPricing({
  plans,
}: {
  plans: readonly LandingPricingPlan[];
}) {
  const [interval, setInterval] = useState<BillingInterval>("month");

  return (
    <>
      <div className="mb-8 flex justify-center lg:justify-start">
        <div className="inline-flex rounded-2xl border border-white/10 bg-white/4 p-1">
          {(["month", "year"] as const).map((value) => {
            const isActive = interval === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setInterval(value)}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-[#79e5d2] text-[#041117]"
                    : "text-[#d0d8de] hover:text-white"
                }`}
              >
                {value === "year" ? "Yearly" : "Monthly"}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((tier) => {
          const price = getPrice(tier, interval);
          const savingsCopy = interval === "year" ? getSavingsCopy(tier) : null;
          const href =
            tier.id === "free"
              ? "/register"
              : `/upgrade?plan=${tier.id}&interval=${interval}`;

          return (
            <div
              key={tier.id}
              className={`lp-panel card-hover rounded-[1.75rem] p-6 ${
                tier.id === "plus"
                  ? "animate-pulse-glow border-[#79e5d2]/35 bg-[linear-gradient(180deg,rgba(121,229,210,0.14),rgba(255,255,255,0.03))]"
                  : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-[#f7f1e8]">
                    {tier.name}
                  </p>
                  <p className="mt-2 brand-display text-5xl tracking-tight text-[#f8f3ea]">
                    {price === 0 ? "$0" : `$${price}`}
                    <span className="ml-1 text-base font-medium text-[#95a2ac]">
                      {tier.id === "free" ? "" : interval === "year" ? "/yr" : "/mo"}
                    </span>
                  </p>
                  {savingsCopy && (
                    <p className="mt-2 text-xs font-medium text-[#79e5d2]">
                      {savingsCopy}
                    </p>
                  )}
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-xs ${
                    tier.id === "plus"
                      ? "border-[#79e5d2]/35 bg-[#79e5d2]/12 text-[#79e5d2]"
                      : "border-white/10 bg-white/5 text-[#cbd3d9]"
                  }`}
                >
                  {tier.badge}
                </span>
              </div>
              <p className="mt-8 text-sm font-medium text-[#f8f1e8]">
                {tier.detail}
              </p>
              <p className="mt-3 text-sm leading-7 text-[#97a4ae]">
                {tier.body}
              </p>
              {tier.id !== "free" && interval === "year" && (
                <p className="mt-4 text-xs text-[#95a2ac]">
                  Billed yearly. Credits still refresh monthly.
                </p>
              )}
              <Link
                href={href}
                className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition ${
                  tier.id === "plus"
                    ? "bg-[#79e5d2] text-[#041117] hover:bg-[#8deedb]"
                    : tier.id === "pro"
                      ? "bg-white text-[#041117] hover:bg-[#f2f2f2]"
                      : "border border-white/10 bg-white/5 text-white hover:border-white/20 hover:bg-white/8"
                }`}
              >
                {tier.id === "free" ? "Start free" : `Choose ${tier.name}`}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          );
        })}
      </div>
    </>
  );
}
