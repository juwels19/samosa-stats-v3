import type { Id, TableNames } from "../../../convex/_generated/dataModel";
import type {
  PickSubmissionCategory,
  PickSubmissionTeam,
} from "./pick-submission-types";

export function randomizePickSelections({
  teams,
  categories,
  numberOfTeamPicks,
  numberOfCategoryPicks,
}: {
  teams: PickSubmissionTeam[];
  categories: PickSubmissionCategory[];
  numberOfTeamPicks: number;
  numberOfCategoryPicks: number;
}) {
  return {
    teamIds: sampleIdsWithoutReplacement(
      teams.map((team) => team._id),
      numberOfTeamPicks,
    ),
    categoryIds: sampleIdsWithoutReplacement(
      categories.map((category) => category._id),
      numberOfCategoryPicks,
    ),
  };
}

function sampleIdsWithoutReplacement<TTableName extends TableNames>(
  ids: Id<TTableName>[],
  count: number,
) {
  return ids
    .map((id) => ({ id, sort: Math.random() }))
    .toSorted((a, b) => a.sort - b.sort)
    .slice(0, count)
    .map(({ id }) => id);
}
