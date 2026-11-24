import { describe, expect, it } from "vitest";

import {
  getLastCalculatedAt,
  groupScoringCategories,
} from "./group-scoring-categories";

describe("groupScoringCategories", () => {
  it("splits categories by winner source and sorts each group", () => {
    const groups = groupScoringCategories([
      { text: "b", winnerSource: { type: "config" as const } },
      { text: "c", winnerSource: { type: "manual" as const } },
      { text: "a", winnerSource: { type: "config" as const } },
      { text: "d" },
    ]);

    expect(groups.automatic.map((c) => c.text)).toEqual(["a", "b"]);
    expect(groups.manual.map((c) => c.text)).toEqual(["c"]);
    expect(groups.notSetUp.map((c) => c.text)).toEqual(["d"]);
  });
});

describe("getLastCalculatedAt", () => {
  it("returns the latest calculation and ignores manual results", () => {
    expect(
      getLastCalculatedAt([
        { result: { type: "config", calculatedAt: 10 } },
        { result: { type: "error", calculatedAt: 20 } },
        { result: { type: "manual" } },
        { result: null },
      ]),
    ).toBe(20);
  });

  it("returns null when nothing was calculated", () => {
    expect(getLastCalculatedAt([{ result: null }])).toBeNull();
  });
});
