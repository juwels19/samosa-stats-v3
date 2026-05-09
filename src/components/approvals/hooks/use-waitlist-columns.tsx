import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import type { SerializedWaitlistEntry } from "@/lib/clerk/types";
import { ArrowUpDownIcon } from "lucide-react";
import WaitlistEntryActions from "@/components/approvals/components/waitlist-entry-actions";
import { WaitlistEntryAction } from "@/components/approvals/types";
import { DATE_FORMATTER } from "@/components/approvals/constants";
import WaitlistEntryStatus from "@/components/approvals/components/waitlist-entry-status";

export default function useWaitlistColumns({
  inviteAction,
  revokeAction,
}: {
  inviteAction: WaitlistEntryAction;
  revokeAction: WaitlistEntryAction;
}) {
  const columns: ColumnDef<SerializedWaitlistEntry>[] = [
    {
      accessorKey: "emailAddress",
      header: ({ column }) => (
        <Button
          type="button"
          variant="ghost"
          className="-ml-3"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDownIcon data-icon="inline-end" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="min-w-48">
          <div className="truncate font-medium">
            {row.original.emailAddress}
          </div>
          {row.original.invitation && (
            <div className="text-xs text-muted-foreground">
              Invitation {row.original.invitation.status}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <WaitlistEntryStatus status={row.original.status} />,
      filterFn: (row, columnId, filterValue) => {
        return String(row.getValue(columnId))
          .toLowerCase()
          .includes(String(filterValue).toLowerCase());
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button
          type="button"
          variant="ghost"
          className="-ml-3"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created
          <ArrowUpDownIcon data-icon="inline-end" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {DATE_FORMATTER.format(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => (
        <WaitlistEntryActions
          entry={row.original}
          inviteAction={inviteAction}
          revokeAction={revokeAction}
        />
      ),
    },
  ];
  return columns;
}
