import type { Doc, Id } from "../../_generated/dataModel";
import { MAX_PICK_DISPLAY_NAME_LENGTH } from "./constants";

export function validatePickSubmission({
  event,
  eventTeamIds,
  selectableCategoryIds,
  globalCategoryIds,
  teamIds,
  categoryIds,
  displayName,
  isRandom,
}: {
  event: Pick<
    Doc<"events">,
    "numberOfTeamPicks" | "numberOfCategoryPicks" | "status"
  >;
  eventTeamIds: Id<"teams">[];
  selectableCategoryIds: Id<"categories">[];
  globalCategoryIds: Id<"categories">[];
  teamIds: Id<"teams">[];
  categoryIds: Id<"categories">[];
  displayName?: string;
  isRandom: boolean;
}) {
  validateSubmissionStatus(event.status, isRandom);
  validateExactCount({
    label: "team",
    selectedCount: teamIds.length,
    requiredCount: event.numberOfTeamPicks,
  });
  validateExactCount({
    label: "season category",
    selectedCount: categoryIds.length,
    requiredCount: event.numberOfCategoryPicks,
  });
  validateUniqueIds(teamIds, "Team picks must be unique.");
  validateUniqueIds(categoryIds, "Category picks must be unique.");
  validateIdsBelongToEvent(
    teamIds,
    eventTeamIds,
    "Selected teams must belong to this event.",
  );
  validateIdsBelongToEvent(
    categoryIds,
    selectableCategoryIds,
    "Selected categories must belong to this event.",
  );
  validateNoGlobalCategoriesSelected(categoryIds, globalCategoryIds);

  if (
    displayName !== undefined &&
    displayName.length > MAX_PICK_DISPLAY_NAME_LENGTH
  ) {
    throw new Error("Display name must be 250 characters or fewer.");
  }
}

function validateSubmissionStatus(
  status: Doc<"events">["status"],
  isRandom: boolean,
) {
  if (status === "SUBMISSIONS_OPEN") {
    return;
  }

  if (status === "SUBMISSIONS_CLOSED" && isRandom) {
    return;
  }

  if (status === "SUBMISSIONS_CLOSED") {
    throw new Error("Only random picks can be submitted after submissions close.");
  }

  throw new Error("Pick submissions are not open for this event.");
}

function validateExactCount({
  label,
  selectedCount,
  requiredCount,
}: {
  label: string;
  selectedCount: number;
  requiredCount: bigint;
}) {
  if (BigInt(selectedCount) !== requiredCount) {
    throw new Error(
      `Select exactly ${requiredCount.toString()} ${label} ${
        requiredCount === BigInt(1) ? "pick" : "picks"
      }.`,
    );
  }
}

function validateUniqueIds<TId extends string>(ids: TId[], message: string) {
  if (new Set(ids).size !== ids.length) {
    throw new Error(message);
  }
}

function validateIdsBelongToEvent<TId extends string>(
  selectedIds: TId[],
  availableIds: TId[],
  message: string,
) {
  const availableIdSet = new Set(availableIds);

  if (selectedIds.some((selectedId) => !availableIdSet.has(selectedId))) {
    throw new Error(message);
  }
}

function validateNoGlobalCategoriesSelected(
  categoryIds: Id<"categories">[],
  globalCategoryIds: Id<"categories">[],
) {
  const globalCategoryIdSet = new Set(globalCategoryIds);

  if (categoryIds.some((categoryId) => globalCategoryIdSet.has(categoryId))) {
    throw new Error("Global categories cannot be selected.");
  }
}
