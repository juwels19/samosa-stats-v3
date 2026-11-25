import { describe, expect, it } from "vitest";

import { CATEGORY_CSV_TEMPLATE, parseCategoriesCsv } from "./parse-categories-csv";

describe("parseCategoriesCsv", () => {
  it("reads category, global and an optional scoring column without a header", () => {
    const { rows, error } = parseCategoriesCsv("Tips over,yes,Falls and stays down\nDeep climb,no", []);
    expect(error).toBeNull();
    expect(rows.map(({ text, isGlobal, scoringDescription, errors }) => ({
      text,
      isGlobal,
      scoringDescription,
      errors,
    }))).toEqual([
      { text: "Tips over", isGlobal: true, scoringDescription: "Falls and stays down", errors: [] },
      { text: "Deep climb", isGlobal: false, scoringDescription: "", errors: [] },
    ]);
  });

  it("uses header names in any order, and the scoring column can be left out", () => {
    const { rows } = parseCategoriesCsv("global,category\nyes,Tips over", []);
    expect(rows[0]).toMatchObject({ text: "Tips over", isGlobal: true, scoringDescription: "", errors: [] });
  });

  it("needs a category column when there is a header", () => {
    expect(parseCategoriesCsv("scoring,global\nx,yes", []).error).toBe(
      "The header needs a category column.",
    );
  });

  it("parses the template with no errors", () => {
    const { rows } = parseCategoriesCsv(CATEGORY_CSV_TEMPLATE, []);
    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.errors.length === 0)).toBe(true);
  });
});
