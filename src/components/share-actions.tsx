"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { trackClientEvent } from "@/lib/client-analytics";

interface ShareActionsProps {
  className?: string;
  shareText?: string;
  shareTitle: string;
  shareUrl: string;
  source: string;
  variant?: "light" | "dark";
}

export function ShareActions({
  className,
  shareText,
  shareTitle,
  shareUrl,
  source,
  variant = "dark",
}: ShareActionsProps) {
  const [copied, setCopied] = useState(false);
  const canNativeShare = useMemo(
    () => typeof navigator !== "undefined" && typeof navigator.share === "function",
    []
  );

  const baseClassName =
    variant === "light"
      ? "border border-black/10 bg-black/[0.03] text-[#12202a] hover:bg-black/[0.06]"
      : "border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.07]";

  async function trackShare(method: "copy" | "native") {
    await trackClientEvent({
      event: "public_profile_shared",
      metadata: {
        method,
      },
      source,
    });
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      await trackShare("copy");
    } catch {
      setCopied(false);
    }
  }

  async function handleNativeShare() {
    if (!canNativeShare) {
      return handleCopy();
    }

    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      });
      await trackShare("native");
    } catch {
      return undefined;
    }
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className ?? ""}`}>
      <button
        type="button"
        onClick={handleCopy}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm ${baseClassName}`}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copied" : "Copy link"}
      </button>
      <button
        type="button"
        onClick={handleNativeShare}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm ${baseClassName}`}
      >
        <Share2 className="h-4 w-4" />
        Share
      </button>
    </div>
  );
}
