"use client";

import { ComboBox, Description, Input, Label, ListBox } from "@heroui/react";

import {
  TBA_AWARD_TYPES,
  isCurrentAwardType,
} from "../../../../../../convex/lib/scoring/sources/tba_award_types";
import AwardTypeItem from "./award-type-item";
import { matchSearchText } from "./match-search-text";

const CURRENT_AWARDS = TBA_AWARD_TYPES.filter(isCurrentAwardType);
const AWARD_FILTER = matchSearchText(
  new Map(
    TBA_AWARD_TYPES.map((award) => [
      award.label,
      [award.label, ...award.formerNames, String(award.value)].join(" "),
    ]),
  ),
);

/**
 * Picks a TBA award by name. The value is the award type number as text.
 * Lists only awards given in the last audited season, plus the saved award
 * if it is no longer given.
 */
export default function AwardTypeComboBox({
  label = "Award",
  value,
  onChange,
  isDisabled = false,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  isDisabled?: boolean;
}) {
  const selected = TBA_AWARD_TYPES.find(
    (awardType) => String(awardType.value) === value.trim(),
  );
  const options =
    selected && !isCurrentAwardType(selected)
      ? [selected, ...CURRENT_AWARDS]
      : CURRENT_AWARDS;

  return (
    <ComboBox
      fullWidth
      selectedKey={selected ? String(selected.value) : null}
      onSelectionChange={(key) => {
        if (key !== null) onChange(String(key));
      }}
      isInvalid={value.trim() !== "" && selected === undefined}
      isDisabled={isDisabled}
      defaultFilter={AWARD_FILTER}
      menuTrigger="focus"
    >
      <Label>{label}</Label>
      <ComboBox.InputGroup>
        <Input placeholder="Search awards" />
        <ComboBox.Trigger />
      </ComboBox.InputGroup>
      {selected ? (
        <Description>
          Type {selected.value}
          {selected.formerNames.length > 0
            ? ` · formerly ${selected.formerNames.join(", ")}`
            : ""}
          {isCurrentAwardType(selected) ? "" : " · no longer given"}
        </Description>
      ) : value.trim() !== "" ? (
        <Description className="text-danger">
          Award type {value} is not in the list.
        </Description>
      ) : null}
      <ComboBox.Popover>
        <ListBox>
          {options.map((awardType) => (
            <AwardTypeItem key={awardType.value} awardType={awardType} />
          ))}
        </ListBox>
      </ComboBox.Popover>
    </ComboBox>
  );
}
