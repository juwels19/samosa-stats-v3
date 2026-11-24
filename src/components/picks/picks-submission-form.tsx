"use client";

import { useState } from "react";
import { Alert, toast } from "@heroui/react";
import { useMutation } from "convex/react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import EventStatusChip from "../events/event-status-chip";
import { formatEventDate } from "../events/utils";
import { arePicksFieldsDisabled } from "./are-picks-fields-disabled";
import CategorySelection from "./category-selection";
import DisplayNameField from "./display-name-field";
import { getPicksSubmitState } from "./get-picks-submit-state";
import PicksConfirmationDialog from "./picks-confirmation-dialog";
import PicksActionBar from "./picks-action-bar";
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
      toast.danger(
        error instanceof Error ? error.message : "Could not save picks.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 px-4 pt-1 sm:px-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-balance sm:text-3xl">
            {data.event.displayName}
          </h1>
          <EventStatusChip status={data.event.status} />
        </div>
        <p className="text-sm text-muted">
          {data.event.name}
          <span aria-hidden> · </span>
          {formatEventDate(data.event.startDate)} to{" "}
          {formatEventDate(data.event.endDate)}
        </p>
      </header>

      {submitState.disabledReason && !submitState.canRandomize && !submitState.canSubmit ? (
        <Alert status="warning">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{submitState.disabledReason}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      <div className="max-w-md">
        <DisplayNameField
          displayName={picksSelection.displayName}
          disabled={fieldsDisabled}
          onDisplayNameChange={picksSelection.setDisplayName}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[3fr_2fr] lg:gap-6">
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

      <PicksActionBar
        teamCount={picksSelection.selectedTeamIds.length}
        requiredTeamCount={numberOfTeamPicks}
        categoryCount={picksSelection.selectedCategoryIds.length}
        requiredCategoryCount={numberOfCategoryPicks}
        canRandomize={submitState.canRandomize}
        canReview={submitState.canSubmit}
        reviewLabel={data.existingPick !== null ? "Review and update" : "Review and submit"}
        disabledReason={submitState.disabledReason}
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
