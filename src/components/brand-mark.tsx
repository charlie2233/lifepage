import type { SVGProps } from "react";

export function BrandMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <rect
        x="11"
        y="11"
        width="42"
        height="42"
        rx="16"
        fill="currentColor"
        fillOpacity="0.16"
      />
      <path
        d="M18 38.5C18 30.492 24.492 24 32.5 24H46"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M18 43C22.8 43 26.7 39.1 26.7 34.3V18"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="45.5" cy="24" r="4.5" fill="currentColor" />
    </svg>
  );
}
