import type { Id } from "../../../convex/_generated/dataModel";
import PickSelectionGrid from "./pick-selection-grid";
import type { PickSubmissionTeam } from "./pick-submission-types";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function TeamSelection({
  teams,
  selectedTeamIds,
  requiredTeamCount,
  readOnly = false,
  onToggleTeam,
}: {
  teams: PickSubmissionTeam[];
  selectedTeamIds: Id<"teams">[];
  requiredTeamCount: number;
  readOnly?: boolean;
  onToggleTeam: (teamId: Id<"teams">) => void;
}) {
  const selectionFull = selectedTeamIds.length >= requiredTeamCount;

  return (
    <Card className="bg-background/60">
      <CardHeader>
        <CardTitle>Teams</CardTitle>
        <CardAction className="shrink-0 rounded-full bg-secondary px-3 py-1 text-sm font-medium">
          {selectedTeamIds.length} / {requiredTeamCount}
        </CardAction>
      </CardHeader>
      <CardContent>
        <PickSelectionGrid
          items={teams.map((team) => ({
            id: team._id,
            label: `Team ${team.number.toString()}`,
            detail: team.name,
          }))}
          selectedIds={selectedTeamIds}
          selectionFull={selectionFull}
          idPrefix="pick-team"
          readOnly={readOnly}
          onToggle={(teamId) => onToggleTeam(teamId as Id<"teams">)}
        />
      </CardContent>
    </Card>
  );
}
