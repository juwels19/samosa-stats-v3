import EmptyState from "@/components/common/empty-state";
import { InboxIcon } from "lucide-react";

export default function ApprovalsEmptyState() {
  return (
    <EmptyState
      icon={<InboxIcon />}
      title="No approvals to review"
      description="New waitlist sign-ups show here when someone asks to join Samosa Stats."
    />
  );
}
