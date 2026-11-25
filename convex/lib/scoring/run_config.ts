import { loadApiSourceRows } from "./event_winners";
import { findUnknownFields, type UnknownFieldIssue } from "./field_paths";
import {
  findCategoryWinners,
  getField,
  type CategoryWinnersResult,
} from "./find_category_winners";
import { getApiSourceKey } from "./sources/api_source";
import { loadScoringEventData } from "./sources/event_data";
import {
  getApiSources,
  getRequiredSources,
  type WinnerConfig,
} from "./winner_config";

/** How a custom source measure read the event's data. */
export type ApiCheck = {
  measure: string;
  service: string;
  path: string;
  rowCount: number;
  teamCount: number;
  /** Rows where the field is a number. Equal to `rowCount` for `count`. */
  valueCount: number;
  error?: string;
  /** The endpoint loaded, rows have teams, and the field has values. */
  ok: boolean;
};

export type ConfigRun = CategoryWinnersResult & {
  unknownFields: UnknownFieldIssue[];
  matchRowCount: number;
  apiChecks: ApiCheck[];
};

/** Gets an event's data and runs a config on it. Run this in an action. */
export async function runConfigOnEvent(
  config: WinnerConfig,
  { year, eventCode }: { year: number; eventCode: string },
): Promise<ConfigRun> {
  const [data, api] = await Promise.all([
    loadScoringEventData({ year, eventCode, sources: getRequiredSources(config) }),
    loadApiSourceRows({ year, eventCode, specs: getApiSources(config) }),
  ]);
  const result = findCategoryWinners(config, { ...data, api: api.rows });

  const apiChecks: ApiCheck[] = Object.entries(config.measures).flatMap(
    ([measure, spec]) => {
      if (spec.source !== "api") return [];
      const key = getApiSourceKey(spec.api);
      const rows = api.rows[key] ?? [];
      const error = api.failures.get(key);
      const valueCount =
        spec.op === "count" || spec.field === undefined
          ? rows.length
          : rows.filter((row) => typeof getField(row, spec.field!) === "number").length;
      return [
        {
          measure,
          service: spec.api.service,
          path: spec.api.path,
          rowCount: rows.length,
          teamCount: new Set(rows.map((row) => row.team)).size,
          valueCount,
          ...(error === undefined ? {} : { error }),
          ok: error === undefined && rows.length > 0 && valueCount > 0,
        },
      ];
    },
  );

  return {
    ...result,
    unknownFields: findUnknownFields(config, year),
    matchRowCount: data.sources["tba.matches"].length,
    apiChecks,
  };
}
