import type { PickSubmissionTeam } from "./pick-submission-types";

export function sortSelectedTeams(teams: PickSubmissionTeam[]) {
  return teams.toSorted((a, b) => {
    if (a.number === b.number) {
      return a.name.localeCompare(b.name);
    }

    return a.number < b.number ? -1 : 1;
  });
}
