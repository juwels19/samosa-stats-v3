"use client";

import { useMultiStepModal } from "@/components/multi-step-modal/use-multi-step-modal";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { CheckIcon } from "lucide-react";
import type { Doc } from "../../../../../convex/_generated/dataModel";

import type { CreateEventModalData } from "./constants";
import { formatEventDate } from "./format-event-date";

export default function ConfirmationStep({
  categories,
}: {
  categories: Doc<"categories">[];
}) {
  const { data } = useMultiStepModal<CreateEventModalData>();
  const selectedCategories = categories.filter((category) =>
    data.selectedCategoryIds.includes(category._id),
  );

  return (
    <div className="flex flex-col gap-4">
      <Item
        variant="outline"
        className="rounded-3xl border-green-200 bg-green-100 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-100"
      >
        <CheckIcon />
        <ItemContent>
          <ItemTitle>{data.displayName || "Display name"}</ItemTitle>
          <ItemDescription className="text-green-700 dark:text-green-300">
            {data.loadedEvent
              ? `${data.loadedEvent.name} (${data.loadedEvent.eventCode})`
              : "No event loaded."}
          </ItemDescription>
        </ItemContent>
      </Item>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-3xl border bg-secondary/40 p-4">
          <dt className="text-sm text-muted-foreground">Dates</dt>
          <dd className="font-medium">
            {data.loadedEvent
              ? `${formatEventDate(data.loadedEvent.startDate)} - ${formatEventDate(data.loadedEvent.endDate)}`
              : "Not loaded"}
          </dd>
        </div>
        <div className="rounded-3xl border bg-secondary/40 p-4">
          <dt className="text-sm text-muted-foreground">Pick counts</dt>
          <dd className="font-medium">
            {data.numberOfTeamPicks || "0"} teams,{" "}
            {data.numberOfCategoryPicks || "0"} categories
          </dd>
        </div>
      </dl>
      <section className="rounded-3xl border bg-secondary/40 p-4">
        <h3 className="font-heading font-medium">Selected categories</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {selectedCategories.length} categories will be available for this event.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedCategories.map((category) => (
            <span
              key={category._id}
              className="rounded-full bg-background px-3 py-1 text-sm"
            >
              {category.text}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
