"use client";

import { Button, Separator, Spinner, toast } from "@heroui/react";
import { useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import SettingsPageHeader from "@/components/settings/common/settings-page-header";
import { api } from "../../../../../../convex/_generated/api";
import type { Doc } from "../../../../../../convex/_generated/dataModel";
import { parseGlobalValueFormula } from "../../../../../../convex/lib/scoring/global_value";
import { getScriptSets } from "../../../../../../convex/lib/scoring/script/contract";
import type { WinnerConfig } from "../../../../../../convex/lib/scoring/winner_config";
import AiConfigPrompt, { type GenerationResult } from "./ai-config-prompt";
import { AiMark, AiMarksProvider } from "./ai-marks";
import AiResultBanner from "./ai-result-banner";
import ConfigIssues from "./config-issues";
import { diffFormValues, markKeyForPath, type MarkKey } from "./form-diff";
import {
  MATCH_SCOPE_OPTIONS,
  POINTS_SOURCE_OPTIONS,
  TEAM_SCOPE_OPTIONS,
  WINNER_MODE_OPTIONS,
} from "./constants";
import {
  checkConfig,
  toFormValues,
  type ScoringFormValues,
} from "./form-values";
import MeasuresSection from "./measures-section";
import OptionSelect from "./option-select";
import ScoringPreview from "./scoring-preview";
import ScoringStep from "./scoring-step";
import ScoringSummary from "./scoring-summary";
import ScriptSection, { scriptCheckKey } from "./script-section";
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
  const mode = values.mode;
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
  const [pointsSource, setPointsSource] = useState<"formula" | "script" | "manual">(
    category.pointsSource ?? "formula",
  );
  const usesFormula = category.isGlobal && pointsSource === "formula";
  const formulaError =
    usesFormula && parsedFormula !== null && !parsedFormula.ok ? parsedFormula.message : null;

  // The script, when the winners or the points come from one.
  const sets = {
    winners: mode === "script",
    points: category.isGlobal && pointsSource === "script",
  };
  const usesScript = sets.winners || sets.points;
  const [scriptCode, setScriptCode] = useState(category.script?.code ?? "");
  const [scriptDescription, setScriptDescription] = useState(
    category.script?.description ?? category.scoringDescription,
  );
  // A saved script passed its run when it was saved.
  const [scriptCheck, setScriptCheck] = useState<{ key: string; ok: boolean } | null>(() => {
    const savedSets = getScriptSets(category);
    return category.script && savedSets
      ? { key: scriptCheckKey(category.script.code, savedSets), ok: true }
      : null;
  });
  const scriptIssue = !usesScript
    ? null
    : scriptCode.trim() === ""
      ? "Write the script, or paste one, before you save."
      : scriptCheck?.key !== scriptCheckKey(scriptCode, sets)
        ? "Run the script on the example event before you save."
        : scriptCheck.ok
          ? null
          : "The script failed its last run. Fix it before you save.";

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

  // One script editor, in the step that needs it first.
  const scriptSection = (
    <ScriptSection
      categoryId={category._id}
      sets={sets}
      code={scriptCode}
      onCodeChange={setScriptCode}
      description={scriptDescription}
      onDescriptionChange={setScriptDescription}
      defaultEventCode={exampleEventCode ?? ""}
      onChecked={(key, ok) => setScriptCheck({ key, ok })}
    />
  );
  const issues = [
    ...(mode === "config" ? check.issues : []),
    ...(mode === "config" && apiIssue ? [apiIssue] : []),
    ...(scriptIssue ? [scriptIssue] : []),
    ...(formulaError ? ["Fix the points formula in step 2."] : []),
  ];

  const save = async () => {
    setIsSaving(true);
    try {
      await setWinnerSource({
        categoryId: category._id,
        winnerSource:
          mode === "config" ? { type: "config", config: check.config } : { type: mode },
        ...(category.isGlobal ? { valueFormula, pointsSource } : {}),
        ...(scriptCode.trim()
          ? { script: { code: scriptCode, description: scriptDescription } }
          : {}),
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
              formulaError !== null ||
              scriptIssue !== null ||
              (mode === "config" && (!check.ok || apiIssue !== null))
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

      <ScoringSummary
        isGlobal={category.isGlobal}
        mode={mode}
        isConfigReady={check.ok}
        pointsSource={pointsSource}
        valueFormula={valueFormula}
      />

      <ScoringStep
        number={1}
        title="Who wins"
        description="How the winners are found at each event."
      >
        <Controller
          control={form.control}
          name="mode"
          render={({ field }) => (
            <WinnerModeField
              label="Who wins"
              options={
                category.isGlobal
                  ? WINNER_MODE_OPTIONS
                  : WINNER_MODE_OPTIONS.filter((option) => option.value !== "leastUnique")
              }
              value={field.value}
              onChange={(next) => {
                // The usual least unique deduction. The admin can change it.
                if (next === "leastUnique" && valueFormula.trim() === "") {
                  setValueFormula("-topTeamValue");
                }
                // Per-team points are set with manual winners only.
                if (next !== "manual" && pointsSource === "manual") {
                  setPointsSource("formula");
                }
                field.onChange(next);
              }}
            />
          )}
        />

        {mode === "manual" ? (
          <p className="text-sm text-muted">
            Nothing to set up. Select the winning teams on the event&apos;s Scores page after the event.
          </p>
        ) : null}

        {mode === "leastUnique" ? (
          <p className="text-sm text-muted">
            Nothing to set up. A submission&apos;s uniqueness is the sum of the picks of its teams. The submission
            with the highest uniqueness wins. A tie goes to the submission with more picks on its most picked
            team, then its next team, and so on. Submissions still tied all win.
          </p>
        ) : null}

        {mode === "script" ? scriptSection : null}

        {mode !== "config" ? null : (
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
      </ScoringStep>

      <ScoringStep
        number={2}
        title={mode === "leastUnique" ? "Points for the winning submission" : "Points for each winning team"}
        description={
          category.isGlobal
            ? "How many points a win gives at each event."
            : "Set by the picks. Nothing to set up."
        }
      >
        {category.isGlobal ? (
          <>
            <WinnerModeField
              label="Points"
              options={
                mode === "manual"
                  ? POINTS_SOURCE_OPTIONS
                  : POINTS_SOURCE_OPTIONS.filter((option) => option.value !== "manual")
              }
              value={pointsSource}
              onChange={setPointsSource}
            />
            {pointsSource === "manual" ? (
              <p className="text-sm text-muted">
                Nothing to set up here. On the event&apos;s Scores page, set each winning team&apos;s points next to
                the winners. Use a negative number for a deduction.
              </p>
            ) : usesFormula ? (
              <ValueFormulaSection
                value={valueFormula}
                error={formulaError}
                onChange={setValueFormula}
              />
            ) : mode === "script" ? (
              <p className="text-sm text-muted">
                The AI script in step 1 returns the points too. Say how many points in its rule.
              </p>
            ) : (
              scriptSection
            )}
          </>
        ) : (
          <p className="text-sm text-muted">
            Each winning team a player picked gives the category&apos;s picks + 1 points. When this is the most
            picked category, it gives 0, or a share when categories tie.
          </p>
        )}
      </ScoringStep>

      <ConfigIssues issues={issues} />
    </div>
  );
}
