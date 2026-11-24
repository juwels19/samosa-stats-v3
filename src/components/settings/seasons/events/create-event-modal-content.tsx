"use client";

import MultiStepModal from "@/components/multi-step-modal/multi-step-modal";
import { useMultiStepModal } from "@/components/multi-step-modal/use-multi-step-modal";
import type { Doc } from "../../../../../convex/_generated/dataModel";

import CategorySelectionStep from "./category-selection-step";
import ConfirmationStep from "./confirmation-step";
import type { CreateEventModalData } from "@/components/events/constants";
import CreateEventFooter from "./create-event-footer";
import LoadEventStep from "./load-event-step";

type CreateEventModalContentProps = {
  activeSeason: Doc<"seasons"> | null;
  globalCategories: Doc<"categories">[];
  seasonCategories: Doc<"categories">[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function CreateEventModalContent({
  activeSeason,
  globalCategories,
  seasonCategories,
  isOpen,
  onOpenChange,
}: CreateEventModalContentProps) {
  const { data } = useMultiStepModal<CreateEventModalData>();

  return (
    <MultiStepModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Add event"
      description="Load event details, choose categories, and confirm the setup."
      steps={[
        {
          id: "load-event",
          title: "Load event",
          description: "Find the official event.",
          content: <LoadEventStep activeSeason={activeSeason} />,
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
            <ConfirmationStep
              categories={[...globalCategories, ...seasonCategories]}
            />
          ),
        },
      ]}
      footer={<CreateEventFooter onOpenChange={onOpenChange} />}
    />
  );
}
