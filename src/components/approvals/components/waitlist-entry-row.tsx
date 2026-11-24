import WaitlistEntryActions from "@/components/approvals/components/waitlist-entry-actions";
import WaitlistEntryStatus from "@/components/approvals/components/waitlist-entry-status";
import { formatApprovalDate } from "@/components/approvals/format-approval-date";
import type { WaitlistEntryAction } from "@/components/approvals/types";
import type { SerializedWaitlistEntry } from "@/lib/clerk/types";

/** Card on phones and tablets (two columns from sm), one dense row from lg up. */
export default function WaitlistEntryRow({
  entry,
  inviteAction,
  revokeAction,
}: {
  entry: SerializedWaitlistEntry;
  inviteAction: WaitlistEntryAction;
  revokeAction: WaitlistEntryAction;
}) {
  const date = (
    <time dateTime={new Date(entry.createdAt).toISOString()}>
      {formatApprovalDate(entry.createdAt)}
    </time>
  );

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 lg:grid lg:grid-cols-[minmax(0,1fr)_7rem_10rem_9rem] lg:items-center lg:gap-4 lg:rounded-none lg:border-0 lg:border-b lg:bg-transparent lg:px-2 lg:py-2.5 lg:last:border-b-0">
      <div className="flex items-start justify-between gap-3 lg:block lg:min-w-0">
        <div className="min-w-0">
          <p className="font-medium break-all lg:truncate lg:break-normal">
            {entry.emailAddress}
          </p>
          {entry.invitation ? (
            <p className="text-xs text-muted">Invitation {entry.invitation.status}</p>
          ) : null}
        </div>
        <div className="shrink-0 lg:hidden">
          <WaitlistEntryStatus status={entry.status} />
        </div>
      </div>

      <div className="hidden lg:block">
        <WaitlistEntryStatus status={entry.status} />
      </div>
      <p className="hidden text-sm text-muted lg:block">{date}</p>

      {/* Footer on cards: date left, actions right. Only the actions column on lg. */}
      <div className="mt-auto flex min-h-10 items-center justify-between gap-3 border-t border-separator pt-3 lg:mt-0 lg:min-h-0 lg:justify-end lg:border-0 lg:pt-0">
        <p className="text-sm text-muted lg:hidden">{date}</p>
        <WaitlistEntryActions
          entry={entry}
          inviteAction={inviteAction}
          revokeAction={revokeAction}
        />
      </div>
    </li>
  );
}
