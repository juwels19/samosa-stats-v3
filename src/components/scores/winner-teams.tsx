import { Chip } from "@heroui/react";

import type { EventTeam } from "./types";

/** The winning teams, with their names. */
export default function WinnerTeams({
  winners,
  teams,
}: {
  winners: readonly number[];
  teams: readonly EventTeam[];
}) {
  if (winners.length === 0) {
    return <p className="text-sm text-muted">No winners with the current data.</p>;
  }

  const names = new Map(teams.map((team) => [team.number, team.name]));

  return (
    <ul className="flex flex-wrap gap-2" aria-label="Winners">
      {winners.map((team) => (
        <li key={team}>
          <Chip variant="soft" color="success">
            <span className="font-semibold tabular-nums">{team}</span>
            {names.has(team) ? (
              <span className="max-w-48 truncate">{names.get(team)}</span>
            ) : null}
          </Chip>
        </li>
      ))}
    </ul>
  );
}
