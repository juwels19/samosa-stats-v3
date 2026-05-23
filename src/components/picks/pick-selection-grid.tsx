"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export type PickSelectionGridItem = {
  id: string;
  label: string;
  detail?: string;
};

export default function PickSelectionGrid({
  items,
  selectedIds,
  selectionFull,
  idPrefix,
  readOnly = false,
  onToggle,
}: {
  items: PickSelectionGridItem[];
  selectedIds: string[];
  selectionFull: boolean;
  idPrefix: string;
  readOnly?: boolean;
  onToggle: (id: string) => void;
}) {
  const selectedIdSet = new Set(selectedIds);

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => {
        const checked = selectedIdSet.has(item.id);
        const disabled = readOnly || (!checked && selectionFull);

        return (
          <label
            key={item.id}
            htmlFor={`${idPrefix}-${item.id}`}
            data-selected={checked}
            data-disabled={disabled}
            className={cn(
              "flex items-start gap-2 rounded-2xl border bg-muted/50 p-2.5 text-left transition-colors data-[selected=true]:border-primary/40 data-[selected=true]:bg-primary/20",
              readOnly ? "cursor-default" : "cursor-pointer",
              disabled && "cursor-not-allowed opacity-50",
            )}
          >
            <Checkbox
              id={`${idPrefix}-${item.id}`}
              className="mt-0.5 shrink-0"
              checked={checked}
              disabled={disabled}
              onCheckedChange={() => {
                if (!readOnly) {
                  onToggle(item.id);
                }
              }}
            />
            <span className="min-w-0 flex-1">
              <span className="block text-sm leading-tight font-medium">
                {item.label}
              </span>
              {item.detail ? (
                <span className="mt-0.5 block line-clamp-2 text-xs leading-snug text-muted-foreground">
                  {item.detail}
                </span>
              ) : null}
            </span>
          </label>
        );
      })}
    </div>
  );
}
