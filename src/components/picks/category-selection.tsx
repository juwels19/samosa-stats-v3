"use client";

import type { Id } from "../../../convex/_generated/dataModel";
import PickSelectionGrid from "./pick-selection-grid";
import type { PickSubmissionCategory } from "./pick-submission-types";
import {
  Card,
  CardAction,
  CardTitle,
  CardHeader,
  CardContent,
} from "@/components/ui/card";

export default function CategorySelection({
  categories,
  selectedCategoryIds,
  requiredCategoryCount,
  readOnly = false,
  onToggleCategory,
}: {
  categories: PickSubmissionCategory[];
  selectedCategoryIds: Id<"categories">[];
  requiredCategoryCount: number;
  readOnly?: boolean;
  onToggleCategory: (categoryId: Id<"categories">) => void;
}) {
  const selectionFull = selectedCategoryIds.length >= requiredCategoryCount;

  return (
    <Card className="bg-background/60">
      <CardHeader>
        <CardTitle>Categories</CardTitle>
        <CardAction className="shrink-0 rounded-full bg-secondary px-3 py-1 text-sm font-medium">
          {selectedCategoryIds.length} / {requiredCategoryCount}
        </CardAction>
      </CardHeader>
      <CardContent>
        <PickSelectionGrid
          items={categories.map((category) => ({
            id: category._id,
            label: category.text,
          }))}
          selectedIds={selectedCategoryIds}
          selectionFull={selectionFull}
          idPrefix="pick-category"
          readOnly={readOnly}
          onToggle={(categoryId) =>
            onToggleCategory(categoryId as Id<"categories">)
          }
        />
      </CardContent>
    </Card>
  );
}
