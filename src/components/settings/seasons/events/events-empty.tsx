import EmptyState from "@/components/common/empty-state";
import { CalendarPlusIcon } from "lucide-react";

export default function EventsEmptyState({
  hasActiveSeason,
}: {
  hasActiveSeason: boolean;
}) {
  return (
    <EmptyState
      icon={<CalendarPlusIcon />}
      title={hasActiveSeason ? "No events yet" : "No active season"}
      description={
        hasActiveSeason
          ? "Add an event to start collecting picks for this season."
          : "Choose an active season before you add events."
      }
    />
  );
}
