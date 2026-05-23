"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useMutation } from "convex/react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  EVENT_STATUS_BADGE_VARIANTS,
  EVENT_STATUS_LABELS,
} from "../events/constants";
import { formatEventDate } from "../events/utils";
import { arePicksFieldsDisabled } from "./are-picks-fields-disabled";
import CategorySelection from "./category-selection";
import DisplayNameField from "./display-name-field";
import { getPicksSubmitState } from "./get-picks-submit-state";
import PicksConfirmationDialog from "./picks-confirmation-dialog";
import PicksFormActions from "./picks-form-actions";
import type { PickSubmissionData } from "./pick-submission-types";
import TeamSelection from "./team-selection";
import { getSelectedPickItems } from "./get-selected-pick-items";
import { randomizePickSelections } from "./randomize-pick-selections";
import { usePicksSelection } from "./use-picks-selection";

type PendingRandomPick = {
  teamIds: Id<"teams">[];
  categoryIds: Id<"categories">[];
};

type ConfirmationMode = "manual" | "random";

export default function PicksSubmissionForm({
  eventCode,
  data,
}: {
  eventCode: string;
  data: PickSubmissionData;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [confirmationMode, setConfirmationMode] =
    useState<ConfirmationMode>("manual");
  const [pendingRandomPick, setPendingRandomPick] =
    useState<PendingRandomPick | null>(null);
  const submitPicks = useMutation(api.picks.submit);
  const numberOfTeamPicks = Number(data.event.numberOfTeamPicks);
  const numberOfCategoryPicks = Number(data.event.numberOfCategoryPicks);
  const picksSelection = usePicksSelection({
    existingPick: data.existingPick,
    numberOfTeamPicks,
    numberOfCategoryPicks,
  });
  const confirmationTeamIds =
    confirmationMode === "random" && pendingRandomPick !== null
      ? pendingRandomPick.teamIds
      : picksSelection.selectedTeamIds;
  const confirmationCategoryIds =
    confirmationMode === "random" && pendingRandomPick !== null
      ? pendingRandomPick.categoryIds
      : picksSelection.selectedCategoryIds;
  const { selectedTeams, selectedCategories } = getSelectedPickItems({
    teams: data.teams,
    categories: data.categories,
    selectedTeamIds: confirmationTeamIds,
    selectedCategoryIds: confirmationCategoryIds,
  });
  const fieldsDisabled = arePicksFieldsDisabled(data.event);
  const submitState = getPicksSubmitState({
    data,
    hasExactTeamCount: picksSelection.hasExactTeamCount,
    hasExactCategoryCount: picksSelection.hasExactCategoryCount,
  });

  function handleConfirmationOpenChange(open: boolean) {
    setConfirmationOpen(open);

    if (!open) {
      setPendingRandomPick(null);
      setConfirmationMode("manual");
    }
  }

  async function handleConfirmSubmit() {
    const teamIds =
      confirmationMode === "random" && pendingRandomPick !== null
        ? pendingRandomPick.teamIds
        : picksSelection.selectedTeamIds;
    const categoryIds =
      confirmationMode === "random" && pendingRandomPick !== null
        ? pendingRandomPick.categoryIds
        : picksSelection.selectedCategoryIds;
    const isRandom = confirmationMode === "random";

    setIsSubmitting(true);

    try {
      await submitPicks({
        eventCode,
        teamIds,
        categoryIds,
        displayName: picksSelection.displayName,
        isRandom,
      });
      handleConfirmationOpenChange(false);
      toast.success("Picks saved.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save picks.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-4 sm:px-6">
      <Card size="sm">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle>{data.event.displayName}</CardTitle>
              <CardDescription>
                {data.event.name}
                <br />
                {formatEventDate(data.event.startDate)} -{" "}
                {formatEventDate(data.event.endDate)}
              </CardDescription>
            </div>
            <Badge variant={EVENT_STATUS_BADGE_VARIANTS[data.event.status]}>
              {EVENT_STATUS_LABELS[data.event.status]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-5 lg:grid-cols-4">
          <div className="col-span-1 lg:col-span-2">
            <DisplayNameField
              displayName={picksSelection.displayName}
              disabled={fieldsDisabled}
              onDisplayNameChange={picksSelection.setDisplayName}
            />
          </div>
          <div className="col-span-1 lg:col-span-2">
            <PicksFormActions
              canRandomize={submitState.canRandomize}
              canReview={submitState.canSubmit}
              reviewLabel={
                data.existingPick !== null
                  ? "Review & update"
                  : "Review & submit"
              }
              isSubmitting={isSubmitting}
              onRandomize={() => {
                setPendingRandomPick(
                  randomizePickSelections({
                    teams: data.teams,
                    categories: data.categories,
                    numberOfTeamPicks,
                    numberOfCategoryPicks,
                  }),
                );
                setConfirmationMode("random");
                setConfirmationOpen(true);
              }}
              onReview={() => {
                setConfirmationMode("manual");
                setConfirmationOpen(true);
              }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <TeamSelection
          teams={data.teams}
          selectedTeamIds={picksSelection.selectedTeamIds}
          requiredTeamCount={numberOfTeamPicks}
          readOnly={fieldsDisabled}
          onToggleTeam={picksSelection.toggleTeam}
        />
        <CategorySelection
          categories={data.categories}
          selectedCategoryIds={picksSelection.selectedCategoryIds}
          requiredCategoryCount={numberOfCategoryPicks}
          readOnly={fieldsDisabled}
          onToggleCategory={picksSelection.toggleCategory}
        />
      </div>

      <PicksConfirmationDialog
        open={confirmationOpen}
        onOpenChange={handleConfirmationOpenChange}
        isRandomPick={confirmationMode === "random"}
        selectedTeams={selectedTeams}
        selectedCategories={selectedCategories}
        displayName={picksSelection.displayName}
        submitLabel={submitState.submitLabel}
        isSubmitting={isSubmitting}
        onConfirm={handleConfirmSubmit}
      />
    </div>
  );
}
