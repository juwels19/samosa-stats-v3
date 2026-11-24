"use client";

import { Chip, Table } from "@heroui/react";

import type { FunctionReturnType } from "convex/server";
import type { api } from "../../../../../../convex/_generated/api";
import { EXCLUDED_REASON_LABELS } from "./constants";
import { formatPreviewNumber } from "./format-preview-number";
import { sortPreviewTeams } from "./sort-preview-teams";

type PreviewResult = FunctionReturnType<typeof api.scoring.previewWinners>;

/** Each team's measures and value, with the winners first. */
export default function PreviewResultsTable({
  result,
  order,
}: {
  result: PreviewResult;
  order: "asc" | "desc";
}) {
  const measureNames = Object.keys(result.teams[0]?.measures ?? {});
  const teams = sortPreviewTeams(result.teams, order);

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
