"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { ArrowUpRight, Check, Copy, Download, Share2 } from "lucide-react";
import { trackProductEvent } from "@/lib/analytics-client";
import type { ProductEventName } from "@/lib/product-analytics";

interface PublicShareActionsProps {
  alternateHref: string;
  alternateLabel: string;
  copyEvent: ProductEventName;
  currentViewLabel: string;
  downloadHref?: string;
  mutedColor: string;
  outlineButtonStyle: CSSProperties;
  shareEvent: ProductEventName;
}

export function PublicShareActions({
  alternateHref,
  alternateLabel,
  copyEvent,
  currentViewLabel,
  downloadHref,
  mutedColor,
  outlineButtonStyle,
  shareEvent,
}: PublicShareActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    trackProductEvent(shareEvent, { surface: currentViewLabel });

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          text: `Check out this Atrak Pages ${currentViewLabel}.`,
          url: window.location.href,
        });
        return;
      } catch {
        // Fall through to copy link.
      }
    }

    await handleCopyLink();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      trackProductEvent(copyEvent, { surface: currentViewLabel });
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="mt-4 flex flex-wrap gap-3">
      <button
        type="button"
        onClick={() => void handleShare()}
        className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm"
        style={outlineButtonStyle}
      >
        <Share2 className="h-4 w-4" />
        Share
      </button>
      <button
        type="button"
        onClick={() => void handleCopyLink()}
        className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm"
        style={outlineButtonStyle}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copied" : "Copy link"}
      </button>
      <Link
        href={alternateHref}
        className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm"
        style={outlineButtonStyle}
      >
        {alternateLabel}
        <ArrowUpRight className="h-4 w-4" />
      </Link>
      {downloadHref ? (
        <a
          href={downloadHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm"
          style={outlineButtonStyle}
          onClick={() =>
            trackProductEvent("resume_download_clicked", {
              surface: currentViewLabel,
            })
          }
        >
          <Download className="h-4 w-4" />
          PDF
        </a>
      ) : null}
      <p className="basis-full text-xs" style={{ color: mutedColor }}>
        Share the live page, copy a clean link, or jump straight to the companion
        {` ${alternateLabel.toLowerCase()}.`}
      </p>
    </div>
  );
}
