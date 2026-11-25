"use client";

import { Alert, Button } from "@heroui/react";
import { Undo2Icon } from "lucide-react";

/** What the last AI build changed, why, and a way to undo it. */
export default function AiResultBanner({
  result,
  markCount,
  onUndo,
}: {
  result:
    | { status: "ok"; notes: string[] }
    | { status: "unsupported"; reason: string; notes: string[] }
    | { status: "error"; message: string };
  markCount: number;
  onUndo?: () => void;
}) {
  if (result.status === "error") {
    return (
      <Alert status="danger" className="ai-reveal">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Config not built</Alert.Title>
          <Alert.Description>{result.message}</Alert.Description>
        </Alert.Content>
      </Alert>
    );
  }

  if (result.status === "unsupported") {
    return (
      <Alert status="warning" className="ai-reveal">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>No data source can find these winners</Alert.Title>
          <Alert.Description>
            {result.reason} Set the winners by hand with Manual, or change the
            rule and try again.
          </Alert.Description>
        </Alert.Content>
      </Alert>
    );
  }

  return (
    <div className="ai-reveal flex flex-col gap-2 rounded-2xl bg-accent-soft px-4 py-3 text-sm text-accent-soft-foreground">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-medium">
          {markCount === 0
            ? "The AI kept the current config. It already matches the rule."
            : `AI set ${markCount} ${markCount === 1 ? "part" : "parts"} of the config. Check the marked fields and the preview before you save.`}
        </p>
        {onUndo ? (
          <Button
            size="sm"
            variant="ghost"
            className="self-start sm:self-auto"
            onPress={onUndo}
          >
            <Undo2Icon className="size-4" />
            Undo
          </Button>
        ) : null}
      </div>
      {result.notes.length > 0 ? (
        <ul className="list-disc pl-5 opacity-90">
          {result.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
