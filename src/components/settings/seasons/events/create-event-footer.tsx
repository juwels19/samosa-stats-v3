"use client";

import { useMultiStepModal } from "@/components/multi-step-modal/use-multi-step-modal";
import { Button, toast } from "@heroui/react";
import { useMutation } from "convex/react";
import { useState } from "react";

import { api } from "../../../../../convex/_generated/api";
import {
  createEventDetailsSchema,
  type CreateEventModalData,
} from "@/components/events/constants";

export default function CreateEventFooter({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void;
}) {
  const {
    data,
    currentStepIndex,
    isFirstStep,
    isLastStep,
    goToNextStep,
    goToPreviousStep,
    updateData,
  } = useMultiStepModal<CreateEventModalData>();
  const [isSaving, setIsSaving] = useState(false);
  const createEvent = useMutation(api.events.create);
  const canContinueFromLoad =
    createEventDetailsSchema.safeParse(data).success &&
    data.loadedEvent !== null;
  const canContinueFromCategories = data.selectedCategoryIds.length > 0;
  const canSave =
    canContinueFromLoad &&
    canContinueFromCategories &&
    data.loadedEvent !== null;

  const handleContinue = () => {
    if (currentStepIndex === 0) {
      updateData({ hasSubmittedDetails: true });

      if (!canContinueFromLoad) {
        return;
      }
    }

    if (currentStepIndex === 1) {
      updateData({ hasSubmittedCategories: true });

      if (!canContinueFromCategories) {
        return;
      }
    }

    goToNextStep();
  };

  const handleSave = async () => {
    updateData({
      hasSubmittedDetails: true,
      hasSubmittedCategories: true,
    });

    if (!canSave || data.loadedEvent === null) {
      return;
    }

    setIsSaving(true);

    try {
      await createEvent({
        name: data.loadedEvent.name,
        displayName: data.displayName,
        eventCode: data.loadedEvent.eventCode,
        startDate: data.loadedEvent.startDate,
        endDate: data.loadedEvent.endDate,
        numberOfTeamPicks: BigInt(data.numberOfTeamPicks),
        numberOfCategoryPicks: BigInt(data.numberOfCategoryPicks),
        categories: data.selectedCategoryIds,
        teams: data.loadedEvent.teams,
      });
      toast.success("Event saved", {
        description: `${data.displayName.trim()} has been added.`,
      });
      onOpenChange(false);
    } catch (error) {
      toast.danger("Event not saved", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {isFirstStep ? (
        <Button
          size="lg"
          variant="secondary"
          onPress={() => onOpenChange(false)}
        >
          Cancel
        </Button>
      ) : (
        <Button
          size="lg"
          variant="secondary"
          isDisabled={isSaving}
          onPress={goToPreviousStep}
        >
          Back
        </Button>
      )}
      {isLastStep ? (
        <Button size="lg" isPending={isSaving} onPress={handleSave}>
          {isSaving ? "Saving" : "Save event"}
        </Button>
      ) : (
        <Button size="lg" isDisabled={isSaving} onPress={handleContinue}>
          Continue
        </Button>
      )}
    </>
  );
}
