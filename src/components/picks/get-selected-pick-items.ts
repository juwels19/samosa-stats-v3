import type { Id } from "../../../convex/_generated/dataModel";
import type {
  PickSubmissionCategory,
  PickSubmissionTeam,
} from "./pick-submission-types";

export function getSelectedPickItems({
  teams,
  categories,
  selectedTeamIds,
  selectedCategoryIds,
}: {
  teams: PickSubmissionTeam[];
  categories: PickSubmissionCategory[];
  selectedTeamIds: Id<"teams">[];
  selectedCategoryIds: Id<"categories">[];
}) {
  const teamById = new Map(teams.map((team) => [team._id, team]));
  const categoryById = new Map(
    categories.map((category) => [category._id, category]),
  );

  return {
    selectedTeams: selectedTeamIds
      .map((teamId) => teamById.get(teamId))
      .filter((team): team is PickSubmissionTeam => team !== undefined),
    selectedCategories: selectedCategoryIds
      .map((categoryId) => categoryById.get(categoryId))
      .filter(
        (category): category is PickSubmissionCategory =>
          category !== undefined,
      ),
  };
}
