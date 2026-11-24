"use client";

import { useMultiStepModal } from "@/components/multi-step-modal/use-multi-step-modal";
import type { Doc } from "../../../../../convex/_generated/dataModel";

import type { EditEventModalData } from "@/components/events/constants";
import { formatEventDate } from "@/components/events/utils";
import EventSetupSummary from "./event-setup-summary";

export default function EditEventConfirmationStep({
  event,
  categories,
}: {
  event: Doc<"events">;
  categories: Doc<"categories">[];
}) {
  const { data } = useMultiStepModal<EditEventModalData>();
  const selectedCategories = categories.filter((category) =>
    data.selectedCategoryIds.includes(category._id),
  );

  return (
    <EventSetupSummary
      title={event.displayName}
      subtitle={`${event.name} (${event.eventCode})`}
      dates={`${formatEventDate(event.startDate)} to ${formatEventDate(event.endDate)}`}
      numberOfTeamPicks={data.numberOfTeamPicks}
      numberOfCategoryPicks={data.numberOfCategoryPicks}
      selectedCategories={selectedCategories}
    />
  );
}
