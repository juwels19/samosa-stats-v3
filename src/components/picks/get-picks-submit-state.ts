import type { PickSubmissionData } from "./pick-submission-types";

export function getPicksSubmitState({
  data,
  hasExactTeamCount,
  hasExactCategoryCount,
}: {
  data: PickSubmissionData;
  hasExactTeamCount: boolean;
  hasExactCategoryCount: boolean;
}) {
  const hasEnoughTeams =
    data.teams.length >= Number(data.event.numberOfTeamPicks);
  const hasEnoughCategories =
    data.categories.length >= Number(data.event.numberOfCategoryPicks);
  const hasExactCounts = hasExactTeamCount && hasExactCategoryCount;
  const canSubmitManual = data.canSubmitManual && hasExactCounts;

  if (!hasEnoughTeams || !hasEnoughCategories) {
    return {
      canSubmit: false,
      canRandomize: false,
      submitLabel: getSubmitLabel(data.existingPick !== null),
      disabledReason:
        "This event does not have enough teams or categories yet.",
    };
  }

  if (!data.canSubmitManual && !data.canSubmitRandom) {
    return {
      canSubmit: false,
      canRandomize: false,
      submitLabel: getSubmitLabel(data.existingPick !== null),
      disabledReason: "Pick submissions are not open for this event.",
    };
  }

  if (!canSubmitManual) {
    return {
      canSubmit: false,
      canRandomize: data.canSubmitRandom,
      submitLabel: getSubmitLabel(data.existingPick !== null),
      disabledReason: data.canSubmitRandom
        ? "Only random picks can be submitted after submissions close."
        : "Pick submissions are not open for this event.",
    };
  }

  if (!hasExactCounts) {
    return {
      canSubmit: false,
      canRandomize: data.canSubmitRandom,
      submitLabel: getSubmitLabel(data.existingPick !== null),
      disabledReason:
        "Select the required number of teams and categories.",
    };
  }

  return {
    canSubmit: true,
    canRandomize: data.canSubmitRandom,
    submitLabel: getSubmitLabel(data.existingPick !== null),
    disabledReason: null,
  };
}

function getSubmitLabel(hasExistingPick: boolean) {
  return hasExistingPick ? "Update picks" : "Submit picks";
}
