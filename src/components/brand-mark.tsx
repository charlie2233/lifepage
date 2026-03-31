import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface BrandMarkProps {
  className?: string;
  glyphClassName?: string;
  style?: CSSProperties;
}

export function BrandMark({
  className,
  glyphClassName,
  style,
}: BrandMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex items-center justify-center overflow-hidden",
        className
      )}
      style={style}
    >
      <svg
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("h-[68%] w-[68%]", glyphClassName)}
        fill="none"
      >
        <path
          d="M50 15C34.12 15 20.57 25.31 15 39.62C23.37 33.41 35.06 31.38 45.27 35.05C55.48 38.71 63.59 47.63 66.22 58.15C68.85 68.67 65.65 79.75 58.18 87.38C73.18 83.82 84.96 71.56 84.96 56.07C84.96 33.38 66.57 15 43.89 15H50Z"
          fill="currentColor"
          opacity="0.92"
        />
        <path
          d="M50 85C65.88 85 79.43 74.69 85 60.38C76.63 66.59 64.94 68.62 54.73 64.95C44.52 61.29 36.41 52.37 33.78 41.85C31.15 31.33 34.35 20.25 41.82 12.62C26.82 16.18 15.04 28.44 15.04 43.93C15.04 66.62 33.43 85 56.11 85H50Z"
          fill="currentColor"
          opacity="0.76"
        />
        <circle cx="50" cy="50" r="11.5" fill="currentColor" />
      </svg>
    </span>
  );
}
