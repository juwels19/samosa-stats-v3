"use client";

import { useMultiStepModal } from "@/components/multi-step-modal/use-multi-step-modal";
import { Button, Checkbox, Description } from "@heroui/react";
import type { Doc } from "../../../../../convex/_generated/dataModel";

import type {
  CreateEventModalData,
  EditEventModalData,
} from "@/components/events/constants";

type EventCategorySelectionModalData =
  | CreateEventModalData
  | EditEventModalData;

export default function EventCategoryGroup({
  title,
  categories,
}: {
  title: string;
  categories: Doc<"categories">[];
}) {
  const { data, updateData } =
    useMultiStepModal<EventCategorySelectionModalData>();
  const selectedCategoryIds = new Set(data.selectedCategoryIds);
  const selectedInGroup = categories.filter((category) =>
    selectedCategoryIds.has(category._id),
  ).length;
  const allCategoriesSelected =
    categories.length > 0 && selectedInGroup === categories.length;

  function setCategorySelected(categoryId: Doc<"categories">["_id"], selected: boolean) {
    const nextCategoryIds = new Set(data.selectedCategoryIds);

    if (selected) {
      nextCategoryIds.add(categoryId);
    } else {
      nextCategoryIds.delete(categoryId);
    }

    updateData({ selectedCategoryIds: Array.from(nextCategoryIds) });
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-heading font-semibold">{title}</h3>
          <p className="text-sm text-muted tabular-nums">
            {selectedInGroup} of {categories.length} selected
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          isDisabled={categories.length === 0}
          onPress={() => {
            const nextCategoryIds = new Set(data.selectedCategoryIds);

            for (const category of categories) {
              if (allCategoriesSelected) {
                nextCategoryIds.delete(category._id);
              } else {
                nextCategoryIds.add(category._id);
              }
            }

            updateData({ selectedCategoryIds: Array.from(nextCategoryIds) });
          }}
        >
          {allCategoriesSelected ? "Clear all" : "Select all"}
        </Button>
      </div>
      {categories.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted">
          No categories yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {categories.map((category) => (
            <li key={category._id}>
              <Checkbox
                id={`event-category-${category._id}`}
                variant="secondary"
                className="w-full"
                isSelected={selectedCategoryIds.has(category._id)}
                onChange={(selected) =>
                  setCategorySelected(category._id, selected)
                }
              >
                <Checkbox.Content className="flex min-h-14 w-full cursor-pointer items-start gap-3 rounded-2xl border border-border bg-surface p-3.5 transition-colors data-[selected=true]:border-accent data-[selected=true]:bg-accent-soft">
                  <Checkbox.Control className="mt-0.5 shrink-0">
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-sm font-medium">{category.text}</span>
                    {category.scoringDescription ? (
                      <Description className="text-xs">
                        {category.scoringDescription}
                      </Description>
                    ) : null}
                  </span>
                </Checkbox.Content>
              </Checkbox>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
