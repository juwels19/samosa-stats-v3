import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function PickSection({
  id,
  title,
  selectedCount,
  requiredCount,
  toolbar,
  children,
}: {
  id: string;
  title: string;
  selectedCount: number;
  requiredCount: number;
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  const complete = selectedCount === requiredCount;

  return (
    <section
      aria-labelledby={`${id}-heading`}
      className="flex scroll-mt-(--nav-height) flex-col gap-3"
      id={id}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id={`${id}-heading`} className="font-heading text-lg font-semibold">
          {title}
        </h2>
        <span
          className={cn(
            "rounded-full bg-default px-3 py-1 text-sm font-medium tabular-nums",
            complete && "bg-success-soft text-success-soft-foreground",
          )}
        >
          {selectedCount} / {requiredCount}
        </span>
      </div>
      {toolbar}
      {children}
    </section>
  );
}
