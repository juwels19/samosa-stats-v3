"use client";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
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
      <div className="flex flex-col gap-5 px-4 py-4 sm:px-6">
        <Skeleton className="h-56 rounded-4xl" />
        <div className="grid gap-5 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-4xl" />
          <Skeleton className="h-80 rounded-4xl" />
        </div>
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="px-4 py-4 sm:px-6">
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarX2Icon />
            </EmptyMedia>
            <EmptyTitle>Event not found</EmptyTitle>
            <EmptyDescription>
              This event is not part of the active season.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return <PicksSubmissionForm eventCode={eventCode} data={data} />;
}
