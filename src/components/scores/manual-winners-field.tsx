"use client";

import {
  Button,
  ComboBox,
  Description,
  Input,
  Label,
  ListBox,
  Spinner,
  TextField,
  toast,
} from "@heroui/react";
import { useMutation } from "convex/react";
import { useState } from "react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { matchSearchText } from "@/components/settings/seasons/categories/scoring/match-search-text";
import type { EventTeam } from "./types";

type TeamPoints = { team: number; points: number };

/**
 * Selects and saves the winners of a manual category. With `usesTeamPoints`,
 * each winner also needs its own points.
 */
export default function ManualWinnersField({
  eventId,
  categoryId,
  teams,
  savedWinners,
  usesTeamPoints = false,
  savedPoints = [],
}: {
  eventId: Id<"events">;
  categoryId: Id<"categories">;
  teams: readonly EventTeam[];
  savedWinners: readonly number[];
  usesTeamPoints?: boolean;
  savedPoints?: readonly TeamPoints[];
}) {
  const setManualWinners = useMutation(api.scoring.setManualWinners);
  const [selected, setSelected] = useState(() => savedWinners.map(String));
  const [points, setPoints] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      savedPoints.map((row) => [String(row.team), String(row.points)]),
    ),
  );
  const [isSaving, setIsSaving] = useState(false);

  const savedPointsByTeam = new Map(
    savedPoints.map((row) => [String(row.team), String(row.points)]),
  );
  const isChanged =
    selected.length !== savedWinners.length ||
    selected.some((id) => !savedWinners.includes(Number(id))) ||
    (usesTeamPoints &&
      selected.some(
        (id) => (points[id] ?? "") !== (savedPointsByTeam.get(id) ?? ""),
      ));
  const missingPoints = usesTeamPoints
    ? selected.filter((id) => !/^-?\d+$/.test((points[id] ?? "").trim()))
    : [];
  const names = new Map(teams.map((team) => [String(team.number), team.name]));
  const filter = matchSearchText(
    new Map(
      teams.map((team) => [teamLabel(team), `${team.number} ${team.name}`]),
    ),
  );

  const save = async () => {
    setIsSaving(true);
    try {
      await setManualWinners({
        eventId,
        categoryId,
        winners: selected.map(Number),
        ...(usesTeamPoints
          ? {
              teamPoints: selected.map((id) => ({
                team: Number(id),
                points: Number((points[id] ?? "").trim()),
              })),
            }
          : {}),
      });
      toast.success(
        selected.length === 0 ? "Winners removed" : "Winners saved",
      );
    } catch (error) {
      toast.danger("Winners not saved", {
        description: error instanceof Error ? error.message : "Try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <ComboBox
          fullWidth
          selectionMode="multiple"
          value={selected}
          onChange={(keys) =>
            setSelected((Array.isArray(keys) ? keys : []).map(String))
          }
          isDisabled={teams.length === 0}
          defaultFilter={filter}
          menuTrigger="focus"
        >
          <Label>Winners</Label>
          <ComboBox.InputGroup>
            <Input placeholder="Search teams" />
            <ComboBox.Trigger />
          </ComboBox.InputGroup>
          <ComboBox.Value placeholder="No winners selected" />
          <Description>A category can have more than one winner.</Description>
          <ComboBox.Popover>
            <ListBox selectionMode="multiple">
              {teams.map((team) => (
                <ListBox.Item
                  key={team.number}
                  id={String(team.number)}
                  textValue={teamLabel(team)}
                >
                  <Label className="pr-7">
                    <span className="font-semibold tabular-nums">
                      {team.number}
                    </span>{" "}
                    {team.name}
                  </Label>
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </ComboBox.Popover>
        </ComboBox>
        <Button
          className="sm:mt-6"
          variant={isChanged ? "primary" : "secondary"}
          isDisabled={!isChanged || missingPoints.length > 0}
          isPending={isSaving}
          onPress={() => void save()}
        >
          {({ isPending }) => (
            <>
              {isPending ? <Spinner color="current" size="sm" /> : null}
              {isPending ? "Saving" : "Save winners"}
            </>
          )}
        </Button>
      </div>
      {usesTeamPoints && selected.length > 0 ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">
            Points for each winning team
          </legend>
          <ul className="grid gap-2 sm:grid-cols-2">
            {selected.map((id) => (
              <li key={id}>
                <TextField
                  value={points[id] ?? ""}
                  onChange={(value) =>
                    setPoints((current) => ({ ...current, [id]: value }))
                  }
                  isInvalid={
                    missingPoints.includes(id) && (points[id] ?? "") !== ""
                  }
                >
                  <Label className="truncate">
                    <span className="font-semibold tabular-nums">{id}</span>{" "}
                    {names.get(id) ?? ""}
                  </Label>
                  <Input
                    inputMode="numeric"
                    placeholder="0"
                    className="tabular-nums"
                  />
                </TextField>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted">
            {missingPoints.length > 0
              ? "Enter a whole number for each team. Use a negative number for a deduction."
              : "Each player who picked a team gets that team's points."}
          </p>
        </fieldset>
      ) : null}
    </div>
  );
}

function teamLabel(team: EventTeam) {
  return `${team.number} ${team.name}`;
}
