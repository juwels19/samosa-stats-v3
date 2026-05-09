import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { InboxIcon } from "lucide-react";

export default function ApprovalsEmptyState() {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <InboxIcon />
        </EmptyMedia>
        <EmptyTitle>No approvals to review</EmptyTitle>
        <EmptyDescription>
          New Clerk waitlist signups will appear here when someone asks to join
          Samosa Stats.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
