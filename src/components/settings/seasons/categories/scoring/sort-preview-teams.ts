type PreviewTeam = { team: number; value: number | null; isWinner: boolean };

/** Winners first, then by value in the rule's order, then teams with no value. */
export function sortPreviewTeams<Team extends PreviewTeam>(
  teams: readonly Team[],
  order: "asc" | "desc",
): Team[] {
  return teams.toSorted((a, b) => {
    if (a.isWinner !== b.isWinner) return a.isWinner ? -1 : 1;
    if (a.value === null || b.value === null) {
      return a.value === b.value ? a.team - b.team : a.value === null ? 1 : -1;
    }
    const byValue = order === "desc" ? b.value - a.value : a.value - b.value;
    return byValue || a.team - b.team;
  });
}
