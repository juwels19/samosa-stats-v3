"use client";

import { useMultiStepModal } from "@/components/multi-step-modal/use-multi-step-modal";
import { Button, toast } from "@heroui/react";
import { useMutation } from "convex/react";
import { useState } from "react";

import { api } from "../../../../../convex/_generated/api";
import type { Doc } from "../../../../../convex/_generated/dataModel";
import {
  editEventPickSettingsSchema,
  type EditEventModalData,
} from "@/components/events/constants";

export default function EditEventFooter({
  event,
  onOpenChange,
}: {
  event: Doc<"events">;
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
  } = useMultiStepModal<EditEventModalData>();
  const [isSaving, setIsSaving] = useState(false);
  const updatePickSettings = useMutation(api.events.updatePickSettings);
  const canContinueFromPickSettings =
    editEventPickSettingsSchema.safeParse(data).success;
  const canContinueFromCategories = data.selectedCategoryIds.length > 0;
  const canSave = canContinueFromPickSettings && canContinueFromCategories;

  const handleContinue = () => {
    if (currentStepIndex === 0) {
      updateData({ hasSubmittedPickSettings: true });

      if (!canContinueFromPickSettings) {
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
      hasSubmittedPickSettings: true,
      hasSubmittedCategories: true,
    });

    if (!canSave) {
      return;
    }

    setIsSaving(true);

    try {
      await updatePickSettings({
        eventId: event._id,
        numberOfTeamPicks: BigInt(data.numberOfTeamPicks),
        numberOfCategoryPicks: BigInt(data.numberOfCategoryPicks),
        categories: data.selectedCategoryIds,
      });
      toast.success("Event updated", {
        description: `${event.displayName} pick settings have been saved.`,
      });
      onOpenChange(false);
    } catch (error) {
      toast.danger("Event not updated", {
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
          {isSaving ? "Saving" : "Save changes"}
        </Button>
      ) : (
        <Button size="lg" isDisabled={isSaving} onPress={handleContinue}>
          Continue
        </Button>
      )}
    </>
  );
}
