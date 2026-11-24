"use client";

import type { Id } from "../../../convex/_generated/dataModel";
import PickSection from "./pick-section";
import PickSelectionGrid from "./pick-selection-grid";
import type { PickSubmissionCategory } from "./pick-submission-types";

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
  return (
    <PickSection
      id="categories"
      title="Categories"
      selectedCount={selectedCategoryIds.length}
      requiredCount={requiredCategoryCount}
    >
      <PickSelectionGrid
        layout="list"
        items={categories.map((category) => ({
          id: category._id,
          label: category.text,
          detail: category.scoringDescription || undefined,
        }))}
        selectedIds={selectedCategoryIds}
        selectionFull={selectedCategoryIds.length >= requiredCategoryCount}
        readOnly={readOnly}
        onToggle={(categoryId) =>
          onToggleCategory(categoryId as Id<"categories">)
        }
      />
    </PickSection>
  );
}
