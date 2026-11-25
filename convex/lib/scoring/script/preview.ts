import { v, type Infer } from "convex/values";

import { scriptApiCallValidator, scriptTeamResultValidator } from "../validators";
import { checkScriptOutput, type ScriptSets } from "./contract";

/** The result of one script run, for the admin and the AI. */
export const scriptPreviewValidator = v.object({
  ok: v.boolean(),
  /** Set when the script ran and its result passed the checks. */
  output: v.union(
    v.object({
      winners: v.union(v.array(v.number()), v.null()),
      points: v.union(v.number(), v.null()),
      explanation: v.string(),
      teams: v.array(scriptTeamResultValidator),
    }),
    v.null(),
  ),
  /** The error the script threw, or why it did not run. */
  error: v.union(v.string(), v.null()),
  /** Problems with the result. */
  issues: v.array(v.string()),
  logs: v.array(v.string()),
  apiCalls: v.array(scriptApiCallValidator),
  ms: v.number(),
  event: v.object({ key: v.string(), submissions: v.number(), teams: v.number() }),
});

export type ScriptPreview = Infer<typeof scriptPreviewValidator>;

type Run =
  | { ok: true; result: unknown; calls: ScriptPreview["apiCalls"]; logs: string[]; ms: number }
  | { ok: false; error: string; calls: ScriptPreview["apiCalls"]; logs: string[]; ms: number };

/** Checks a run's result and turns it into a preview. */
export function toScriptPreview(
  run: Run,
  {
    sets,
    teamNumbers,
    event,
  }: { sets: ScriptSets; teamNumbers: ReadonlySet<number>; event: ScriptPreview["event"] },
): ScriptPreview {
  const base = { logs: run.logs, apiCalls: run.calls, ms: run.ms, event };
  if (!run.ok) {
    return { ...base, ok: false, output: null, error: run.error, issues: [] };
  }
  const checked = checkScriptOutput(run.result, { sets, teamNumbers });
  return checked.ok
    ? { ...base, ok: true, output: checked.output, error: null, issues: [] }
    : { ...base, ok: false, output: null, error: null, issues: checked.issues };
}

/** A short text of a preview, for the AI. */
export function describeScriptPreview(preview: ScriptPreview): string {
  const lines = [
    preview.ok ? "Result: OK" : "Result: FAILED",
    preview.error ? `Error:\n${preview.error}` : "",
    preview.issues.length > 0 ? `Problems:\n- ${preview.issues.join("\n- ")}` : "",
  ];
  if (preview.output) {
    const { winners, points, explanation, teams } = preview.output;
    lines.push(
      `winners: ${winners === null ? "not returned" : winners.length === 0 ? "[]" : winners.join(", ")}`,
      `points: ${points === null ? "null" : points}`,
      `explanation: ${explanation}`,
      teams.length > 0
        ? `teams (first 15 of ${teams.length}):\n${teams
            .slice(0, 15)
            .map((row) => `${row.team}: ${row.value ?? ""} ${row.note ?? ""}`.trim())
            .join("\n")}`
        : "",
    );
  }
  lines.push(
    preview.apiCalls.length > 0
      ? `API calls:\n${preview.apiCalls.map((call) => `${call.service} ${call.path} -> ${call.status ?? "failed"}`).join("\n")}`
      : "",
    preview.logs.length > 0 ? `Logs:\n${preview.logs.join("\n")}` : "",
  );
  return lines.filter(Boolean).join("\n");
}
