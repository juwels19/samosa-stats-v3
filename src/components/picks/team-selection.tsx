"use client";

import { SearchField } from "@heroui/react";
import { useState } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import PickSection from "./pick-section";
import PickSelectionGrid from "./pick-selection-grid";
import type { PickSubmissionTeam } from "./pick-submission-types";

const SEARCH_THRESHOLD = 12;

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
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const visibleTeams = normalizedQuery
    ? teams.filter(
        (team) =>
          team.number.toString().includes(normalizedQuery) ||
          team.name.toLowerCase().includes(normalizedQuery),
      )
    : teams;

  return (
    <PickSection
      id="teams"
      title="Teams"
      selectedCount={selectedTeamIds.length}
      requiredCount={requiredTeamCount}
      toolbar={
        teams.length > SEARCH_THRESHOLD ? (
          <SearchField
            aria-label="Search teams"
            value={query}
            onChange={setQuery}
            fullWidth
          >
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Search by number or name" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
        ) : null
      }
    >
      {visibleTeams.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">
          No teams match &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <PickSelectionGrid
          items={visibleTeams.map((team) => ({
            id: team._id,
            label: team.number.toString(),
            detail: team.name,
          }))}
          selectedIds={selectedTeamIds}
          selectionFull={selectedTeamIds.length >= requiredTeamCount}
          readOnly={readOnly}
          onToggle={(teamId) => onToggleTeam(teamId as Id<"teams">)}
        />
      )}
    </PickSection>
  );
}
