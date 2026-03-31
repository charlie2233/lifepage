"use client";

import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { trackClientEvent } from "@/lib/client-analytics";

type TrackedLinkProps = Omit<ComponentPropsWithoutRef<typeof Link>, "href"> & {
  children: ReactNode;
  event: "signup_cta_clicked";
  href: string;
  metadata?: Record<string, string | number | boolean | null | string[]>;
  source?: string;
};

export function TrackedLink({
  children,
  event,
  metadata,
  onClick,
  source,
  ...props
}: TrackedLinkProps) {
  return (
    <Link
      {...props}
      onClick={(currentEvent) => {
        onClick?.(currentEvent);
        void trackClientEvent({
          event,
          metadata,
          source,
        });
      }}
    >
      {children}
    </Link>
  );
}
