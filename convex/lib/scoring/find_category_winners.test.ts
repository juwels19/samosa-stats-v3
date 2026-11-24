import { describe, expect, it } from "vitest";

import {
  findCategoryWinners,
  type WinnerEngineInput,
  type ScoringRow,
} from "./find_category_winners";
import { winnerConfigSchema, type WinnerConfigInput } from "./winner_config";

function winners(config: WinnerConfigInput, data: WinnerEngineInput) {
  return findCategoryWinners(winnerConfigSchema.parse(config), data).winners;
}

function teamRows(
  values: Record<number, Record<string, unknown>>,
): ScoringRow[] {
  return Object.entries(values).map(([team, fields]) => ({
    team: Number(team),
    ...fields,
  }));
}

const rankingData: WinnerEngineInput = {
  teams: [1, 2, 3, 4, 5, 6],
  sources: {
    "tba.rankings": teamRows({
      1: { rank: 1, sort_orders: [3.2] },
      2: { rank: 2, sort_orders: [3.0] },
      3: { rank: 3, sort_orders: [3.0] },
      4: { rank: 4, sort_orders: [2.5] },
      5: { rank: 5, sort_orders: [2.1] },
      6: { rank: 6, sort_orders: [1.0] },
    }),
    "tba.alliances": [
      { team: 1, allianceNumber: 1, role: "captain" },
      { team: 4, allianceNumber: 1, role: "pick1" },
      { team: 2, allianceNumber: 2, role: "captain" },
      { team: 6, allianceNumber: 2, role: "pick1" },
    ],
  },
};

