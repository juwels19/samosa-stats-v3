import { describe, expect, it } from "vitest";

import { calculateEventScores, findLeastUnique } from "./event_scores";

describe("calculateEventScores", () => {
  // Category picks: a 2, b 2, c 1. a and b tie as top (base 3): floor(3 / 2) = 1.
  // c has base value 2.
  // Team picks: 1 3, 2 1, 3 1, 4 1. topTeamValue 3.
  const result = calculateEventScores({
    categoryIds: ["a", "b", "c"],
    submissions: [
      { id: "p1", categoryIds: ["a", "b"], teams: [1, 2] },
      { id: "p2", categoryIds: ["a", "c"], teams: [1, 3] },
      { id: "p3", categoryIds: ["b"], teams: [1, 4] },
    ],
    winners: new Map([
      ["a", [1]],
      ["b", [1, 2]],
      ["c", [3]],
    ]),
    awardWinners: [2],
  });
  const byId = new Map(result.scores.map((score) => [score.submission, score]));

  it("adds the value of each picked category for each picked winner", () => {
    // p1: a/1 = 1, b/1 = 1, b/2 = 1, award on 2 = -3, least unique = -3.
    expect(byId.get("p1")?.lineItems).toEqual([
      { type: "category", category: "a", team: 1, amount: 1 },
      { type: "category", category: "b", team: 1, amount: 1 },
      { type: "category", category: "b", team: 2, amount: 1 },
      { type: "award", team: 2, amount: -3 },
      { type: "leastUnique", amount: -3 },
    ]);
    expect(byId.get("p1")?.total).toBe(-3);
  });

  it("gives the least unique deduction by the tiebreak", () => {
    // All have uniqueness 4 and counts [3, 1], so all three tie.
    expect(result.leastUnique).toEqual(["p1", "p2", "p3"]);
    // p2: a/1 = 1, c/3 = 2. p3: b/1 = 1.
    expect(byId.get("p2")?.total).toBe(1 + 2 - 3);
    expect(byId.get("p3")?.total).toBe(1 - 3);
  });

  it("reports the event values", () => {
    expect(result.topCatValue).toBe(3);
    expect(result.topTeamValue).toBe(3);
  });
});

describe("calculateEventScores with global categories", () => {
  // a has 1 pick (base 2, the only top: value 0), b has 0 picks (base 1).
  // g is global with value 5. p1's pick stores g, p2's does not.
  const result = calculateEventScores({
    categoryIds: ["a", "b", "g"],
    submissions: [
      { id: "p1", categoryIds: ["g", "a"], teams: [1, 2] },
      { id: "p2", categoryIds: [], teams: [3, 4] },
    ],
    winners: new Map([
      ["a", [1]],
      ["g", [2, 3]],
    ]),
    awardWinners: [],
    globalPoints: new Map([["g", 5]]),
  });
  const byId = new Map(result.scores.map((score) => [score.submission, score]));

  it("gives every submission the global category", () => {
    expect(byId.get("p1")?.lineItems).toContainEqual({
      type: "category",
      category: "g",
      team: 2,
      amount: 5,
    });
    expect(byId.get("p2")?.lineItems).toContainEqual({
      type: "category",
      category: "g",
      team: 3,
      amount: 5,
    });
  });

  it("does not let the global category change topCatValue", () => {
    expect(result.topCatValue).toBe(2);
    expect(byId.get("p1")?.lineItems).toContainEqual({
      type: "category",
      category: "a",
      team: 1,
      amount: 0,
    });
  });
});

describe("findLeastUnique", () => {
  it("picks the highest uniqueness", () => {
    expect(
      findLeastUnique([
        { submission: "a", uniqueness: 5, teamPickCounts: [3, 2] },
        { submission: "b", uniqueness: 6, teamPickCounts: [3, 3] },
      ]),
    ).toEqual(["b"]);
  });

  it("breaks a tie on the highest single team count", () => {
    expect(
      findLeastUnique([
        { submission: "a", uniqueness: 6, teamPickCounts: [3, 3] },
        { submission: "b", uniqueness: 6, teamPickCounts: [1, 5] },
      ]),
    ).toEqual(["b"]);
  });

  it("returns no submission when there are none", () => {
    expect(findLeastUnique([])).toEqual([]);
  });
});
