import { findUnknownFields } from "../../../../../../convex/lib/scoring/field_paths";
import {
  formatFormula,
  parseFormula,
} from "../../../../../../convex/lib/scoring/formula";
import type { ApiService } from "../../../../../../convex/lib/scoring/sources/api_source";
import {
  winnerConfigSchema,
  type MatchScope,
  type MeasureSource,
  type ScoringSource,
  type TeamScope,
  type WinnerConfig,
  type WinnerConfigInput,
} from "../../../../../../convex/lib/scoring/winner_config";
import type {
  FILTER_OP_OPTIONS,
  MEASURE_OP_OPTIONS,
  ORDER_OPTIONS,
  SELECT_TYPE_OPTIONS,
  THRESHOLD_OP_OPTIONS,
  VALUE_MODE_OPTIONS,
} from "./constants";

type OptionValue<Options extends readonly { value: string }[]> =
  Options[number]["value"];

/** Form state. Inputs hold strings, and `toWinnerConfig` converts them. */
export type FilterFormValues = {
  /** `measure` means the measure's own source. */
  source: ScoringSource | "measure";
  field: string;
  op: OptionValue<typeof FILTER_OP_OPTIONS>;
  value: string;
};

export type MeasureFormValues = {
  name: string;
  /** `api` is a custom endpoint, set by the `api*` fields. */
  source: MeasureSource;
  op: OptionValue<typeof MEASURE_OP_OPTIONS>;
  field: string;
  where: FilterFormValues[];
  apiService: ApiService;
  apiPath: string;
  apiRows: string;
  apiTeam: string;
};

const EMPTY_API = {
  apiService: "tba",
  apiPath: "/event/{eventKey}/matches",
  apiRows: "",
  apiTeam: "alliances.*.team_keys.*",
} as const satisfies Pick<
  MeasureFormValues,
  "apiService" | "apiPath" | "apiRows" | "apiTeam"
>;

export type ScoringFormValues = {
  mode: WinnerMode;
  teams: TeamScope;
  matches: MatchScope;
  measures: MeasureFormValues[];
  valueMode: OptionValue<typeof VALUE_MODE_OPTIONS>;
  valueMeasure: string;
  /** For a calculation, for example `(auto - teleop) / matches`. */
  formula: string;
  selectType: OptionValue<typeof SELECT_TYPE_OPTIONS>;
  n: string;
  order: OptionValue<typeof ORDER_OPTIONS>;
  thresholdOp: OptionValue<typeof THRESHOLD_OP_OPTIONS>;
  selectValue: string;
};

export const EMPTY_FILTER: FilterFormValues = {
  source: "measure",
  field: "",
  op: "eq",
  value: "",
};

export const DEFAULT_MEASURE: MeasureFormValues = {
  name: "rank",
  source: "tba.rankings",
  op: "value",
  field: "rank",
  where: [],
  ...EMPTY_API,
};

export const DEFAULT_FORM_VALUES: ScoringFormValues = {
  mode: "config",
  teams: "all",
  matches: "qualification",
  measures: [DEFAULT_MEASURE],
  valueMode: "measure",
  valueMeasure: "rank",
  formula: "",
  selectType: "nth",
  n: "1",
  order: "asc",
  thresholdOp: "gte",
  selectValue: "",
};

export type WinnerMode = "config" | "script" | "leastUnique" | "manual";

type WinnerSource =
  | { type: "manual" | "script" | "leastUnique" }
  | { type: "config"; config: unknown }
  | undefined;

export function toFormValues(winnerSource: WinnerSource): ScoringFormValues {
  if (winnerSource === undefined) {
    return DEFAULT_FORM_VALUES;
  }
  if (winnerSource.type !== "config") {
    return { ...DEFAULT_FORM_VALUES, mode: winnerSource.type };
  }

  const parsed = winnerConfigSchema.safeParse(winnerSource.config);
  if (!parsed.success) {
    return DEFAULT_FORM_VALUES;
  }
  const config = parsed.data;
  const select = config.select;

  return {
    ...DEFAULT_FORM_VALUES,
    mode: "config",
    teams: config.teams,
    matches: config.matches,
    measures: Object.entries(config.measures).map(([name, measure]) => ({
      name,
      source: measure.source,
      op: measure.op,
      field: measure.field ?? "",
      ...(measure.source === "api"
        ? {
            apiService: measure.api.service,
            apiPath: measure.api.path,
            apiRows: measure.api.rows,
            apiTeam: measure.api.team,
          }
        : EMPTY_API),
      where: measure.where.map((filter) => ({
        source:
          filter.source === undefined || filter.source === measure.source
            ? "measure"
            : filter.source,
        field: filter.field,
        op: filter.op,
        value: Array.isArray(filter.value)
          ? filter.value.join(", ")
          : String(filter.value),
      })),
    })),
    ...(typeof config.value === "string"
      ? { valueMode: "measure", valueMeasure: config.value }
      : {
          valueMode: "calculation",
          formula: formatFormula(config.value),
        }),
    selectType: select.type,
    ...(select.type === "nth" || select.type === "top"
      ? { n: String(select.n), order: select.order }
      : {}),
    ...(select.type === "threshold"
      ? { thresholdOp: select.op, selectValue: String(select.value) }
      : {}),
    ...(select.type === "equals" ? { selectValue: String(select.value) } : {}),
  };
}

