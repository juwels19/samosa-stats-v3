"use client";

import { Button, Description, FieldError, Input, Label, TextField, toast } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useMutation } from "convex/react";
import { CheckCircle2Icon } from "lucide-react";
import { useState } from "react";
import { QUERY_KEYS } from "@/constants/query-keys";
import { getGameNameForYear } from "@/lib/fetch/frc-events";
import { api } from "../../../../../convex/_generated/api";

/** Year field with a live FRC Events lookup for the game name. */
export default function AddSeasonForm({ existingYears }: { existingYears: number[] }) {
  const [year, setYear] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const createSeason = useMutation(api.seasons.create);

  const trimmedYear = year.trim();
  const isYear = /^\d{4}$/.test(trimmedYear);
  const isDuplicate = isYear && existingYears.includes(Number(trimmedYear));

  const lookup = useQuery({
    queryKey: [QUERY_KEYS.FrcEventsGameName, trimmedYear],
    queryFn: () => getGameNameForYear(trimmedYear),
    enabled: isYear && !isDuplicate,
    retry: false,
  });

  const gameName = isYear && !isDuplicate ? lookup.data : undefined;
  const error = isDuplicate
    ? `${trimmedYear} is already saved.`
    : isYear && lookup.error instanceof Error
      ? lookup.error.message
      : null;

  async function handleSubmit() {
    if (!gameName) return;
    setIsSaving(true);
    try {
      await createSeason({ year: Number(trimmedYear), gameName });
      toast.success("Season saved", { description: `${trimmedYear} ${gameName} is added.` });
      setYear("");
    } catch (e) {
      toast.danger("Season not saved", {
        description: e instanceof Error ? e.message : "Try again.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row sm:items-start"
      onSubmit={(e) => {
        e.preventDefault();
        void handleSubmit();
      }}
    >
      <TextField
        value={year}
        onChange={setYear}
        maxLength={4}
        isInvalid={error !== null}
        className="sm:w-56"
      >
        <Label>Season year</Label>
        <Input inputMode="numeric" placeholder="2027" autoComplete="off" />
        {error ? (
          <FieldError>{error}</FieldError>
        ) : (
          <Description className={gameName ? "flex items-center gap-1 text-success" : undefined}>
            {lookup.isFetching ? (
              "Looking up the game name"
            ) : gameName ? (
              <>
                <CheckCircle2Icon className="size-3.5" aria-hidden />
                {gameName}
              </>
            ) : (
              "We look up the game name from FRC Events."
            )}
          </Description>
        )}
      </TextField>
      <Button
        type="submit"
        variant="secondary"
        size="lg"
        className="sm:mt-6"
        isDisabled={!gameName || lookup.isFetching}
        isPending={isSaving}
      >
        Add season
      </Button>
    </form>
  );
}
