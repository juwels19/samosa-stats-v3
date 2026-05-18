"use client";

import MultiStepModalProvider from "@/components/multi-step-modal/multi-step-modal-provider";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PlusIcon } from "lucide-react";
import { useMemo, useState } from "react";

import type { Doc } from "../../../../../convex/_generated/dataModel";
import { EVENT_MODAL_STEP_COUNT, type CreateEventModalData } from "./constants";
import CreateEventModalContent from "./create-event-modal-content";

type CreateEventProps = {
  activeSeason: Doc<"seasons"> | null;
  globalCategories: Doc<"categories">[];
  seasonCategories: Doc<"categories">[];
};

export default function CreateEvent({
  activeSeason,
  globalCategories,
  seasonCategories,
}: CreateEventProps) {
  const [open, setOpen] = useState(false);
  const allCategories = useMemo(
    () => [...globalCategories, ...seasonCategories],
    [globalCategories, seasonCategories],
  );
  const initialData = useMemo<CreateEventModalData>(
    () => ({
      eventCode: "",
      displayName: "",
      numberOfTeamPicks: "",
      numberOfCategoryPicks: "",
      loadedEvent: null,
      selectedCategoryIds: allCategories.map((category) => category._id),
      hasSubmittedDetails: false,
      hasSubmittedCategories: false,
    }),
    [allCategories],
  );

  return (
    <MultiStepModalProvider
      key={open ? "event-modal-open" : "event-modal-closed"}
      initialData={initialData}
      totalSteps={EVENT_MODAL_STEP_COUNT}
    >
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button disabled={activeSeason === null}>
            Add event
            <PlusIcon data-icon="inline-end" />
          </Button>
        </AlertDialogTrigger>
        <CreateEventModalContent
          activeSeason={activeSeason}
          globalCategories={globalCategories}
          seasonCategories={seasonCategories}
          onOpenChange={setOpen}
        />
      </AlertDialog>
    </MultiStepModalProvider>
  );
}
