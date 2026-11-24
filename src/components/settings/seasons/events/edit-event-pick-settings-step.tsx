"use client";

import { useMultiStepModal } from "@/components/multi-step-modal/use-multi-step-modal";

import {
  editEventPickSettingsSchema,
  type EditEventModalData,
} from "@/components/events/constants";
import EventPickCountsFields from "./event-pick-counts-fields";

export default function EditEventPickSettingsStep() {
  const { data, updateData } = useMultiStepModal<EditEventModalData>();
  const validationResult = editEventPickSettingsSchema.safeParse(data);
  const fieldErrors = validationResult.success
    ? {}
    : validationResult.error.flatten().fieldErrors;
  const shouldShowValidation = data.hasSubmittedPickSettings;

  return (
    <div className="flex flex-col gap-5">
      <EventPickCountsFields
        numberOfTeamPicks={data.numberOfTeamPicks}
        numberOfCategoryPicks={data.numberOfCategoryPicks}
        onNumberOfTeamPicksChange={(value) =>
          updateData({ numberOfTeamPicks: value })
        }
        onNumberOfCategoryPicksChange={(value) =>
          updateData({ numberOfCategoryPicks: value })
        }
        showValidation={shouldShowValidation}
        teamPicksError={fieldErrors.numberOfTeamPicks?.[0]}
        categoryPicksError={fieldErrors.numberOfCategoryPicks?.[0]}
        idPrefix="edit-event"
      />
    </div>
  );
}