describe("findCategoryWinners", () => {
  it("finds the top 3 ranked teams left out of eliminations", () => {
    expect(
      winners(
        {
          teams: "notInEliminations",
          measures: { rank: { source: "tba.rankings", field: "rank" } },
          value: "rank",
          select: { type: "top", n: 3, order: "asc" },
        },
        rankingData,
      ),
    ).toEqual([3, 5]);
  });

  it("counts nth by distinct value", () => {
    // Distinct ranking scores: 3.2, 3.0, 2.5. The 3rd is 2.5.
    expect(
      winners(
        {
          measures: {
            rs: { source: "tba.rankings", field: "sort_orders[0]" },
          },
          value: "rs",
          select: { type: "nth", n: 3, order: "desc" },
        },
        rankingData,
      ),
    ).toEqual([4]);
  });

  it("gives a win to all teams tied at the nth value", () => {
    expect(
      winners(
        {
          measures: {
            rs: { source: "tba.rankings", field: "sort_orders[0]" },
          },
          value: "rs",
          select: { type: "nth", n: 2, order: "desc" },
        },
        rankingData,
      ),
    ).toEqual([2, 3]);
  });

  it("includes teams tied at the top N cutoff", () => {
    expect(
      winners(
        {
          measures: {
            rs: { source: "tba.rankings", field: "sort_orders[0]" },
          },
          value: "rs",
          select: { type: "top", n: 2, order: "desc" },
        },
        rankingData,
      ),
    ).toEqual([1, 2, 3]);
  });

  it("limits winners to captains", () => {
    expect(
      winners(
        {
          teams: "captains",
          measures: { rank: { source: "tba.rankings", field: "rank" } },
          value: "rank",
          select: { type: "nth", n: 1, order: "desc" },
        },
        rankingData,
      ),
    ).toEqual([2]);
  });

  describe("ratios", () => {
    const data: WinnerEngineInput = {
      teams: [1, 2, 3, 4],
      sources: {
        "statbotics.teamEvents": teamRows({
          1: { epa: { breakdown: { auto_points: 10, total_points: 40 } } },
          2: { epa: { breakdown: { auto_points: 15, total_points: 30 } } },
          3: { epa: { breakdown: { auto_points: 5, total_points: 0 } } },
          4: { epa: { breakdown: { auto_points: 9, total_points: 18 } } },
        }),
      },
    };

    const config = (n: number): WinnerConfigInput => ({
      measures: {
        auto: {
          source: "statbotics.teamEvents",
          field: "epa.breakdown.auto_points",
        },
        total: {
          source: "statbotics.teamEvents",
          field: "epa.breakdown.total_points",
        },
      },
      value: { op: "divide", left: "auto", right: "total" },
      select: { type: "nth", n, order: "desc" },
    });

    it("finds the highest ratio, with ties", () => {
      expect(winners(config(1), data)).toEqual([2, 4]);
    });

    it("finds the 2nd highest ratio", () => {
      expect(winners(config(2), data)).toEqual([1]);
    });

    it("excludes a team that divides by zero", () => {
      const result = findCategoryWinners(
        winnerConfigSchema.parse(config(1)),
        data,
      );
      expect(result.teams.find((t) => t.team === 3)).toMatchObject({
        value: null,
        excludedReason: "divideByZero",
        isWinner: false,
      });
    });
  });

  describe("match rows", () => {
    const match = (
      team: number,
      compLevel: string,
      robotIndex: number,
      breakdown: Record<string, unknown>,
    ): ScoringRow => ({ team, compLevel, robotIndex, breakdown });

    const data: WinnerEngineInput = {
      teams: [1, 2, 3],
      sources: {
        "tba.matches": [
          match(1, "sf", 1, {
            endGameRobot1: "DeepCage",
            endGameRobot2: "Park",
          }),
          match(2, "sf", 2, {
            endGameRobot1: "DeepCage",
            endGameRobot2: "Park",
          }),
          match(1, "f", 1, { endGameRobot1: "DeepCage" }),
          match(2, "qm", 1, { endGameRobot1: "DeepCage" }),
          match(2, "qm", 1, { endGameRobot1: "DeepCage" }),
          match(3, "f", 3, { endGameRobot3: "DeepCage" }),
        ],
      },
    };

    it("counts per-robot fields in playoff matches", () => {
      const result = findCategoryWinners(
        winnerConfigSchema.parse({
          matches: "playoffs",
          measures: {
            climbs: {
              source: "tba.matches",
              op: "count",
              where: [
                { field: "compLevel", op: "in", value: ["sf", "f"] },
                {
                  field: "breakdown.endGameRobot{n}",
                  op: "eq",
                  value: "DeepCage",
                },
              ],
            },
          },
          value: "climbs",
          select: { type: "nth", n: 1, order: "desc" },
        }),
        data,
      );

      expect(result.winners).toEqual([1]);
      expect(result.teams.map((t) => t.value)).toEqual([2, 0, 1]);
    });
  });

  describe("match scope", () => {
    const row = (team: number, compLevel: string): ScoringRow => ({
      team,
      compLevel,
      robotIndex: 1,
    });
    const data: WinnerEngineInput = {
      teams: [1],
      sources: {
        "tba.matches": [
          row(1, "pm"),
          row(1, "qm"),
          row(1, "qm"),
          row(1, "sf"),
          row(1, "f"),
        ],
      },
    };
    const countMatches = (matches?: "qualification" | "playoffs" | "all") =>
      findCategoryWinners(
        winnerConfigSchema.parse({
          ...(matches ? { matches } : {}),
          measures: { n: { source: "tba.matches", op: "count" } },
          value: "n",
          select: { type: "nth", n: 1, order: "desc" },
        }),
        data,
      ).teams[0].value;

    it("counts only qualification matches by default", () => {
      expect(countMatches()).toBe(2);
    });

    it("counts only playoff matches", () => {
      expect(countMatches("playoffs")).toBe(2);
    });

    it("counts all matches except practice", () => {
      expect(countMatches("all")).toBe(4);
    });
  });

  describe("filters against another source", () => {
    const data: WinnerEngineInput = {
      teams: [1, 2, 3],
      sources: {
        "tba.matches": [
          { team: 1, compLevel: "qm", robotIndex: 1 },
          { team: 1, compLevel: "qm", robotIndex: 1 },
          { team: 2, compLevel: "qm", robotIndex: 1 },
          { team: 2, compLevel: "qm", robotIndex: 1 },
          { team: 2, compLevel: "qm", robotIndex: 1 },
          { team: 3, compLevel: "qm", robotIndex: 1 },
        ],
        "tba.rankings": teamRows({
          1: { rank: 1 },
          2: { rank: 9 },
          3: { rank: 2 },
        }),
        "tba.alliances": [
          { team: 1, allianceNumber: 1, role: "captain" },
          { team: 3, allianceNumber: 1, role: "pick1" },
        ],
      },
    };

    const result = (
      where: WinnerConfigInput["measures"][string]["where"],
      op: "count" | "value" = "count",
    ) =>
      findCategoryWinners(
        winnerConfigSchema.parse({
          measures: {
            n:
              op === "count"
                ? { source: "tba.matches", op, where }
                : { source: "tba.rankings", field: "rank", where },
          },
          value: "n",
          select: { type: "nth", n: 1, order: "desc" },
        }),
        data,
      ).teams.map((team) => team.value);

    it("counts rows only for teams that match in the other source", () => {
      expect(
        result([
          { source: "tba.rankings", field: "rank", op: "lte", value: 8 },
        ]),
      ).toEqual([2, 0, 1]);
    });

    it("combines filters from different sources", () => {
      expect(
        result([
          { source: "tba.rankings", field: "rank", op: "lte", value: 8 },
          {
            source: "tba.alliances",
            field: "role",
            op: "eq",
            value: "captain",
          },
        ]),
      ).toEqual([2, 0, 0]);
    });

    it("gives no value to a value measure whose team does not match", () => {
      expect(
        result(
          [
            {
              source: "tba.alliances",
              field: "role",
              op: "in",
              value: ["captain", "pick1"],
            },
          ],
          "value",
        ),
      ).toEqual([1, null, 2]);
    });

    it("matches all filters on one other source against the same row", () => {
      const playoffData: WinnerEngineInput = {
        teams: [1, 2],
        sources: {
          "tba.alliances": [
            { team: 1, allianceNumber: 1, role: "captain" },
            { team: 2, allianceNumber: 2, role: "captain" },
          ],
          "tba.matches": [
            // Team 1 won round 1 and lost a later match.
            { team: 1, compLevel: "sf", setNumber: 1, outcome: "win" },
            { team: 1, compLevel: "sf", setNumber: 11, outcome: "loss" },
            // Team 2 lost round 1.
            { team: 2, compLevel: "sf", setNumber: 2, outcome: "loss" },
          ],
        },
      };

      const result = findCategoryWinners(
        winnerConfigSchema.parse({
          matches: "playoffs",
          measures: {
            alliance: {
              source: "tba.alliances",
              field: "allianceNumber",
              where: [
                { field: "role", op: "eq", value: "captain" },
                {
                  source: "tba.matches",
                  field: "outcome",
                  op: "eq",
                  value: "loss",
                },
                {
                  source: "tba.matches",
                  field: "setNumber",
                  op: "in",
                  value: [1, 2, 3, 4],
                },
                {
                  source: "tba.matches",
                  field: "compLevel",
                  op: "eq",
                  value: "sf",
                },
              ],
            },
          },
          value: "alliance",
          select: { type: "nth", n: 1, order: "asc" },
        }),
        playoffData,
      );

      expect(result.teams.map((team) => team.value)).toEqual([null, 2]);
      expect(result.winners).toEqual([2]);
    });

    it("treats a filter on the measure's own source as a row filter", () => {
      expect(
        result([
          { source: "tba.matches", field: "compLevel", op: "eq", value: "qm" },
        ]),
      ).toEqual([2, 3, 1]);
    });
  });

  it("excludes teams with no data for a value measure", () => {
    const result = findCategoryWinners(
      winnerConfigSchema.parse({
        measures: { rank: { source: "tba.rankings", field: "rank" } },
        value: "rank",
        select: { type: "threshold", op: "lte", value: 2 },
      }),
      { teams: [1, 7], sources: rankingData.sources },
    );

    expect(result.winners).toEqual([1]);
    expect(result.teams[1]).toMatchObject({
      team: 7,
      excludedReason: "missingData",
    });
  });

  it("matches an exact value", () => {
    expect(
      winners(
        {
          measures: {
            alliance: { source: "tba.alliances", field: "allianceNumber" },
          },
          value: "alliance",
          select: { type: "equals", value: 2 },
        },
        rankingData,
      ),
    ).toEqual([2, 6]);
  });
});

describe("winnerConfigSchema", () => {
  it("rejects a value that names a missing measure", () => {
    const result = winnerConfigSchema.safeParse({
      measures: { rank: { source: "tba.rankings", field: "rank" } },
      value: "score",
      select: { type: "nth", n: 1, order: "desc" },
    });

    expect(result.success).toBe(false);
  });

  it("requires a field unless the operation is count", () => {
    const result = winnerConfigSchema.safeParse({
      measures: { rank: { source: "tba.rankings", op: "max" } },
      value: "rank",
      select: { type: "nth", n: 1, order: "desc" },
    });

    expect(result.success).toBe(false);
  });
});
