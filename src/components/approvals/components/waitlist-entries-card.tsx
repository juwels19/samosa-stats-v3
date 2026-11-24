import ApprovalsEmptyState from "@/components/approvals/components/approvals-empty-state";
import WaitlistList from "@/components/approvals/components/waitlist-list";
import type { WaitlistEntryAction } from "@/components/approvals/types";
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
    <section aria-labelledby="waitlist-heading" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="waitlist-heading" className="font-heading text-lg font-semibold">
          Waitlist entries
        </h2>
        <p className="text-sm text-muted">
          {entries.length === 1
            ? "1 current waitlist entry"
            : `${entries.length} current waitlist entries`}
        </p>
      </div>
      {entries.length === 0 ? (
        <ApprovalsEmptyState />
      ) : (
        <WaitlistList
          entries={entries}
          inviteAction={inviteAction}
          revokeAction={revokeAction}
        />
      )}
    </section>
  );
}
