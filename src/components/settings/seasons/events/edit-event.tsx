"use client";

import MultiStepModalProvider from "@/components/multi-step-modal/multi-step-modal-provider";
import { useMemo } from "react";

import type { Doc } from "../../../../../convex/_generated/dataModel";
import {
  EDIT_EVENT_MODAL_STEP_COUNT,
  type EditEventModalData,
} from "@/components/events/constants";
import EditEventModalContent from "./edit-event-modal-content";

type EditEventProps = {
  event: Doc<"events">;
  globalCategories: Doc<"categories">[];
  seasonCategories: Doc<"categories">[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

/** Edit steps for one event. Opened from the row menu in the events table. */

export default function EditEvent({
  event,
  globalCategories,
  seasonCategories,
  isOpen,
  onOpenChange,
}: EditEventProps) {
  const initialData = useMemo<EditEventModalData>(
    () => ({
      numberOfTeamPicks: event.numberOfTeamPicks.toString(),
      numberOfCategoryPicks: event.numberOfCategoryPicks.toString(),
      selectedCategoryIds: event.categories,
      hasSubmittedPickSettings: false,
      hasSubmittedCategories: false,
    }),
    [event],
  );

  return (
    <MultiStepModalProvider
      key={
        isOpen ? `edit-event-modal-open-${event._id}` : "edit-event-modal-closed"
      }
      initialData={initialData}
      totalSteps={EDIT_EVENT_MODAL_STEP_COUNT}
    >
      <EditEventModalContent
        event={event}
        globalCategories={globalCategories}
        seasonCategories={seasonCategories}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
      />
    </MultiStepModalProvider>
  );
}
