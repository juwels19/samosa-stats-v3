"use client";

import { Button, Separator, Spinner, toast } from "@heroui/react";
import { useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import SettingsPageHeader from "@/components/settings/common/settings-page-header";
import { api } from "../../../../../../convex/_generated/api";
import type { Doc } from "../../../../../../convex/_generated/dataModel";
import { parseGlobalValueFormula } from "../../../../../../convex/lib/scoring/global_value";
import type { WinnerConfig } from "../../../../../../convex/lib/scoring/winner_config";
import AiConfigPrompt, { type GenerationResult } from "./ai-config-prompt";
import { AiMark, AiMarksProvider } from "./ai-marks";
import AiResultBanner from "./ai-result-banner";
import ConfigIssues from "./config-issues";
import { diffFormValues, markKeyForPath, type MarkKey } from "./form-diff";
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
import ValueFormulaSection from "./value-formula-section";
import ValueSection from "./value-section";
import WinnerModeField from "./winner-mode-field";

/** The scoring form for a loaded category. */
type AiState =
  | { status: "ok"; notes: string[]; undo: ScoringFormValues }
  | { status: "unsupported"; reason: string; notes: string[] }
  | { status: "error"; message: string };

export default function CategoryScoringForm({
  category,
  season,
  exampleEventCode,
}: {
  category: Doc<"categories">;
  season: Doc<"seasons">;
  exampleEventCode: string | null;
}) {
  const setWinnerSource = useMutation(api.categories.setWinnerSource);
  const [isSaving, setIsSaving] = useState(false);
  const form = useForm<ScoringFormValues>({
    defaultValues: toFormValues(category.winnerSource),
  });
  const values = useWatch({ control: form.control }) as ScoringFormValues;
  const check = checkConfig(values, season.year);
  const isManual = values.mode === "manual";
  const [marks, setMarks] = useState<ReadonlySet<MarkKey>>(new Set());
  const [ai, setAi] = useState<AiState | null>(null);
  const [autoRun, setAutoRun] = useState<{
    key: number;
    eventCode: string;
    config: WinnerConfig;
  } | null>(null);
  const [apiCheck, setApiCheck] = useState<{ key: string; ok: boolean } | null>(
    null,
  );
  // Global categories only. Empty means no value yet.
  const [valueFormula, setValueFormula] = useState(category.valueFormula ?? "");
  const parsedFormula =
    valueFormula.trim() === "" ? null : parseGlobalValueFormula(valueFormula);
  const formulaError =
    parsedFormula !== null && !parsedFormula.ok ? parsedFormula.message : null;

  // An edit to a marked field clears its mark.
  useEffect(() => {
    return form.subscribe({
      formState: { values: true },
      callback: ({ name }) => {
        const key = name ? markKeyForPath(name) : null;
        if (key === null) return;
        setMarks((current) => {
          if (!current.has(key)) return current;
          const next = new Set(current);
          next.delete(key);
          return next;
        });
      },
    });
  }, [form]);

  // Custom sources have no schema, so a passing preview of this exact
  // config is required before it can be saved.
  const hasApiSource =
    check.config !== null &&
    Object.values(check.config.measures).some(
      (measure) => measure.source === "api",
    );
  const configKey = check.config === null ? null : JSON.stringify(check.config);
  const apiIssue = !hasApiSource
    ? null
    : apiCheck?.key !== configKey
      ? "Run the preview to check the custom sources before you save."
      : apiCheck.ok
        ? null
        : "A custom source failed its check. See the preview.";

  const applyGeneration = (result: GenerationResult, eventCode: string) => {
    if (result.status === "unsupported") {
      setAi(result);
      return;
    }
    const before = form.getValues();
    const after = toFormValues({ type: "config", config: result.config });
    form.reset(after, { keepDefaultValues: true });
    setMarks(new Set(diffFormValues(before, after)));
    setAi({ status: "ok", notes: result.notes, undo: before });
    const generated = checkConfig(after, season.year);
    if (generated.ok) {
      setAutoRun((current) => ({
        key: (current?.key ?? 0) + 1,
        eventCode,
        config: generated.config,
      }));
    }
  };

  const undoGeneration = () => {
    if (ai?.status !== "ok") return;
    form.reset(ai.undo, { keepDefaultValues: true });
    setMarks(new Set());
    setAi(null);
  };

  const save = async () => {
    setIsSaving(true);
    try {
      await setWinnerSource({
        categoryId: category._id,
        winnerSource: isManual
          ? { type: "manual" }
          : { type: "config", config: check.config },
        ...(category.isGlobal ? { valueFormula } : {}),
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
            isDisabled={
              formulaError !== null || (!isManual && (!check.ok || apiIssue !== null))
            }
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

      {category.isGlobal ? (
        <ValueFormulaSection
          value={valueFormula}
          error={formulaError}
          onChange={setValueFormula}
        />
      ) : null}

      {isManual ? null : (
        <AiMarksProvider value={marks}>
          <AiConfigPrompt
            categoryId={category._id}
            defaultDescription={category.scoringDescription}
            defaultEventCode={exampleEventCode ?? ""}
            onResult={applyGeneration}
            onError={(message) => setAi({ status: "error", message })}
          />
          {ai ? (
            <AiResultBanner
              result={ai}
              markCount={marks.size}
              onUndo={ai.status === "ok" ? undoGeneration : undefined}
            />
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <AiMark name="teams">
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
            </AiMark>
            <AiMark name="matches">
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
            </AiMark>
          </div>
          <MeasuresSection control={form.control} year={season.year} />
          <ValueSection control={form.control} />
          <SelectRuleSection control={form.control} />
          <ConfigIssues
            issues={apiIssue ? [...check.issues, apiIssue] : check.issues}
          />
          <Separator />
          <ScoringPreview
            config={check.config}
            defaultYear={season.year}
            defaultEventCode={exampleEventCode ?? ""}
            autoRun={autoRun}
            onRun={(ranConfig, result) =>
              setApiCheck({
                key: JSON.stringify(ranConfig),
                ok: result.apiChecks.every(
                  (apiCheckResult) => apiCheckResult.ok,
                ),
              })
            }
          />
        </AiMarksProvider>
      )}
    </div>
  );
}
