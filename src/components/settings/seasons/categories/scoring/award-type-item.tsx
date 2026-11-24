import { Description, Label, ListBox } from "@heroui/react";

import type { TbaAwardTypeInfo } from "../../../../../../convex/lib/scoring/sources/tba_award_types";

/** One award in the award picker. Search also matches former names. */
export default function AwardTypeItem({
  awardType,
}: {
  awardType: TbaAwardTypeInfo;
}) {
  return (
    <ListBox.Item id={String(awardType.value)} textValue={awardType.label}>
      {/* Right padding leaves room for the selected checkmark. */}
      <div className="flex w-full flex-col pr-7">
        <div className="flex items-baseline justify-between gap-3">
          <Label>{awardType.label}</Label>
          <span className="text-xs text-muted tabular-nums">
            {awardType.value}
          </span>
        </div>
        {awardType.formerNames.length > 0 ? (
          <Description>Formerly {awardType.formerNames.join(", ")}</Description>
        ) : null}
      </div>
      <ListBox.ItemIndicator />
    </ListBox.Item>
  );
}
