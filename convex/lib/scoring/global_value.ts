import { evaluateExpression, getReferencedMeasures, parseFormula, type ValueExpression } from "./formula";

/**
 * The points of a global category at an event come from a formula of event
 * values, for example `maxCategoryValue - minCategoryValue` or `teamPicks(6)`.
 * See "Global categories" in docs/scoring.md.
 */

export const GLOBAL_VALUE_VARIABLES = {
  maxCategoryValue: "The highest base value (picks + 1) of the chosen categories. Same as topCatValue.",
  minCategoryValue: "The lowest base value (picks + 1) of the chosen categories.",
  topTeamValue: "The highest number of picks for one team.",
  submissions: "The number of submissions at the event.",
} as const;

/** Functions that take a position n (1 is the highest). */
export const GLOBAL_VALUE_FUNCTIONS = {
  categoryValue: "categoryValue(n): the base value (picks + 1) of the nth most picked chosen category.",
  teamPicks: "teamPicks(n): the number of picks of the nth most picked team.",
} as const;

type GlobalValueVariable = keyof typeof GLOBAL_VALUE_VARIABLES;
type GlobalValueFunction = keyof typeof GLOBAL_VALUE_FUNCTIONS;

export type GlobalValueInputs = Record<GlobalValueVariable, number> & {
  /** Base values of the chosen categories, highest first. */
  categoryValues: number[];
  /** Picks of each picked team, highest first. */
  teamPicks: number[];
};

const VARIABLE_NAMES = Object.keys(GLOBAL_VALUE_VARIABLES);
const FUNCTION_NAMES = Object.keys(GLOBAL_VALUE_FUNCTIONS);

function isVariable(name: string): name is GlobalValueVariable {
  return VARIABLE_NAMES.includes(name);
}

function isFunction(name: string): name is GlobalValueFunction {
  return FUNCTION_NAMES.includes(name);
}

/** Splits `teamPicks(6)` into the function and its position. */
function parseCall(name: string): { fn: GlobalValueFunction; n: number } | null {
  const match = /^([A-Za-z][A-Za-z0-9_]*)\((\d+)\)$/.exec(name);
  if (match === null || !isFunction(match[1])) return null;
  const n = Number(match[2]);
  return n >= 1 ? { fn: match[1], n } : null;
}

/** Parses a value formula and checks that it uses only event values and functions. */
export function parseGlobalValueFormula(
  text: string,
): { ok: true; expression: ValueExpression } | { ok: false; message: string } {
  const parsed = parseFormula(text);
  if (!parsed.ok) return parsed;
  const names = getReferencedMeasures(parsed.expression);
  const bareFunction = names.find(isFunction);
  if (bareFunction !== undefined) {
    return { ok: false, message: `${bareFunction} needs a position, for example ${bareFunction}(1).` };
  }
  const unknown = names.filter((name) => !isVariable(name) && parseCall(name) === null);
  if (unknown.length > 0) {
    return {
      ok: false,
      message: `Unknown name: ${[...new Set(unknown)].join(", ")}. Use ${VARIABLE_NAMES.join(", ")}, ${FUNCTION_NAMES.map((name) => `${name}(n)`).join(" or ")}. n starts at 1.`,
    };
  }
  return parsed;
}

/** The event values a value formula can use. Global categories are not choices, so they don't count. */
export function getGlobalValueInputs<CategoryId extends string>({
  chosenCategoryIds,
  submissions,
}: {
  /** The event's chosen (not global) categories. */
  chosenCategoryIds: readonly CategoryId[];
  submissions: readonly { categoryIds: readonly CategoryId[]; teams: readonly (string | number)[] }[];
}): GlobalValueInputs {
  const categoryPicks = new Map<CategoryId, number>(chosenCategoryIds.map((id) => [id, 0]));
  const teamPickCounts = new Map<string | number, number>();
  for (const submission of submissions) {
    for (const id of new Set(submission.categoryIds)) {
      const count = categoryPicks.get(id);
      if (count !== undefined) categoryPicks.set(id, count + 1);
    }
    for (const team of new Set(submission.teams)) {
      teamPickCounts.set(team, (teamPickCounts.get(team) ?? 0) + 1);
    }
  }
  const categoryValues = [...categoryPicks.values()].map((picks) => picks + 1).toSorted((a, b) => b - a);
  const teamPicks = [...teamPickCounts.values()].toSorted((a, b) => b - a);
  return {
    maxCategoryValue: categoryValues[0] ?? 0,
    minCategoryValue: categoryValues.at(-1) ?? 0,
    topTeamValue: teamPicks[0] ?? 0,
    submissions: submissions.length,
    categoryValues,
    teamPicks,
  };
}

/** The number for one name in a formula. Null when a position is past the end of its list. */
function resolveName(name: string, inputs: GlobalValueInputs): number | null {
  if (isVariable(name)) return inputs[name];
  const call = parseCall(name);
  if (call === null) return null;
  const list = call.fn === "categoryValue" ? inputs.categoryValues : inputs.teamPicks;
  return list[call.n - 1] ?? null;
}

/**
 * A global category's points at an event, rounded down. Null when it has no
 * formula, the formula is not valid, a position is past the end of its list
 * or it divides by zero.
 */
export function evaluateGlobalValue(
  formula: string | undefined,
  inputs: GlobalValueInputs,
): number | null {
  if (formula === undefined || formula.trim() === "") return null;
  const parsed = parseGlobalValueFormula(formula);
  if (!parsed.ok) return null;
  const values = Object.fromEntries(
    getReferencedMeasures(parsed.expression).map((name) => [name, resolveName(name, inputs)]),
  );
  const result = evaluateExpression(parsed.expression, values);
  return result.value === null ? null : Math.floor(result.value);
}
