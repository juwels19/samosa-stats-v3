"use client";

import { Chip, Table } from "@heroui/react";

import type { TeamWinnerResult } from "../../../../../../convex/lib/scoring/find_category_winners";
import { EXCLUDED_REASON_LABELS } from "./constants";
import { formatPreviewNumber } from "./format-preview-number";
import { sortPreviewTeams } from "./sort-preview-teams";

/** Each team's measures and value, with the winners first. */
export default function PreviewResultsTable({
  teams: unsortedTeams,
  order,
}: {
  teams: readonly TeamWinnerResult[];
  order: "asc" | "desc";
}) {
  const measureNames = Object.keys(unsortedTeams[0]?.measures ?? {});
  const teams = sortPreviewTeams(unsortedTeams, order);

  return (
    <Table>
      <Table.ScrollContainer>
        <Table.Content aria-label="Preview results" className="min-w-[480px]">
          <Table.Header>
            <Table.Column isRowHeader>Team</Table.Column>
            {measureNames.map((name) => (
              <Table.Column key={name} className="font-mono">
                {name}
              </Table.Column>
            ))}
            <Table.Column>Value</Table.Column>
            <Table.Column>Result</Table.Column>
          </Table.Header>
          <Table.Body>
            {teams.map((team) => (
              <Table.Row key={team.team}>
                <Table.Cell className="font-medium tabular-nums">
                  {team.team}
                </Table.Cell>
                {measureNames.map((name) => (
                  <Table.Cell key={name} className="tabular-nums">
                    {formatPreviewNumber(team.measures[name] ?? null)}
                  </Table.Cell>
                ))}
                <Table.Cell className="tabular-nums">
                  {formatPreviewNumber(team.value)}
                </Table.Cell>
                <Table.Cell>
                  {team.isWinner ? (
                    <Chip size="sm" variant="soft" color="success">
                      Winner
                    </Chip>
                  ) : team.excludedReason ? (
                    <span className="text-sm text-muted">
                      {EXCLUDED_REASON_LABELS[team.excludedReason]}
                    </span>
                  ) : null}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}
