import type { MeasureFormValues, ScoringFormValues } from "./form-values";

type MeasurePart = "name" | "source" | "api" | "op" | "field" | "where";

/** A field or group of the builder that can carry an AI mark. */
export type MarkKey =
  | "teams"
  | "matches"
  | "value"
  | "select"
  | `measures.${number}`
  | `measures.${number}.${MeasurePart}`;

const VALUE_FIELDS = new Set([
  "valueMode",
  "valueMeasure",
  "calculationOp",
  "left",
  "right",
]);
const SELECT_FIELDS = new Set([
  "selectType",
  "n",
  "order",
  "thresholdOp",
  "selectValue",
]);
const API_FIELDS = new Set(["apiService", "apiPath", "apiRows", "apiTeam"]);

/** The builder parts that differ between two form states. */
export function diffFormValues(
  before: ScoringFormValues,
  after: ScoringFormValues,
): MarkKey[] {
  const keys: MarkKey[] = [];
  if (before.teams !== after.teams) keys.push("teams");
  if (before.matches !== after.matches) keys.push("matches");

  after.measures.forEach((measure, index) => {
    const old = before.measures[index];
    if (!old) {
      keys.push(`measures.${index}`);
      return;
    }
    for (const part of measureParts(old, measure))
      keys.push(`measures.${index}.${part}`);
  });

  if (valueText(before) !== valueText(after)) keys.push("value");
  if (selectText(before) !== selectText(after)) keys.push("select");
  return keys;
}

function measureParts(
  a: MeasureFormValues,
  b: MeasureFormValues,
): MeasurePart[] {
  const parts: MeasurePart[] = [];
  if (a.name !== b.name) parts.push("name");
  if (a.source !== b.source) parts.push("source");
  if (
    b.source === "api" &&
    (a.source !== "api" ||
      a.apiService !== b.apiService ||
      a.apiPath !== b.apiPath ||
      a.apiRows !== b.apiRows ||
      a.apiTeam !== b.apiTeam)
  ) {
    parts.push("api");
  }
  if (a.op !== b.op) parts.push("op");
  if (b.op !== "count" && a.field !== b.field) parts.push("field");
  if (JSON.stringify(a.where) !== JSON.stringify(b.where)) parts.push("where");
  return parts;
}

function valueText(values: ScoringFormValues) {
  return values.valueMode === "measure"
    ? `m:${values.valueMeasure}`
    : `c:${values.left}:${values.calculationOp}:${values.right}`;
}

function selectText(values: ScoringFormValues) {
  switch (values.selectType) {
    case "nth":
    case "top":
      return `${values.selectType}:${values.n}:${values.order}`;
    case "threshold":
      return `threshold:${values.thresholdOp}:${values.selectValue}`;
    case "equals":
      return `equals:${values.selectValue}`;
  }
}

/** The mark that an edit to a form path clears, if any. */
export function markKeyForPath(path: string): MarkKey | null {
  if (path === "teams" || path === "matches") return path;
  if (VALUE_FIELDS.has(path)) return "value";
  if (SELECT_FIELDS.has(path)) return "select";
  const match = path.match(/^measures\.(\d+)\.([A-Za-z]+)/);
  if (!match) return null;
  const [, index, field] = match;
  if (API_FIELDS.has(field)) return `measures.${Number(index)}.api`;
  if (
    field === "name" ||
    field === "source" ||
    field === "op" ||
    field === "field" ||
    field === "where"
  ) {
    return `measures.${Number(index)}.${field}`;
  }
  return null;
}
