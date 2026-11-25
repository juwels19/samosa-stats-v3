"use client";

import {
  Button,
  Description,
  Input,
  Label,
  Spinner,
  TextField,
  toast,
} from "@heroui/react";
import { useAction, useQuery } from "convex/react";
import { SparklesIcon } from "lucide-react";
import { useState } from "react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { MAX_PICK_DISPLAY_NAME_LENGTH } from "./constants";

export default function DisplayNameField({
  displayName,
  disabled = false,
  onDisplayNameChange,
  eventCode,
  teamIds,
  categoryIds,
}: {
  displayName: string;
  disabled?: boolean;
  onDisplayNameChange: (displayName: string) => void;
  /** The event and current selection, for an AI name suggestion. */
  eventCode: string;
  teamIds: Id<"teams">[];
  categoryIds: Id<"categories">[];
}) {
  const suggestDisplayName = useAction(api.picks.suggestDisplayName);
  const suggestionsEnabled =
    useQuery(api.aiSettings.areDisplayNameSuggestionsEnabled) === true;
  const [isSuggesting, setIsSuggesting] = useState(false);

  const suggest = async () => {
    setIsSuggesting(true);
    try {
      onDisplayNameChange(
        await suggestDisplayName({ eventCode, teamIds, categoryIds }),
      );
    } catch (error) {
      toast.danger("No name suggested", {
        description: getErrorMessage(error),
      });
    } finally {
      setIsSuggesting(false);
    }
  };

  return (
    <div className="flex items-start gap-2">
      <TextField
        fullWidth
        value={displayName}
        maxLength={MAX_PICK_DISPLAY_NAME_LENGTH}
        isDisabled={disabled}
        onChange={onDisplayNameChange}
      >
        <Label>Display name (optional)</Label>
        <Input placeholder="Optional name for your picks" autoComplete="off" />
        <Description>
          {MAX_PICK_DISPLAY_NAME_LENGTH - displayName.length} characters left.
          {suggestionsEnabled ? " Suggest uses AI and your picks so far." : ""}
        </Description>
      </TextField>
      {/* Offset by the label height so the button lines up with the input. */}
      {suggestionsEnabled ? (
        <Button
          variant="secondary"
          className="mt-6 shrink-0"
          isDisabled={disabled}
          isPending={isSuggesting}
          onPress={() => void suggest()}
        >
          {({ isPending }) => (
            <>
              {isPending ? (
                <Spinner color="current" size="sm" />
              ) : (
                <SparklesIcon className="size-4" aria-hidden />
              )}
              Suggest
            </>
          )}
        </Button>
      ) : null}
    </div>
  );
}

/** A Convex error message without the request details. */
function getErrorMessage(error: unknown) {
  if (!(error instanceof Error)) return "Try again.";
  return (
    /Uncaught Error: (.*?)(?:\n|$)/.exec(error.message)?.[1] ?? "Try again."
  );
}
