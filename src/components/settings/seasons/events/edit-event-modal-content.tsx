"use client";

import MultiStepModal from "@/components/multi-step-modal/multi-step-modal";
import { useMultiStepModal } from "@/components/multi-step-modal/use-multi-step-modal";
import type { Doc } from "../../../../../convex/_generated/dataModel";

import CategorySelectionStep from "./category-selection-step";
import type { EditEventModalData } from "@/components/events/constants";
import EditEventConfirmationStep from "./edit-event-confirmation-step";
import EditEventFooter from "./edit-event-footer";
import EditEventPickSettingsStep from "./edit-event-pick-settings-step";

type EditEventModalContentProps = {
  event: Doc<"events">;
  globalCategories: Doc<"categories">[];
  seasonCategories: Doc<"categories">[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function EditEventModalContent({
  event,
  globalCategories,
  seasonCategories,
  isOpen,
  onOpenChange,
}: EditEventModalContentProps) {
  const { data } = useMultiStepModal<EditEventModalData>();

  return (
    <MultiStepModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Edit event"
      description="Update pick counts and available categories."
      steps={[
        {
          id: "pick-settings",
          title: "Pick settings",
          description: "Set required pick counts.",
          content: <EditEventPickSettingsStep />,
        },
        {
          id: "categories",
          title: "Categories",
          description: `${data.selectedCategoryIds.length} selected`,
          content: (
            <CategorySelectionStep
              globalCategories={globalCategories}
              seasonCategories={seasonCategories}
            />
          ),
        },
        {
          id: "confirm",
          title: "Confirm",
          description: "Review and save.",
          content: (
            <EditEventConfirmationStep
              event={event}
              categories={[...globalCategories, ...seasonCategories]}
            />
          ),
        },
      ]}
      footer={<EditEventFooter event={event} onOpenChange={onOpenChange} />}
    />
  );
}
