"use client";

import { useState } from "react";

import type { Id } from "../../../convex/_generated/dataModel";
import type { ExistingPickSubmission } from "./pick-submission-types";

export function usePicksSelection({
  existingPick,
  numberOfTeamPicks,
  numberOfCategoryPicks,
}: {
  existingPick: ExistingPickSubmission | null;
  numberOfTeamPicks: number;
  numberOfCategoryPicks: number;
}) {
  const [selectedTeamIds, setSelectedTeamIds] = useState<Id<"teams">[]>(
    existingPick?.selectedTeamIds ?? [],
  );
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<
    Id<"categories">[]
  >(existingPick?.selectedCategoryIds ?? []);
  const [displayName, setDisplayName] = useState(
    existingPick?.displayName ?? "",
  );

  // Reset only when a different saved pick arrives. Convex sends a new object
  // on every live update, so comparing by reference would wipe unsaved edits.
  const savedPickKey = existingPick
    ? `${existingPick._id}:${existingPick.selectedTeamIds.join()}:${existingPick.selectedCategoryIds.join()}:${existingPick.displayName ?? ""}`
    : null;
  const [lastSavedPickKey, setLastSavedPickKey] = useState(savedPickKey);
  if (savedPickKey !== lastSavedPickKey) {
    setLastSavedPickKey(savedPickKey);
    setSelectedTeamIds(existingPick?.selectedTeamIds ?? []);
    setSelectedCategoryIds(existingPick?.selectedCategoryIds ?? []);
    setDisplayName(existingPick?.displayName ?? "");
  }

  function toggleTeam(teamId: Id<"teams">) {
    setSelectedTeamIds((currentTeamIds) =>
      toggleId(currentTeamIds, teamId, numberOfTeamPicks),
    );
  }

  function toggleCategory(categoryId: Id<"categories">) {
    setSelectedCategoryIds((currentCategoryIds) =>
      toggleId(currentCategoryIds, categoryId, numberOfCategoryPicks),
    );
  }

  return {
    selectedTeamIds,
    selectedCategoryIds,
    displayName,
    setDisplayName,
    toggleTeam,
    toggleCategory,
    hasExactTeamCount: selectedTeamIds.length === numberOfTeamPicks,
    hasExactCategoryCount:
      selectedCategoryIds.length === numberOfCategoryPicks,
  };
}

function toggleId<TId extends string>(ids: TId[], id: TId, maxCount: number) {
  if (ids.includes(id)) {
    return ids.filter((selectedId) => selectedId !== id);
  }

  if (ids.length >= maxCount) {
    return ids;
  }

  return [...ids, id];
}
