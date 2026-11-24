"use client";

import { Button, Separator, Spinner, toast } from "@heroui/react";
import { useMutation } from "convex/react";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import SettingsPageHeader from "@/components/settings/common/settings-page-header";
import { api } from "../../../../../../convex/_generated/api";
import type { Doc } from "../../../../../../convex/_generated/dataModel";
import ConfigIssues from "./config-issues";
import { MATCH_SCOPE_OPTIONS, TEAM_SCOPE_OPTIONS } from "./constants";
import {
  checkConfig,
  toFormValues,
  type ScoringFormValues,
} from "./form-values";
import MeasuresSection from "./measures-section";
import OptionSelect from "./option-select";
import ScoringPreview from "./scoring-preview";
import SelectRuleSection from "./select-rule-section";
import ValueSection from "./value-section";
import WinnerModeField from "./winner-mode-field";

/** The scoring form for a loaded category. */
export default function CategoryScoringForm({
  category,
  season,
}: {
  category: Doc<"categories">;
  season: Doc<"seasons">;
}) {
  const setWinnerSource = useMutation(api.categories.setWinnerSource);
  const [isSaving, setIsSaving] = useState(false);
  const form = useForm<ScoringFormValues>({
    defaultValues: toFormValues(category.winnerSource),
  });
  const values = useWatch({ control: form.control }) as ScoringFormValues;
  const check = checkConfig(values, season.year);
  const isManual = values.mode === "manual";

  const save = async () => {
    setIsSaving(true);
    try {
      await setWinnerSource({
        categoryId: category._id,
        winnerSource: isManual
          ? { type: "manual" }
          : { type: "config", config: check.config },
      });
      form.reset(values);
      toast.success("Scoring saved", { description: category.text });
    } catch (error) {
      toast.danger("Scoring not saved", {
        description: error instanceof Error ? error.message : "Try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <SettingsPageHeader
        title={category.text}
        description={category.scoringDescription}
        action={
          <Button
            size="lg"
            className="w-full sm:w-auto"
            isPending={isSaving}
            isDisabled={!isManual && !check.ok}
            onPress={() => void save()}
          >
            {({ isPending }) => (
              <>
                {isPending ? <Spinner color="current" size="sm" /> : null}
                {isPending ? "Saving" : "Save scoring"}
              </>
            )}
          </Button>
        }
      />

      <Controller
        control={form.control}
        name="mode"
        render={({ field }) => (
          <WinnerModeField value={field.value} onChange={field.onChange} />
        )}
      />

      {isManual ? null : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Controller
              control={form.control}
              name="teams"
              render={({ field }) => (
                <OptionSelect
                  label="Teams that can win"
                  value={field.value}
                  options={TEAM_SCOPE_OPTIONS}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              control={form.control}
              name="matches"
              render={({ field }) => (
                <OptionSelect
                  label="Matches"
                  description="Used by TBA and Statbotics match sources."
                  value={field.value}
                  options={MATCH_SCOPE_OPTIONS}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
          <MeasuresSection control={form.control} year={season.year} />
          <ValueSection control={form.control} />
          <SelectRuleSection control={form.control} />
          <ConfigIssues issues={check.issues} />
          <Separator />
          <ScoringPreview config={check.config} defaultYear={season.year} />
        </>
      )}
    </div>
  );
}
