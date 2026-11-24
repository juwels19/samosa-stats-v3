"use client";

import { toast } from "@heroui/react";
import { useMutation } from "convex/react";
import { useState } from "react";
import { getTeamsForYearAndCode } from "@/lib/fetch/frc-events";
import { api } from "../../../../../convex/_generated/api";
import type { Doc } from "../../../../../convex/_generated/dataModel";

type PendingAction = { eventId: string; action: "refresh" | "random" } | null;

/** Refresh teams and generate a random pick, with one shared pending state. */
export function useEventActions(seasonYear: number | null) {
  const [pending, setPending] = useState<PendingAction>(null);
  const refreshTeams = useMutation(api.events.refreshTeams);
  const generateRandomPick = useMutation(api.picks.generateRandom);

  async function runRefreshTeams(event: Doc<"events">) {
    if (seasonYear === null) return;
    setPending({ eventId: event._id, action: "refresh" });
    try {
      const teams = await getTeamsForYearAndCode({
        year: seasonYear,
        eventCode: event.eventCode,
      });
      const result = await refreshTeams({ eventId: event._id, teams });
      toast.success("Teams refreshed", {
        description: `${result.savedTeamCount} teams saved for ${event.displayName}.`,
      });
    } catch (error) {
      toast.danger("Teams not refreshed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setPending(null);
    }
  }

  async function runRandomPick(event: Doc<"events">) {
    setPending({ eventId: event._id, action: "random" });
    try {
      const result = await generateRandomPick({ eventCode: event.eventCode });
      toast.success("Random pick generated", {
        description: `${event.displayName} saved as a ${
          result.isRandom ? "random" : "manual"
        } pick.`,
      });
    } catch (error) {
      toast.danger("Random pick not generated", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setPending(null);
    }
  }

  return {
    isPending: (eventId: string) => pending?.eventId === eventId,
    refreshTeams: runRefreshTeams,
    randomPick: runRandomPick,
  };
}
