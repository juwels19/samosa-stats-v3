import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { CalendarPlusIcon } from "lucide-react";

export default function EventsEmptyState({
  hasActiveSeason,
}: {
  hasActiveSeason: boolean;
}) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CalendarPlusIcon />
        </EmptyMedia>
        <EmptyTitle>
          {hasActiveSeason ? "No events yet" : "No active season"}
        </EmptyTitle>
        <EmptyDescription>
          {hasActiveSeason
            ? "Add an event to start collecting picks for this season."
            : "Choose an active season before adding events."}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
