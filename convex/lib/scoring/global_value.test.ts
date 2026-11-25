import { describe, expect, it } from "vitest";

import { evaluateGlobalValue, getGlobalValueInputs, parseGlobalValueFormula } from "./global_value";

describe("getGlobalValueInputs", () => {
  it("uses the base values of the chosen categories only", () => {
    // a 2 picks (base 3), b 1 pick (base 2), c 0 picks (base 1). g is global and ignored.
    const inputs = getGlobalValueInputs({
      chosenCategoryIds: ["a", "b", "c"],
      submissions: [
        { categoryIds: ["g", "a", "b"], teams: [1, 2] },
        { categoryIds: ["g", "a"], teams: [1, 3] },
      ],
    });
    expect(inputs).toEqual({
      maxCategoryValue: 3,
      minCategoryValue: 1,
      topTeamValue: 2,
      submissions: 2,
      categoryValues: [3, 2, 1],
      teamPicks: [2, 1, 1],
    });
  });

  it("gives 0 for everything when there is nothing", () => {
    expect(getGlobalValueInputs({ chosenCategoryIds: [], submissions: [] })).toEqual({
      maxCategoryValue: 0,
      minCategoryValue: 0,
      topTeamValue: 0,
      submissions: 0,
      categoryValues: [],
      teamPicks: [],
    });
  });
});

describe("evaluateGlobalValue", () => {
  const inputs = {
    maxCategoryValue: 5,
    minCategoryValue: 1,
    topTeamValue: 3,
    submissions: 7,
    categoryValues: [5, 4, 4, 1],
    teamPicks: [3, 3, 2, 1, 1, 1],
  };

  it("calculates the lose a rematch rule", () => {
    expect(evaluateGlobalValue("maxCategoryValue - minCategoryValue", inputs)).toBe(4);
  });

  it("reads the nth item of the submission lists", () => {
    expect(evaluateGlobalValue("categoryValue(2)", inputs)).toBe(4);
    expect(evaluateGlobalValue("teamPicks(3)", inputs)).toBe(2);
    expect(evaluateGlobalValue("teamPicks( 6 ) * 2", inputs)).toBe(2);
  });

  it("gives null when a position is past the end of its list", () => {
    expect(evaluateGlobalValue("teamPicks(7)", inputs)).toBeNull();
  });

  it("rounds down", () => {
    expect(evaluateGlobalValue("submissions / 2", inputs)).toBe(3);
    expect(evaluateGlobalValue("-submissions / 2", inputs)).toBe(-4);
  });

  it("gives null with no formula, a bad formula or a divide by zero", () => {
    expect(evaluateGlobalValue(undefined, inputs)).toBeNull();
    expect(evaluateGlobalValue("  ", inputs)).toBeNull();
    expect(evaluateGlobalValue("auto - 1", inputs)).toBeNull();
    expect(evaluateGlobalValue("submissions / (topTeamValue - 3)", inputs)).toBeNull();
  });
});

describe("parseGlobalValueFormula", () => {
  it("needs a position for a function", () => {
    const result = parseGlobalValueFormula("teamPicks + 1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("teamPicks(1)");
  });

  it("refuses position 0 and unknown functions", () => {
    expect(parseGlobalValueFormula("teamPicks(0)").ok).toBe(false);
    expect(parseGlobalValueFormula("eventPicks(2)").ok).toBe(false);
  });

  it("refuses names that are not event values", () => {
    const result = parseGlobalValueFormula("maxCategoryValue - auto");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("auto");
  });
});
