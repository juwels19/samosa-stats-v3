import { describe, expect, it } from "vitest";

import {
  checkManualWinners,
  findEventCategoryWinners,
  getSourcesForConfigs,
  type EventSourceRows,
} from "./event_winners";

const bestRank = {
  measures: { rank: { source: "tba.rankings", field: "rank" } },
  value: "rank",
  select: { type: "nth", n: 1, order: "asc" },
};

const mostAwards = {
  measures: { awards: { source: "tba.awards", op: "count" } },
  value: "awards",
  select: { type: "nth", n: 1, order: "desc" },
};

const rankings: EventSourceRows["rows"] = {
  "tba.rankings": [
    { team: 1, rank: 2 },
    { team: 2, rank: 1 },
    { team: 3, rank: 3 },
  ],
};

describe("findEventCategoryWinners", () => {
  it("finds the winners of each category", () => {
    const [outcome] = findEventCategoryWinners({
      categories: [{ categoryId: "a", config: bestRank }],
      teams: [1, 2, 3],
      sourceRows: { rows: rankings, failures: new Map() },
    });

    expect(outcome.type).toBe("config");
    expect(outcome.type === "config" && outcome.winners).toEqual([2]);
  });

  it("gives an error only to categories that read a failed source", () => {
    const outcomes = findEventCategoryWinners({
      categories: [
        { categoryId: "rank", config: bestRank },
        { categoryId: "awards", config: mostAwards },
      ],
      teams: [1, 2, 3],
      sourceRows: {
        rows: rankings,
        failures: new Map([["tba.awards", "The Blue Alliance returned 500."]]),
      },
    });

    expect(outcomes[0].type).toBe("config");
    expect(outcomes[1]).toEqual({
      categoryId: "awards",
      type: "error",
      message: "Could not load tba.awards: The Blue Alliance returned 500.",
    });
  });

  it("gives an error to a saved config that is not valid", () => {
    const [outcome] = findEventCategoryWinners({
      categories: [{ categoryId: "a", config: { measures: {} } }],
      teams: [1],
      sourceRows: { rows: {}, failures: new Map() },
    });

    expect(outcome.type).toBe("error");
  });
});

describe("getSourcesForConfigs", () => {
  it("lists each source once and skips configs that are not valid", () => {
    expect(
      getSourcesForConfigs([bestRank, bestRank, mostAwards, { bad: true }]),
    ).toEqual(["tba.rankings", "tba.awards"]);
  });
});

describe("checkManualWinners", () => {
  it("removes duplicates and sorts the teams", () => {
    expect(checkManualWinners([254, 1114, 254], new Set([254, 1114]))).toEqual(
      [254, 1114],
    );
  });

  it("rejects teams that are not at the event", () => {
    expect(() => checkManualWinners([254, 9999], new Set([254]))).toThrow(
      "These teams are not at the event: 9999.",
    );
  });
});