/** `"3"` to 3, `"true"` to true, anything else stays a string. */
function parseScalar(text: string): string | number | boolean {
  const trimmed = text.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed !== "" && Number.isFinite(Number(trimmed)))
    return Number(trimmed);
  return trimmed;
}

function parseNumber(text: string) {
  return text.trim() === "" ? Number.NaN : Number(text);
}

export function toWinnerConfigInput(
  values: ScoringFormValues,
): WinnerConfigInput {
  const select: WinnerConfigInput["select"] =
    values.selectType === "nth" || values.selectType === "top"
      ? {
          type: values.selectType,
          n: parseNumber(values.n),
          order: values.order,
        }
      : values.selectType === "threshold"
        ? {
            type: "threshold",
            op: values.thresholdOp,
            value: parseNumber(values.selectValue),
          }
        : { type: "equals", value: parseNumber(values.selectValue) };

  return {
    teams: values.teams,
    matches: values.matches,
    measures: Object.fromEntries(
      values.measures.map((measure) => [
        measure.name.trim(),
        {
          ...(measure.source === "api"
            ? {
                source: "api" as const,
                api: {
                  service: measure.apiService,
                  path: measure.apiPath.trim(),
                  rows: measure.apiRows.trim(),
                  team: measure.apiTeam.trim(),
                },
              }
            : { source: measure.source }),
          op: measure.op,
          ...(measure.op === "count" || measure.field.trim() === ""
            ? {}
            : { field: measure.field.trim() }),
          where: measure.where.map((filter) => ({
            ...(filter.source === "measure" ||
            filter.source === measure.source ||
            measure.source === "api"
              ? {}
              : { source: filter.source }),
            field: filter.field.trim(),
            op: filter.op,
            value:
              filter.op === "in" || filter.op === "notIn"
                ? filter.value
                    .split(",")
                    .filter((part) => part.trim() !== "")
                    .map(parseScalar)
                : parseScalar(filter.value),
          })),
        },
      ]),
    ),
    value: toValueInput(values),
    select,
  };
}

/** A formula that can't be read is kept as text, and `checkConfig` reports it. */
function toValueInput(values: ScoringFormValues): WinnerConfigInput["value"] {
  if (values.valueMode === "measure") return values.valueMeasure;
  const parsed = parseFormula(values.formula);
  return parsed.ok && typeof parsed.expression !== "number" ? parsed.expression : values.formula;
}

export type ConfigCheck =
  | { ok: true; config: WinnerConfig; issues: [] }
  | { ok: false; config: null; issues: string[] };

/** Checks the form against the schema and the season's fields. */
export function checkConfig(
  values: ScoringFormValues,
  year: number,
): ConfigCheck {
  const names = values.measures.map((measure) => measure.name.trim());
  const duplicate = names.find((name, index) => names.indexOf(name) !== index);
  if (duplicate) {
    return {
      ok: false,
      config: null,
      issues: [`Two measures are named "${duplicate}". Use different names.`],
    };
  }

  if (values.valueMode === "calculation") {
    const formula = parseFormula(values.formula);
    if (!formula.ok) {
      return { ok: false, config: null, issues: [`Formula: ${formula.message}`] };
    }
    if (typeof formula.expression === "number") {
      return {
        ok: false,
        config: null,
        issues: ["Formula: use at least one measure, or every team gets the same value."],
      };
    }
  }

  const parsed = winnerConfigSchema.safeParse(toWinnerConfigInput(values));
  if (!parsed.success) {
    return {
      ok: false,
      config: null,
      issues: parsed.error.issues.map((issue) =>
        issue.path.length > 0
          ? `${issue.path.join(" › ")}: ${issue.message}`
          : issue.message,
      ),
    };
  }

  const unknownFields = findUnknownFields(parsed.data, year);
  if (unknownFields.length > 0) {
    return {
      ok: false,
      config: null,
      issues: unknownFields.map(
        (issue) =>
          `${issue.measure}: "${issue.field}" is not a ${issue.source} field in ${year}.`,
      ),
    };
  }

  return { ok: true, config: parsed.data, issues: [] };
}
