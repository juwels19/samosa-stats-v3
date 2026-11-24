"use client";

import {
  Button,
  ComboBox,
  Description,
  Input,
  Label,
  ListBox,
  Spinner,
  toast,
} from "@heroui/react";
import { useMutation } from "convex/react";
import { useState } from "react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { matchSearchText } from "@/components/settings/seasons/categories/scoring/match-search-text";
import type { EventTeam } from "./types";

/** Selects and saves the winners of a manual category. */
export default function ManualWinnersField({
  eventId,
  categoryId,
  teams,
  savedWinners,
}: {
  eventId: Id<"events">;
  categoryId: Id<"categories">;
  teams: readonly EventTeam[];
  savedWinners: readonly number[];
}) {
  const setManualWinners = useMutation(api.scoring.setManualWinners);
  const [selected, setSelected] = useState(() => savedWinners.map(String));
  const [isSaving, setIsSaving] = useState(false);

  const isChanged =
    selected.length !== savedWinners.length ||
    selected.some((id) => !savedWinners.includes(Number(id)));
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
      });
      toast.success(selected.length === 0 ? "Winners removed" : "Winners saved");
    } catch (error) {
      toast.danger("Winners not saved", {
        description: error instanceof Error ? error.message : "Try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
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
        isDisabled={!isChanged}
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
  );
}

function teamLabel(team: EventTeam) {
  return `${team.number} ${team.name}`;
}
