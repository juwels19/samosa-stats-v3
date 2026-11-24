"use client";

import { Button, Spinner, toast } from "@heroui/react";
import { useAction } from "convex/react";
import { RefreshCwIcon } from "lucide-react";
import { useState } from "react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

/** Gets the latest event data and saves the automatic category winners. */
export default function CalculateWinnersButton({
  eventId,
  isDisabled,
}: {
  eventId: Id<"events">;
  isDisabled: boolean;
}) {
  const calculate = useAction(api.scoring.calculateEventWinners);
  const [isRunning, setIsRunning] = useState(false);

  const run = async () => {
    setIsRunning(true);
    try {
      const result = await calculate({ eventId });
      if (result.errors > 0) {
        toast.warning("Some winners not calculated", {
          description: `${result.calculated} calculated, ${result.errors} failed. See each category for the error.`,
        });
      } else {
        toast.success("Winners calculated", {
          description: `${result.calculated} automatic categories updated.`,
        });
      }
    } catch (error) {
      toast.danger("Winners not calculated", {
        description: error instanceof Error ? error.message : "Try again.",
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Button
      size="lg"
      className="w-full sm:w-auto"
      isPending={isRunning}
      isDisabled={isDisabled}
      onPress={() => void run()}
    >
      {({ isPending }) => (
        <>
          {isPending ? (
            <Spinner color="current" size="sm" />
          ) : (
            <RefreshCwIcon className="size-4" aria-hidden />
          )}
          {isPending ? "Calculating" : "Calculate winners"}
        </>
      )}
    </Button>
  );
}
