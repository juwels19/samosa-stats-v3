"use client";

import { Skeleton } from "@heroui/react";
import EmptyState from "@/components/common/empty-state";
import { useConvexAuth, useQuery } from "convex/react";
import { CalendarX2Icon } from "lucide-react";

import { api } from "../../../convex/_generated/api";
import PicksSubmissionForm from "./picks-submission-form";

export default function SubmitPicks({ eventCode }: { eventCode: string }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const data = useQuery(
    api.picks.getForEventSubmission,
    isAuthenticated ? { eventCode } : "skip",
  );

  if (isLoading || data === undefined) {
    return (
      <div className="flex flex-col gap-6 px-4 pt-1 sm:px-6">
        <Skeleton className="h-9 w-2/3 rounded-xl" />
        <Skeleton className="h-16 max-w-md rounded-2xl" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-16 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="px-4 pt-1 sm:px-6">
        <EmptyState
          icon={<CalendarX2Icon />}
          title="Event not found"
          description="This event is not part of the active season."
        />
      </div>
    );
  }

  return <PicksSubmissionForm eventCode={eventCode} data={data} />;
}
