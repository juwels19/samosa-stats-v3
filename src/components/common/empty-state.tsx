import { EmptyState as HeroEmptyState } from "@heroui/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <HeroEmptyState
      className={cn(
        "flex w-full flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border px-6 py-12 text-center text-balance",
        className,
      )}
    >
      {icon ? (
        <div className="flex size-11 items-center justify-center rounded-2xl bg-default text-foreground [&_svg]:size-5">
          {icon}
        </div>
      ) : null}
      <div className="flex max-w-sm flex-col gap-1">
        <h2 className="font-heading text-lg font-semibold">{title}</h2>
        {description ? (
          <p className="text-sm text-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </HeroEmptyState>
  );
}
