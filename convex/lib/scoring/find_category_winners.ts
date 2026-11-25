import { evaluateExpression } from "./formula";
import { getApiSourceKey } from "./sources/api_source";
import { MATCH_SOURCES } from "./winner_config";
import type {
  MatchScope,
  Measure,
  RowFilter,
  ScoringSource,
  Select,
  TeamScope,
  WinnerConfig,
} from "./winner_config";

/** One row of source data. Every row belongs to one team. */
export type ScoringRow = { team: number } & Record<string, unknown>;

/**
 * The data the engine reads. `ScoringEventData` from `sources/event_data.ts`
 * is the strongly typed form. The engine reads rows by field path, so it only
 * needs this looser shape.
 */
export type WinnerEngineInput = {
  teams: readonly number[];
  sources: Partial<Record<ScoringSource, readonly ScoringRow[]>>;
  /** Rows of custom sources, by `getApiSourceKey`. */
  api?: Readonly<Record<string, readonly ScoringRow[]>>;
};

export type TeamWinnerResult = {
  team: number;
  measures: Record<string, number | null>;
  value: number | null;
  /** Why the team can't win. Not set for teams that can win. */
  excludedReason?: "notInScope" | "missingData" | "divideByZero";
  isWinner: boolean;
};

export type CategoryWinnersResult = {
  winners: number[];
  /** One result for each team at the event, for the preview. */
  teams: TeamWinnerResult[];
};

/**
 * Finds the teams that won a category. See "Category winner configs" in
 * docs/scoring.md.
 */
export function findCategoryWinners(
  config: WinnerConfig,
  data: WinnerEngineInput,
): CategoryWinnersResult {
  const eliminationTeams = new Set(
    (data.sources["tba.alliances"] ?? []).map((row) => row.team),
  );
  const captains = new Set(
    (data.sources["tba.alliances"] ?? [])
      .filter((row) => row.role === "captain")
      .map((row) => row.team),
  );

  const results: TeamWinnerResult[] = data.teams.map((team) => {
    const measures: Record<string, number | null> = {};
    for (const [name, measure] of Object.entries(config.measures)) {
      measures[name] = measureTeam(measure, team, data, config.matches);
    }

    if (!isInScope(config.teams, team, eliminationTeams, captains)) {
      return {
        team,
        measures,
        value: null,
        excludedReason: "notInScope",
        isWinner: false,
      };
    }

    const { value, excludedReason } = computeValue(config.value, measures);
    return excludedReason === undefined
      ? { team, measures, value, isWinner: false }
      : { team, measures, value: null, excludedReason, isWinner: false };
  });

  const eligible = results.filter(
    (result): result is TeamWinnerResult & { value: number } =>
      result.value !== null,
  );
  const winners = new Set(selectWinners(config.select, eligible));

  for (const result of results) {
    result.isWinner = winners.has(result.team);
  }

  return {
    winners: results.filter((r) => r.isWinner).map((r) => r.team),
    teams: results,
  };
}

function isInScope(
  scope: TeamScope,
  team: number,
  eliminationTeams: Set<number>,
  captains: Set<number>,
) {
  switch (scope) {
    case "all":
      return true;
    case "inEliminations":
      return eliminationTeams.has(team);
    case "notInEliminations":
      return !eliminationTeams.has(team);
    case "captains":
      return captains.has(team);
  }
}

function measureTeam(
  measure: Measure,
  team: number,
  data: WinnerEngineInput,
  matches: MatchScope,
): number | null {
  const isCrossSource = (filter: RowFilter) =>
    filter.source !== undefined && filter.source !== measure.source;

  // Filters on the same other source must all match one row of that source.
  const crossSourceFilters = new Map<ScoringSource, RowFilter[]>();
  for (const filter of measure.where.filter(isCrossSource)) {
    const group = crossSourceFilters.get(filter.source!) ?? [];
    group.push(filter);
    crossSourceFilters.set(filter.source!, group);
  }
  const teamPassesCrossSourceFilters = [...crossSourceFilters].every(
    ([source, filters]) =>
      getRows(data, source, matches).some(
        (row) =>
          row.team === team &&
          filters.every((filter) => matchesFilter(row, filter)),
      ),
  );
  if (!teamPassesCrossSourceFilters) {
    return measure.op === "count" || measure.op === "sum" ? 0 : null;
  }

  const rowFilters = measure.where.filter((filter) => !isCrossSource(filter));
  // Custom sources ignore the match scope. Their filters choose the rows.
  const sourceRows =
    measure.source === "api"
      ? (data.api?.[getApiSourceKey(measure.api)] ?? [])
      : getRows(data, measure.source, matches);
  const rows = sourceRows.filter(
    (row) =>
      row.team === team &&
      rowFilters.every((filter) => matchesFilter(row, filter)),
  );

  if (measure.op === "count") {
    return rows.length;
  }

  const values = rows
    .map((row) => toNumber(getField(row, measure.field!)))
    .filter((value): value is number => value !== null);

  if (measure.op === "sum") {
    return values.reduce((total, value) => total + value, 0);
  }

  if (values.length === 0) {
    return null;
  }

  switch (measure.op) {
    case "value":
      return values[0];
    case "avg":
      return values.reduce((total, value) => total + value, 0) / values.length;
    case "max":
      return Math.max(...values);
    case "min":
      return Math.min(...values);
  }
}

