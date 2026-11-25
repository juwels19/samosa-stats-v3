"use client";

import {
  Button,
  Description,
  Input,
  Label,
  Spinner,
  TextArea,
  TextField,
} from "@heroui/react";
import { useAction } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { SparklesIcon } from "lucide-react";
import { useState } from "react";

import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";

export type GenerationResult = FunctionReturnType<
  typeof api.scoring.generateConfig
>;

/**
 * Asks the AI for a config from a plain-language rule. The model explores
 * the data on the example event and tests its config there.
 */
export default function AiConfigPrompt({
  categoryId,
  defaultDescription,
  defaultEventCode,
  onResult,
  onError,
}: {
  categoryId: Id<"categories">;
  defaultDescription: string;
  defaultEventCode: string;
  onResult: (result: GenerationResult, eventCode: string) => void;
  onError: (message: string) => void;
}) {
  const generateConfig = useAction(api.scoring.generateConfig);
  const [description, setDescription] = useState(defaultDescription);
  const [eventCode, setEventCode] = useState(defaultEventCode);
  const [isGenerating, setIsGenerating] = useState(false);
  const canGenerate =
    description.trim() !== "" && /^[A-Za-z0-9]+$/.test(eventCode.trim());

  const generate = async () => {
    if (!canGenerate) return;
    setIsGenerating(true);
    try {
      const code = eventCode.trim();
      onResult(
        await generateConfig({
          categoryId,
          description: description.trim(),
          eventCode: code,
        }),
        code,
      );
    } catch (error) {
      onError(error instanceof Error ? error.message : "Try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <form
      className="flex flex-col gap-3 rounded-2xl bg-surface p-4"
      onSubmit={(event) => {
        event.preventDefault();
        void generate();
      }}
    >
      <TextField fullWidth value={description} onChange={setDescription}>
        <Label>Describe how this category is won</Label>
        <TextArea rows={2} />
        <Description>
          Starts from the scoring description. The AI fills in the config below,
          and you can edit any field after.
        </Description>
      </TextField>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <TextField
          className="sm:w-48"
          value={eventCode}
          onChange={setEventCode}
        >
          <Label>Example event</Label>
          <Input placeholder="onosh" autoComplete="off" className="font-mono" />
        </TextField>
        <Button
          type="submit"
          variant="secondary"
          isPending={isGenerating}
          isDisabled={!canGenerate}
        >
          {({ isPending }) => (
            <>
              {isPending ? (
                <Spinner color="current" size="sm" />
              ) : (
                <SparklesIcon className="size-4" />
              )}
              {isPending ? "Building config" : "Build config"}
            </>
          )}
        </Button>
      </div>
      {isGenerating ? (
        <p className="text-sm text-muted" aria-live="polite">
          Reading the data for {eventCode.trim().toLowerCase()} and testing
          configs. This can take up to a minute.
        </p>
      ) : null}
    </form>
  );
}
