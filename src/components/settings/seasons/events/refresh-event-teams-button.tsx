"use client";

import { Button } from "@/components/ui/button";
import { getTeamsForYearAndCode } from "@/lib/fetch/frc-events";
import { useMutation } from "convex/react";
import { RefreshCwIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { api } from "../../../../../convex/_generated/api";
import type { Doc } from "../../../../../convex/_generated/dataModel";

export default function RefreshEventTeamsButton({
  event,
  seasonYear,
}: {
  event: Doc<"events">;
  seasonYear: number;
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshTeams = useMutation(api.events.refreshTeams);
  const canRefreshTeams =
    event.status === "UPCOMING" || event.status === "SUBMISSIONS_OPEN";

  if (!canRefreshTeams) {
    return null;
  }

  const handleRefreshTeams = async () => {
    setIsRefreshing(true);

    try {
      const teams = await getTeamsForYearAndCode({
        year: seasonYear,
        eventCode: event.eventCode,
      });
      const result = await refreshTeams({
        eventId: event._id,
        teams,
      });

      toast.success("Teams refreshed", {
        description: `${result.savedTeamCount} teams saved for ${event.displayName}.`,
      });
    } catch (error) {
      toast.error("Teams not refreshed", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      disabled={isRefreshing}
      onClick={handleRefreshTeams}
      data-loading={isRefreshing}
    >
      <RefreshCwIcon
        data-icon="inline-end"
        className="group-data-[loading=true]/button:animate-spin"
      />
      {isRefreshing ? "Refreshing..." : "Refresh teams"}
    </Button>
  );
}
