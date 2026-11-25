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

  const label = {
    config: "Automatic",
    script: "Script",
    leastUnique: "Least unique",
    manual: "Manual",
  }[winnerSource.type];
  return (
    <Chip size="sm" variant="soft" color={winnerSource.type === "manual" ? "default" : "accent"}>
      {label}
    </Chip>
  );
}
