import type { ReactNode } from "react";

/** One numbered step of a category's scoring setup. */
export default function ScoringStep({
  number,
  title,
  description,
  children,
}: {
  number: number;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-border p-4 sm:p-6" aria-labelledby={`step-${number}`}>
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent-soft-foreground tabular-nums"
        >
          {number}
        </span>
        <div className="flex flex-col gap-0.5">
          <h2 id={`step-${number}`} className="font-semibold">
            {title}
          </h2>
          <p className="text-sm text-muted">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
