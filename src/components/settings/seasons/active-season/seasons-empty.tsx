import EmptyState from "@/components/common/empty-state";
import { CalendarIcon } from "lucide-react";

export default function SeasonsEmptyState() {
  return (
    <EmptyState
      icon={<CalendarIcon />}
      title="No seasons loaded"
      description="Add a season to get its game name and show it here."
    />
  );
}
