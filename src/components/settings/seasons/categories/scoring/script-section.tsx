"use client";

import {
  Alert,
  Button,
  Chip,
  Description,
  Disclosure,
  Input,
  Label,
  Spinner,
  TextArea,
  TextField,
} from "@heroui/react";
import { useAction } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { PlayIcon, SparklesIcon, Undo2Icon } from "lucide-react";
import { useState } from "react";

import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { SCRIPT_CONTEXT_TYPE, type ScriptSets } from "../../../../../../convex/lib/scoring/script/contract";
import ScriptResultDetails from "./script-result-details";

export type ScriptPreview = FunctionReturnType<typeof api.scoringScripts.previewScript>;

/** The key of a script and what it sets. A save needs a passing run of this key. */
export function scriptCheckKey(code: string, sets: ScriptSets) {
  return JSON.stringify({ code: code.trim(), sets });
}

type AiState =
  | { status: "ok"; notes: string[]; undo: string }
  | { status: "unsupported"; reason: string; notes: string[] }
  | { status: "error"; message: string };

/**
 * The scoring script: AI writes it from a rule and tests it on the example
 * event. The admin can edit it and run it again. Saves nothing.
 */
export default function ScriptSection({
  categoryId,
  sets,
  code,
  onCodeChange,
  description,
  onDescriptionChange,
  defaultEventCode,
  onChecked,
}: {
  categoryId: Id<"categories">;
  sets: ScriptSets;
  code: string;
  onCodeChange: (code: string) => void;
  description: string;
  onDescriptionChange: (description: string) => void;
  defaultEventCode: string;
  /** Called after each run, with the key of the script that ran. */
  onChecked: (key: string, ok: boolean) => void;
}) {
  const generateScript = useAction(api.scoringScripts.generateScript);
  const previewScript = useAction(api.scoringScripts.previewScript);
  const [eventCode, setEventCode] = useState(defaultEventCode);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [ai, setAi] = useState<AiState | null>(null);
  const [preview, setPreview] = useState<{ eventCode: string; result: ScriptPreview } | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  const exampleCode = eventCode.trim().toLowerCase();
  const hasEvent = /^[a-z0-9]+$/.test(exampleCode);
  const isBusy = isGenerating || isRunning;
  const setsLabel = sets.winners && sets.points ? "winners and points" : sets.winners ? "winners" : "points";

  const generate = async () => {
    if (!hasEvent || description.trim() === "") return;
    setIsGenerating(true);
    setRunError(null);
    try {
      const result = await generateScript({
        categoryId,
        description: description.trim(),
        eventCode: exampleCode,
        sets,
        ...(code.trim() ? { currentCode: code } : {}),
      });
      if (result.status === "unsupported") {
        setAi(result);
        return;
      }
      setAi({ status: "ok", notes: result.notes, undo: code });
      onCodeChange(result.code);
      setPreview({ eventCode: exampleCode, result: result.preview });
      onChecked(scriptCheckKey(result.code, sets), result.preview.ok);
    } catch (error) {
      setAi({ status: "error", message: error instanceof Error ? error.message : "Try again." });
    } finally {
      setIsGenerating(false);
    }
  };

  const run = async () => {
    if (!hasEvent || code.trim() === "") return;
    setIsRunning(true);
    setRunError(null);
    try {
      const result = await previewScript({ categoryId, eventCode: exampleCode, code, sets });
      setPreview({ eventCode: exampleCode, result });
      onChecked(scriptCheckKey(code, sets), result.ok);
    } catch (error) {
      setRunError(error instanceof Error ? error.message : "Try again.");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        The script returns this category&apos;s {setsLabel}. It runs in a sandbox each time you calculate winners. It
        can read TBA, Statbotics and FRC Events, and the event&apos;s picks. It can&apos;t change any data.
      </p>

      <form
        className="flex flex-col gap-3 rounded-2xl bg-surface p-4"
        onSubmit={(event) => {
          event.preventDefault();
          void generate();
        }}
      >
        <TextField fullWidth value={description} onChange={onDescriptionChange}>
          <Label>Describe the rule</Label>
          <TextArea rows={3} />
          <Description>
            Starts from the scoring description. Say how winners are found
            {sets.points ? " and how many points each winning team gives" : ""}. The AI writes the script and tests it
            on the example event.
          </Description>
        </TextField>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <TextField className="sm:w-48" value={eventCode} onChange={setEventCode}>
            <Label>Example event</Label>
            <Input placeholder="onosh" autoComplete="off" className="font-mono" />
          </TextField>
          <Button
            type="submit"
            variant="secondary"
            isPending={isGenerating}
            isDisabled={!hasEvent || description.trim() === "" || isRunning}
          >
            {({ isPending }) => (
              <>
                {isPending ? <Spinner color="current" size="sm" /> : <SparklesIcon className="size-4" />}
                {isPending ? "Writing script" : code.trim() ? "Rewrite script" : "Write script"}
              </>
            )}
          </Button>
        </div>
        {isGenerating ? (
          <p className="text-sm text-muted" aria-live="polite">
            Reading the data for {exampleCode} and testing the script in the sandbox. This can take up to 2 minutes.
          </p>
        ) : null}
      </form>

      {ai ? (
        <AiBanner
          ai={ai}
          onUndo={
            ai.status === "ok"
              ? () => {
                  onCodeChange(ai.undo);
                  setAi(null);
                }
              : undefined
          }
        />
      ) : null}

      <TextField fullWidth value={code} onChange={onCodeChange}>
        <Label>Script</Label>
        <TextArea
          rows={code.trim() ? Math.min(28, Math.max(10, code.split("\n").length + 1)) : 6}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          className="font-mono text-xs leading-5"
          placeholder="export default async function score(ctx) { ... }"
        />
        <Description>JavaScript. You can edit it. Run it again after a change, before you save.</Description>
      </TextField>

      <Disclosure>
        <Disclosure.Heading>
          <Disclosure.Trigger className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-muted">
            What the script gets and returns
            <Disclosure.Indicator />
          </Disclosure.Trigger>
        </Disclosure.Heading>
        <Disclosure.Content>
          <Disclosure.Body>
            <pre className="overflow-x-auto rounded-xl bg-default p-3 font-mono text-xs">{SCRIPT_CONTEXT_TYPE}</pre>
          </Disclosure.Body>
        </Disclosure.Content>
      </Disclosure>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          {preview ? `Last run on ${preview.eventCode}` : "Run the script to see its result before you save."}
        </p>
        <Button
          variant="secondary"
          isPending={isRunning}
          isDisabled={!hasEvent || code.trim() === "" || isGenerating}
          onPress={() => void run()}
        >
          {({ isPending }) => (
            <>
              {isPending ? <Spinner color="current" size="sm" /> : <PlayIcon className="size-4" />}
              {isPending ? "Running" : `Run on ${hasEvent ? exampleCode : "event"}`}
            </>
          )}
        </Button>
      </div>

      {runError ? (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>The script did not run</Alert.Title>
            <Alert.Description>{runError}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      {preview && !isBusy ? <ScriptPreviewResult preview={preview.result} sets={sets} /> : null}
    </div>
  );
}

function AiBanner({ ai, onUndo }: { ai: AiState; onUndo?: () => void }) {
  if (ai.status === "error") {
    return (
      <Alert status="danger" className="ai-reveal">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Script not written</Alert.Title>
          <Alert.Description>{ai.message}</Alert.Description>
        </Alert.Content>
      </Alert>
    );
  }
  if (ai.status === "unsupported") {
    return (
      <Alert status="warning" className="ai-reveal">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>No data can score this rule</Alert.Title>
          <Alert.Description>
            {ai.reason} Set the winners by hand with Manual, or change the rule and try again.
          </Alert.Description>
        </Alert.Content>
      </Alert>
    );
  }
  return (
    <div className="ai-reveal flex flex-col gap-2 rounded-2xl bg-accent-soft px-4 py-3 text-sm text-accent-soft-foreground">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-medium">AI wrote the script and ran it on the example event. Check the result before you save.</p>
        {onUndo ? (
          <Button size="sm" variant="ghost" className="self-start sm:self-auto" onPress={onUndo}>
            <Undo2Icon className="size-4" />
            Undo
          </Button>
        ) : null}
      </div>
      {ai.notes.length > 0 ? (
        <ul className="list-disc pl-5 opacity-90">
          {ai.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function ScriptPreviewResult({ preview, sets }: { preview: ScriptPreview; sets: ScriptSets }) {
  const { output } = preview;
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-surface p-4" aria-live="polite">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Chip size="sm" variant="soft" color={preview.ok ? "success" : "danger"}>
          {preview.ok ? "Passed" : "Failed"}
        </Chip>
        <span className="text-muted tabular-nums">
          {preview.event.key} · {preview.event.submissions}{" "}
          {preview.event.submissions === 1 ? "submission" : "submissions"} · {preview.event.teams} teams ·{" "}
          {(preview.ms / 1000).toFixed(1)} s
        </span>
      </div>

      {preview.error ? (
        <pre className="overflow-x-auto rounded-xl bg-danger-soft p-3 font-mono text-xs whitespace-pre-wrap text-danger-soft-foreground">
          {preview.error}
        </pre>
      ) : null}
      {preview.issues.length > 0 ? (
        <ul className="list-disc pl-5 text-sm text-danger">
          {preview.issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      ) : null}

      {output ? (
        <div className="flex flex-col gap-3">
          <dl className="grid gap-3 sm:grid-cols-[auto_1fr] sm:gap-x-6">
            {sets.winners ? (
              <>
                <dt className="text-sm text-muted">Winners</dt>
                <dd className="flex flex-wrap gap-2">
                  {output.winners && output.winners.length > 0 ? (
                    output.winners.map((team) => (
                      <Chip key={team} variant="soft" color="success">
                        <span className="font-semibold tabular-nums">{team}</span>
                      </Chip>
                    ))
                  ) : (
                    <span className="text-sm">No winners at this event</span>
                  )}
                </dd>
              </>
            ) : null}
            {sets.points ? (
              <>
                <dt className="text-sm text-muted">Points</dt>
                <dd className="text-sm font-semibold tabular-nums">
                  {output.points === null ? "No points at this event" : output.points}
                </dd>
              </>
            ) : null}
            <dt className="text-sm text-muted">Explanation</dt>
            <dd className="text-sm">{output.explanation}</dd>
          </dl>
        </div>
      ) : null}

      <ScriptResultDetails teams={output?.teams ?? []} apiCalls={preview.apiCalls} logs={preview.logs} />
    </div>
  );
}
