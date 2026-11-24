"use client";

import { useMultiStepModal } from "@/components/multi-step-modal/use-multi-step-modal";
import type { Doc } from "../../../../../convex/_generated/dataModel";

import type { CreateEventModalData } from "@/components/events/constants";
import { formatEventDate } from "@/components/events/utils";
import EventSetupSummary from "./event-setup-summary";

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
    <EventSetupSummary
      title={data.displayName || "Display name"}
      subtitle={
        data.loadedEvent
          ? `${data.loadedEvent.name} (${data.loadedEvent.eventCode})`
          : "No event loaded."
      }
      dates={
        data.loadedEvent
          ? `${formatEventDate(data.loadedEvent.startDate)} to ${formatEventDate(data.loadedEvent.endDate)}`
          : "Not loaded"
      }
      numberOfTeamPicks={data.numberOfTeamPicks}
      numberOfCategoryPicks={data.numberOfCategoryPicks}
      selectedCategories={selectedCategories}
    />
  );
}
