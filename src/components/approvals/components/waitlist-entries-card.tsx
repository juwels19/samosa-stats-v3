import ApprovalsEmptyState from "@/components/approvals/components/approvals-empty-state";
import WaitlistTable from "@/components/approvals/components/waitlist-table";
import type { WaitlistEntryAction } from "@/components/approvals/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SerializedWaitlistEntry } from "@/lib/clerk/types";

export default function WaitlistEntriesCard({
  entries,
  inviteAction,
  revokeAction,
}: {
  entries: SerializedWaitlistEntry[];
  inviteAction: WaitlistEntryAction;
  revokeAction: WaitlistEntryAction;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Waitlist Entries</CardTitle>
        <CardDescription>
          {entries.length === 1
            ? "1 current waitlist entry"
            : `${entries.length} current waitlist entries`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <ApprovalsEmptyState />
        ) : (
          <WaitlistTable
            entries={entries}
            inviteAction={inviteAction}
            revokeAction={revokeAction}
          />
        )}
      </CardContent>
    </Card>
  );
}
