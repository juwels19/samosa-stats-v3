import { Chip } from "@heroui/react";
import type { SerializedWaitlistEntry } from "@/lib/clerk/types";

const STATUS_COLORS: Record<
  SerializedWaitlistEntry["status"],
  "default" | "accent" | "success" | "warning" | "danger"
> = {
  pending: "warning",
  invited: "accent",
  completed: "success",
  rejected: "danger",
};

const STATUS_LABELS: Record<SerializedWaitlistEntry["status"], string> = {
  pending: "Pending",
  invited: "Invited",
  completed: "Completed",
  rejected: "Rejected",
};

export default function WaitlistEntryStatus({
  status,
}: {
  status: SerializedWaitlistEntry["status"];
}) {
  return (
    <Chip size="sm" variant="soft" color={STATUS_COLORS[status]}>
      {STATUS_LABELS[status]}
    </Chip>
  );
}
