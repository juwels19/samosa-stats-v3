import { Chip } from "@heroui/react";
import type { Doc } from "../../../convex/_generated/dataModel";
import { EVENT_STATUS_CHIP_COLORS, EVENT_STATUS_LABELS } from "./constants";

export default function EventStatusChip({
  status,
}: {
  status: Doc<"events">["status"];
}) {
  return (
    <Chip size="sm" variant="soft" color={EVENT_STATUS_CHIP_COLORS[status]}>
      {EVENT_STATUS_LABELS[status]}
    </Chip>
  );
}
