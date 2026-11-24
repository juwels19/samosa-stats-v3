import { Chip } from "@heroui/react";

import type { Doc } from "../../../../../../convex/_generated/dataModel";

/** Shows whether a category's winners are automatic, manual or not set up. */
export default function WinnerSourceChip({
  winnerSource,
}: {
  winnerSource: Doc<"categories">["winnerSource"];
}) {
  if (winnerSource === undefined) {
    return (
      <Chip size="sm" variant="soft" color="warning">
        Scoring not set up
      </Chip>
    );
  }

  return (
    <Chip
      size="sm"
      variant="soft"
      color={winnerSource.type === "config" ? "accent" : "default"}
    >
      {winnerSource.type === "config" ? "Automatic" : "Manual"}
    </Chip>
  );
}
