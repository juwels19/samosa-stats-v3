import { describe, expect, it } from "vitest";

import { winnerConfigSchema } from "../../../../../../convex/lib/scoring/winner_config";
import { checkConfig, DEFAULT_FORM_VALUES, toFormValues } from "./form-values";

describe("form values", () => {
  it("round-trips a ratio config with filters", () => {
    const config = winnerConfigSchema.parse({
      teams: "notInEliminations",
      measures: {
        climbs: {
          source: "tba.matches",
          op: "count",
          where: [
            { field: "compLevel", op: "in", value: ["sf", "f"] },
            {
              field: "breakdown.endGameTowerRobot{n}",
              op: "eq",
              value: "Level3",
            },
          ],
        },
        matches: { source: "tba.matches", op: "count" },
      },
      value: { op: "divide", left: "climbs", right: "matches" },
      select: { type: "nth", n: 3, order: "desc" },
    });

    const check = checkConfig(toFormValues({ type: "config", config }), 2026);

    expect(check.ok).toBe(true);
    expect(check.config).toEqual(config);
  });

  it("round-trips a multi-part formula", () => {
    const config = winnerConfigSchema.parse({
      measures: {
        auto: { source: "statbotics.teamEvents", op: "value", field: "epa.breakdown.auto_points" },
        teleop: { source: "statbotics.teamEvents", op: "value", field: "epa.breakdown.teleop_points" },
        total: { source: "statbotics.teamEvents", op: "value", field: "epa.breakdown.total_points" },
      },
      value: {
        op: "multiply",
        left: {
          op: "divide",
          left: { op: "subtract", left: "auto", right: "teleop" },
          right: "total",
        },
        right: 100,
      },
      select: { type: "nth", n: 1, order: "desc" },
    });

    const values = toFormValues({ type: "config", config });
    expect(values.formula).toBe("(auto - teleop) / total * 100");
    expect(checkConfig(values, 2026).config).toEqual(config);
  });

  it("reports a formula it can't read, and a missing measure once", () => {
    const base = { ...DEFAULT_FORM_VALUES, valueMode: "calculation" as const };
    expect(checkConfig({ ...base, formula: "(rank +" }, 2026).issues).toEqual([
      "Formula: The formula ends too early.",
    ]);
    expect(checkConfig({ ...base, formula: "nope * nope" }, 2026).issues).toEqual([
      'value: No measure is named "nope".',
    ]);
  });

  it("round-trips a filter on another source", () => {
    const config = winnerConfigSchema.parse({
      measures: {
        captainMatches: {
          source: "tba.matches",
          op: "count",
          where: [
            {
              source: "tba.alliances",
              field: "role",
              op: "eq",
              value: "captain",
            },
            { field: "outcome", op: "eq", value: "win" },
          ],
        },
      },
      value: "captainMatches",
      select: { type: "nth", n: 1, order: "desc" },
    });

    const values = toFormValues({ type: "config", config });
    expect(values.measures[0].where.map((filter) => filter.source)).toEqual([
      "tba.alliances",
      "measure",
    ]);
    expect(checkConfig(values, 2026).config).toEqual(config);
  });

  it("parses threshold numbers", () => {
    const check = checkConfig(
      {
        ...DEFAULT_FORM_VALUES,
        selectType: "threshold",
        thresholdOp: "lte",
        selectValue: "3",
      },
      2026,
    );
    expect(check.config?.select).toEqual({
      type: "threshold",
      op: "lte",
      value: 3,
    });
  });

  it("reports duplicate measure names", () => {
    const check = checkConfig(
      {
        ...DEFAULT_FORM_VALUES,
        measures: [
          DEFAULT_FORM_VALUES.measures[0],
          DEFAULT_FORM_VALUES.measures[0],
        ],
      },
      2026,
    );
    expect(check.issues[0]).toMatch(/Two measures are named "rank"/);
  });

  it("reports unknown fields for the season", () => {
    const check = checkConfig(
      {
        ...DEFAULT_FORM_VALUES,
        measures: [{ ...DEFAULT_FORM_VALUES.measures[0], field: "nope" }],
      },
      2026,
    );
    expect(check.issues[0]).toMatch(
      /"nope" is not a tba.rankings field in 2026/,
    );
  });

  it("starts a manual category in manual mode", () => {
    expect(toFormValues({ type: "manual" }).mode).toBe("manual");
  });
});