/** A source's rows, with match sources limited to the config's match scope. */
function getRows(
  data: WinnerEngineInput,
  source: ScoringSource,
  matches: MatchScope,
): readonly ScoringRow[] {
  const rows = data.sources[source] ?? [];
  return MATCH_SOURCES.includes(source)
    ? rows.filter((row) => isInMatchScope(row, matches))
    : rows;
}

function isInMatchScope(row: ScoringRow, matches: MatchScope) {
  const compLevel = row.compLevel;
  if (compLevel === "pm") {
    return false;
  }
  switch (matches) {
    case "qualification":
      return compLevel === "qm";
    case "playoffs":
      return compLevel !== "qm";
    case "all":
      return true;
  }
}

function computeValue(
  value: WinnerConfig["value"],
  measures: Record<string, number | null>,
): { value: number | null; excludedReason?: "missingData" | "divideByZero" } {
  return evaluateExpression(value, measures);
}

function selectWinners(
  select: Select,
  eligible: readonly { team: number; value: number }[],
): number[] {
  if (eligible.length === 0) {
    return [];
  }

  switch (select.type) {
    case "nth": {
      const distinct = [...new Set(eligible.map((r) => toKey(r.value)))].sort(
        (a, b) => (select.order === "desc" ? b - a : a - b),
      );
      const target = distinct[select.n - 1];
      return target === undefined
        ? []
        : eligible.filter((r) => toKey(r.value) === target).map((r) => r.team);
    }
    case "top": {
      const sorted = [...eligible].sort((a, b) =>
        select.order === "desc" ? b.value - a.value : a.value - b.value,
      );
      if (sorted.length <= select.n) {
        return sorted.map((r) => r.team);
      }
      const cutoff = toKey(sorted[select.n - 1].value);
      return sorted
        .filter((r, index) => index < select.n || toKey(r.value) === cutoff)
        .map((r) => r.team);
    }
    case "threshold":
      return eligible
        .filter((r) => compare(r.value, select.op, select.value))
        .map((r) => r.team);
    case "equals":
      return eligible
        .filter((r) => toKey(r.value) === toKey(select.value))
        .map((r) => r.team);
  }
}

function matchesFilter(row: ScoringRow, filter: RowFilter): boolean {
  const actual = getField(row, filter.field);

  switch (filter.op) {
    case "eq":
      return actual === filter.value;
    case "neq":
      return actual !== filter.value;
    case "in":
      return (
        Array.isArray(filter.value) && filter.value.includes(actual as never)
      );
    case "notIn":
      return (
        Array.isArray(filter.value) && !filter.value.includes(actual as never)
      );
    default: {
      const actualNumber = toNumber(actual);
      return (
        actualNumber !== null &&
        typeof filter.value === "number" &&
        compare(actualNumber, filter.op, filter.value)
      );
    }
  }
}

function compare(
  actual: number,
  op: "gt" | "gte" | "lt" | "lte",
  expected: number,
) {
  switch (op) {
    case "gt":
      return actual > expected;
    case "gte":
      return actual >= expected;
    case "lt":
      return actual < expected;
    case "lte":
      return actual <= expected;
  }
}

/**
 * Reads a path like `breakdown.endGameRobot{n}` or `sort_orders[0]`. A `{n}`
 * changes to the row's `robotIndex`.
 */
export function getField(row: ScoringRow, path: string): unknown {
  const resolved = path.replaceAll("{n}", String(row.robotIndex ?? ""));
  const keys = resolved.split(/\.|\[(\d+)\]/).filter((key) => key);

  let current: unknown = row;
  for (const key of keys) {
    if (typeof current !== "object" || current === null) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Removes floating point noise so values like ratios compare as equal. */
function toKey(value: number) {
  return Number(value.toPrecision(12));
}
