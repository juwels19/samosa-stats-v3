import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { CalendarIcon } from "lucide-react";

export default function SeasonsEmptyState() {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CalendarIcon />
        </EmptyMedia>
        <EmptyTitle>No seasons loaded</EmptyTitle>
        <EmptyDescription>
          Add a season to fetch its game name and make it available here.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
