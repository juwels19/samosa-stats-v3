import { tool } from "ai";
import * as z from "zod";

import { listFieldPaths } from "../field_paths";
import { runConfigOnEvent } from "../run_config";
import { API_SERVICES, fetchApi, summarizeResponse } from "../sources/api_source";
import { SCORING_SOURCES, winnerConfigSchema, type WinnerConfig } from "../winner_config";
import { findUnknownFields } from "../field_paths";
import { configOutputSchema, toConfigInput, type ConfigOutput } from "./output";

export type CheckedOutput =
  | { ok: true; config: WinnerConfig }
  | { ok: false; issues: string[] };

/** Turns the model's config into a checked config, or lists its problems. */
export function checkConfigOutput(output: ConfigOutput, year: number): CheckedOutput {
  const names = output.measures.map((measure) => measure.name);
  const duplicate = names.find((name, index) => names.indexOf(name) !== index);
  if (duplicate) return { ok: false, issues: [`Two measures are named "${duplicate}".`] };

  const parsed = winnerConfigSchema.safeParse(toConfigInput(output));
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((issue) =>
        issue.path.length > 0 ? `${issue.path.join(".")}: ${issue.message}` : issue.message,
      ),
    };
  }
  const unknown = findUnknownFields(parsed.data, year);
  if (unknown.length > 0) {
    return {
      ok: false,
      issues: unknown.map((issue) => `${issue.measure}: "${issue.field}" is not a ${issue.source} field in ${year}.`),
    };
  }
  return { ok: true, config: parsed.data };
}

/** Read-only tools for exploring data and testing a config on one event. */
export function createGenerationTools({ year, eventCode }: { year: number; eventCode: string }) {
  return {
    listFields: tool({
      description: "List the field paths of a typed source in this season, with the allowed values of fixed-value fields.",
      inputSchema: z.object({ source: z.enum(SCORING_SOURCES) }),
      execute: async ({ source }) => {
        const fields = listFieldPaths(source, year);
        const values = Object.entries(fields.valueOptions)
          .filter(([, options]) => options.length <= 12)
          .map(([path, options]) => `${path}: ${options.join(", ")}`);
        return [
          `Fields (${fields.paths.length}):`,
          fields.paths.slice(0, 400).join("\n"),
          fields.openPrefixes.length > 0 ? `Any path under: ${fields.openPrefixes.join(", ")}` : "",
          values.length > 0 ? `Fixed values:\n${values.join("\n")}` : "",
        ]
          .filter(Boolean)
          .join("\n\n");
      },
    }),
    fetchEndpoint: tool({
      description: "Get an event-scoped endpoint for the example event and see its shape and a sample. Use placeholders {eventKey}, {eventCode} and {year} in the path.",
      inputSchema: z.object({
        service: z.enum(API_SERVICES),
        path: z.string().describe("For example /event/{eventKey}/matches"),
      }),
      execute: async ({ service, path }) => {
        try {
          return summarizeResponse(await fetchApi(service, path, { year, eventCode }));
        } catch (error) {
          return `Error: ${error instanceof Error ? error.message : "the request failed."}`;
        }
      },
    }),
    tryConfig: tool({
      description: "Check a config and run it on the example event. Returns problems, or the winners, each team's values and custom source checks.",
      inputSchema: z.object({ config: configOutputSchema }),
      execute: async ({ config }) => {
        const checked = checkConfigOutput(config, year);
        if (!checked.ok) return `Problems:\n- ${checked.issues.join("\n- ")}`;
        try {
          return describeRun(await runConfigOnEvent(checked.config, { year, eventCode }));
        } catch (error) {
          return `Error: ${error instanceof Error ? error.message : "the run failed."}`;
        }
      },
    }),
  };
}

function describeRun(run: Awaited<ReturnType<typeof runConfigOnEvent>>) {
  const withValue = run.teams.filter((team) => team.value !== null);
  const excluded = run.teams.reduce<Record<string, number>>((counts, team) => {
    if (team.excludedReason) counts[team.excludedReason] = (counts[team.excludedReason] ?? 0) + 1;
    return counts;
  }, {});
  const sample = withValue
    .toSorted((a, b) => (b.value ?? 0) - (a.value ?? 0))
    .slice(0, 8)
    .map((team) => `${team.team}: value ${team.value} ${JSON.stringify(team.measures)}`);
  const checks = run.apiChecks.map((check) =>
    check.error
      ? `${check.measure}: error ${check.error}`
      : `${check.measure}: ${check.rowCount} rows, ${check.teamCount} teams, ${check.valueCount} rows with a number${check.ok ? "" : " (NOT OK)"}`,
  );
  return [
    `Winners: ${run.winners.length > 0 ? run.winners.join(", ") : "none"}`,
    `Teams with a value: ${withValue.length} of ${run.teams.length}`,
    Object.keys(excluded).length > 0 ? `Excluded: ${JSON.stringify(excluded)}` : "",
    sample.length > 0 ? `Highest values:\n${sample.join("\n")}` : "",
    checks.length > 0 ? `Custom source checks:\n${checks.join("\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
