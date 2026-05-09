import type * as React from "react";

import { cn } from "@/lib/utils";

type DotMatrixLoaderProps = React.ComponentPropsWithoutRef<"svg"> & {
  label?: string;
};

const baseDots = [
  [6, 6],
  [17, 6],
  [28, 6],
  [39, 6],
  [50, 6],
  [6, 17],
  [17, 17],
  [28, 17],
  [39, 17],
  [50, 17],
  [6, 28],
  [17, 28],
  [28, 28],
  [39, 28],
  [50, 28],
  [6, 39],
  [17, 39],
  [28, 39],
  [39, 39],
  [50, 39],
  [6, 50],
  [17, 50],
  [28, 50],
  [39, 50],
  [50, 50],
] as const;

const sweepDots = [
  [6, 6, 0],
  [17, 6, 125],
  [28, 6, 250],
  [39, 6, 375],
  [50, 6, 500],
  [50, 17, 625],
  [50, 28, 750],
  [50, 39, 875],
  [50, 50, 1000],
  [39, 50, 1125],
  [28, 50, 1250],
  [17, 50, 1375],
  [6, 50, 1500],
  [6, 39, 1625],
  [6, 28, 1750],
  [6, 17, 1875],
] as const;

function DotMatrixLoader({
  className,
  label = "Loading",
  ...props
}: DotMatrixLoaderProps) {
  return (
    <svg
      data-slot="dot-matrix-loader"
      viewBox="0 0 56 56"
      role={label ? "img" : undefined}
      aria-hidden={label ? undefined : true}
      aria-label={label || undefined}
      className={cn("size-14 text-primary", className)}
      {...props}
    >
      {label ? <title>{label}</title> : null}
      <desc>A trailing spinner sweeps the outer ring.</desc>
      <style>
        {`
          .dot-matrix-loader__sweep {
            opacity: 0;
            animation: dot-matrix-loader-sweep 2000ms linear infinite both;
          }

          @keyframes dot-matrix-loader-sweep {
            0% { opacity: 0; }
            4% { opacity: 1; }
            26% { opacity: 0.08; }
            100% { opacity: 0; }
          }

          @media (prefers-reduced-motion: reduce) {
            .dot-matrix-loader__sweep {
              animation: none;
              opacity: 0.45;
            }
          }
        `}
      </style>
      {baseDots.map(([cx, cy]) => (
        <circle
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r="2.4"
          fill="currentColor"
          opacity="0.12"
        />
      ))}
      {sweepDots.map(([cx, cy, delay]) => (
        <circle
          key={`${cx}-${cy}-${delay}`}
          className="dot-matrix-loader__sweep"
          cx={cx}
          cy={cy}
          r="3.1"
          fill="currentColor"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </svg>
  );
}

export { DotMatrixLoader };
