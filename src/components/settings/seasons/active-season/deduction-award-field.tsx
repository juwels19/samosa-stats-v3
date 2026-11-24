"use client";

import { toast } from "@heroui/react";
import { useMutation } from "convex/react";
import { useState } from "react";

import AwardTypeComboBox from "@/components/settings/seasons/categories/scoring/award-type-combo-box";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

/** The season's deduction award. Saves as soon as an award is chosen. */
export default function DeductionAwardField({
  seasonId,
  awardType,
}: {
  seasonId: Id<"seasons">;
  awardType: number | undefined;
}) {
  const setDeductionAward = useMutation(api.seasons.setDeductionAward);
  const [isSaving, setIsSaving] = useState(false);

  const save = async (value: string) => {
    const next = Number(value);
    if (!Number.isInteger(next) || next === awardType) return;

    setIsSaving(true);
    try {
      await setDeductionAward({ seasonId, awardType: next });
      toast.success("Deduction award saved");
    } catch (error) {
      toast.danger("Deduction award not saved", {
        description: error instanceof Error ? error.message : "Try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-default p-4">
      <AwardTypeComboBox
        label="Deduction award"
        value={awardType === undefined ? "" : String(awardType)}
        onChange={(value) => void save(value)}
        isDisabled={isSaving}
      />
      <p className="text-sm text-muted">
        A player loses the top category&apos;s value for each picked team that wins
        this award. A change applies only to events that are not final.
      </p>
    </div>
  );
}
