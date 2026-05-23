import { Badge } from "@/components/ui/badge";
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
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Display name</h3>
        <p className="text-sm text-muted-foreground">
          {displayName.trim() || "No display name set"}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Teams</h3>
        {selectedTeams.length === 0 ? (
          <p className="text-sm text-muted-foreground">No teams selected.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {sortedTeams.map((team) => (
              <Badge key={team._id} variant="secondary">
                {team.number.toString()} - {team.name}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Categories</h3>
        {selectedCategories.length === 0 ? (
          <p className="text-sm text-muted-foreground">No categories selected.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map((category) => (
              <Badge key={category._id} variant="secondary">
                {category.text}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
