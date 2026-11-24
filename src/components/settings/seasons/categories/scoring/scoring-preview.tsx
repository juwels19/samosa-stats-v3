"use client";

import { Alert, Button, Input, Label, Spinner, TextField } from "@heroui/react";
import { useAction } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { PlayIcon } from "lucide-react";
import { useState } from "react";

import { api } from "../../../../../../convex/_generated/api";
import type { WinnerConfig } from "../../../../../../convex/lib/scoring/winner_config";
import { getSelectOrder } from "./get-select-order";
import PreviewResultsTable from "./preview-results-table";

type PreviewResult = FunctionReturnType<typeof api.scoring.previewWinners>;

/** Runs the current config against any past event. Saves nothing. */
export default function ScoringPreview({
  config,
  defaultYear,
}: {
  config: WinnerConfig | null;
  defaultYear: number;
}) {
  const previewWinners = useAction(api.scoring.previewWinners);
  const [eventCode, setEventCode] = useState("");
  const [year, setYear] = useState(String(defaultYear));
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PreviewResult | null>(null);

  const yearNumber = Number(year);
  const canRun =
    config !== null &&
    eventCode.trim() !== "" &&
    Number.isInteger(yearNumber) &&
    yearNumber >= 1992;

  const run = async () => {
    if (!canRun) return;
    setIsRunning(true);
    setError(null);
    try {
      setResult(
        await previewWinners({
          year: yearNumber,
          eventCode: eventCode.trim(),
          config,
        }),
      );
    } catch (runError) {
      setResult(null);
      setError(runError instanceof Error ? runError.message : "Try again.");
    } finally {
      setIsRunning(false);
    }
  };

  const order = config === null ? "desc" : getSelectOrder(config);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="font-semibold">Preview</h2>
        <p className="text-sm text-muted">
          Run this config against a past event. Nothing is saved.
        </p>
      </div>
      <form
        className="grid gap-3 sm:grid-cols-[1fr_8rem_auto] sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          void run();
        }}
      >
        <TextField fullWidth value={eventCode} onChange={setEventCode}>
          <Label>Event code</Label>
          <Input placeholder="onosh" autoComplete="off" className="font-mono" />
        </TextField>
        <TextField fullWidth value={year} onChange={setYear}>
          <Label>Year</Label>
          <Input inputMode="numeric" autoComplete="off" />
        </TextField>
        <Button type="submit" isDisabled={!canRun} isPending={isRunning}>
          {({ isPending }) => (
            <>
              {isPending ? (
                <Spinner color="current" size="sm" />
              ) : (
                <PlayIcon className="size-4" />
              )}
              {isPending ? "Running" : "Run preview"}
            </>
          )}
        </Button>
      </form>
      {config === null ? (
        <p className="text-sm text-muted">
          Fix the config issues to run a preview.
        </p>
      ) : null}
      {error ? (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Preview failed</Alert.Title>
            <Alert.Description className="whitespace-pre-wrap">
              {error}
            </Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}
      {result ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm">
            <span className="font-semibold">Winners: </span>
            {result.winners.length > 0 ? result.winners.join(", ") : "none"}
            <span className="text-muted">
              {" "}
              · {result.teams.length} teams · {result.matchRowCount} match rows
            </span>
          </p>
          {result.unknownFields.length > 0 ? (
            <p className="text-sm text-danger">
              Unknown fields:{" "}
              {result.unknownFields.map((issue) => issue.field).join(", ")}
            </p>
          ) : null}
          <PreviewResultsTable teams={result.teams} order={order} />
        </div>
      ) : null}
    </section>
  );
}
