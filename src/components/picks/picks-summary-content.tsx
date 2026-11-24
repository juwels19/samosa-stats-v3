import { Chip } from "@heroui/react";
import type {
  PickSubmissionCategory,
  PickSubmissionTeam,
} from "./pick-submission-types";
import { sortSelectedTeams } from "./sort-selected-teams";

export default function PicksSummaryContent({
  selectedTeams,
  selectedCategories,
  displayName,
}: {
  selectedTeams: PickSubmissionTeam[];
  selectedCategories: PickSubmissionCategory[];
  displayName: string;
}) {
  const sortedTeams = sortSelectedTeams(selectedTeams);
  return (
    <dl className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <dt className="text-sm font-medium">Display name</dt>
        <dd className="text-sm text-muted">
          {displayName.trim() || "No display name set"}
        </dd>
      </div>
      <div className="flex flex-col gap-1.5">
        <dt className="text-sm font-medium">Teams</dt>
        <dd>
          {selectedTeams.length === 0 ? (
            <p className="text-sm text-muted">No teams selected.</p>
          ) : (
            <ul className="flex flex-wrap gap-1.5">
              {sortedTeams.map((team) => (
                <li key={team._id}>
                  <Chip size="md">
                    <span className="font-semibold tabular-nums">
                      {team.number.toString()}
                    </span>
                    <span className="max-w-40 truncate text-muted">
                      {team.name}
                    </span>
                  </Chip>
                </li>
              ))}
            </ul>
          )}
        </dd>
      </div>
      <div className="flex flex-col gap-1.5">
        <dt className="text-sm font-medium">Categories</dt>
        <dd>
          {selectedCategories.length === 0 ? (
            <p className="text-sm text-muted">No categories selected.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {selectedCategories.map((category) => (
                <li
                  key={category._id}
                  className="rounded-xl bg-default px-3 py-2 text-sm"
                >
                  {category.text}
                </li>
              ))}
            </ul>
          )}
        </dd>
      </div>
    </dl>
  );
}
