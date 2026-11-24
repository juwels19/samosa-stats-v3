"use client";

import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type PickSelectionGridItem = {
  id: string;
  label: string;
  detail?: string;
};

/**
 * Tappable tiles. Each tile is a toggle button, so it has a large touch
 * target and announces its state with aria-pressed.
 */
export default function PickSelectionGrid({
  items,
  selectedIds,
  selectionFull,
  readOnly = false,
  layout = "grid",
  onToggle,
}: {
  items: PickSelectionGridItem[];
  selectedIds: string[];
  selectionFull: boolean;
  readOnly?: boolean;
  layout?: "grid" | "list";
  onToggle: (id: string) => void;
}) {
  const selectedIdSet = new Set(selectedIds);

  return (
    <ul
      className={cn(
        "grid gap-2",
        layout === "grid"
          ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4"
          : "grid-cols-1",
      )}
    >
      {items.map((item) => {
        const selected = selectedIdSet.has(item.id);
        const disabled = readOnly || (!selected && selectionFull);

        return (
          <li key={item.id} className="flex">
            <button
              type="button"
              aria-pressed={selected}
              title={layout === "grid" && item.detail ? `${item.label} ${item.detail}` : undefined}
              disabled={disabled}
              onClick={() => onToggle(item.id)}
              className={cn(
                "flex min-h-14 w-full flex-1 items-start gap-3 rounded-2xl border border-border bg-surface p-3 text-left transition-[background-color,border-color,transform] duration-150 ease-out",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                "enabled:active:scale-[0.97] enabled:hover:bg-surface-hover",
                selected && "border-accent bg-accent-soft enabled:hover:bg-accent-soft-hover",
                disabled && !selected && "opacity-45",
                readOnly && "cursor-default",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border border-border-tertiary transition-colors",
                  selected && "border-accent bg-accent text-accent-foreground",
                )}
              >
                {selected ? <CheckIcon className="size-3.5" strokeWidth={3} /> : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm leading-tight font-semibold">
                  {item.label}
                </span>
                {item.detail ? (
                  <span
                    className={cn(
                      "mt-0.5 block text-xs leading-snug text-muted",
                      layout === "grid" ? "truncate" : "line-clamp-2",
                    )}
                  >
                    {item.detail}
                  </span>
                ) : null}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
