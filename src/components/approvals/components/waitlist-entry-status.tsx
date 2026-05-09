import { cn } from "@/lib/utils";
import type { SerializedWaitlistEntry } from "@/lib/clerk/types";

const statusClassNames: Record<SerializedWaitlistEntry["status"], string> = {
  pending: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  invited: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
  completed:
    "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  rejected: "bg-destructive/10 text-destructive",
};

export default function WaitlistEntryStatus({
  status,
}: {
  status: SerializedWaitlistEntry["status"];
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize",
        statusClassNames[status]
      )}
    >
      {status}
    </span>
  );
}
