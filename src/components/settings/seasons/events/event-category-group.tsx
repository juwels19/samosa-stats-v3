"use client";

import { useMultiStepModal } from "@/components/multi-step-modal/use-multi-step-modal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import type { Doc } from "../../../../../convex/_generated/dataModel";

import type { CreateEventModalData } from "./constants";

export default function EventCategoryGroup({
  title,
  categories,
}: {
  title: string;
  categories: Doc<"categories">[];
}) {
  const { data, updateData } = useMultiStepModal<CreateEventModalData>();
  const selectedCategoryIds = new Set(data.selectedCategoryIds);
  const allCategoriesSelected =
    categories.length > 0 &&
    categories.every((category) => selectedCategoryIds.has(category._id));

  return (
    <section className="rounded-4xl border bg-background/60 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-heading font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">
            {categories.length} available
          </p>
        </div>
        <Button
          type="button"
          size="xs"
          variant="secondary"
          disabled={categories.length === 0}
          onClick={() => {
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
          {allCategoriesSelected ? "Deselect all" : "Select all"}
        </Button>
      </div>
      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">No categories yet.</p>
      ) : (
        <ItemGroup className="max-h-80 overflow-y-auto">
          {categories.map((category) => {
            const checked = selectedCategoryIds.has(category._id);

            return (
              <Item
                key={category._id}
                asChild
                variant="muted"
                data-selected={checked}
                className="cursor-pointer items-start rounded-3xl border p-4 data-[selected=true]:border-primary/40 data-[selected=true]:bg-primary/20"
              >
                <label htmlFor={`create-event-category-${category._id}`}>
                  <Checkbox
                    id={`create-event-category-${category._id}`}
                    className="mt-0.5"
                    checked={checked}
                    onCheckedChange={(nextChecked) => {
                      const nextCategoryIds = new Set(data.selectedCategoryIds);

                      if (nextChecked === true) {
                        nextCategoryIds.add(category._id);
                      } else {
                        nextCategoryIds.delete(category._id);
                      }

                      updateData({
                        selectedCategoryIds: Array.from(nextCategoryIds),
                      });
                    }}
                  />
                  <ItemContent>
                    <ItemTitle>{category.text}</ItemTitle>
                    <ItemDescription>
                      {category.scoringDescription}
                    </ItemDescription>
                  </ItemContent>
                </label>
              </Item>
            );
          })}
        </ItemGroup>
      )}
    </section>
  );
}
