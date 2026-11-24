import { describe, expect, expectTypeOf, it } from "vitest";

import type { WinnerEngineInput } from "./find_category_winners";
import { findUnknownFields, listFieldPaths } from "./field_paths";
import type { ScoringEventData } from "./sources/event_data";
import { winnerConfigSchema, type WinnerConfigInput } from "./winner_config";

function config(measures: WinnerConfigInput["measures"]) {
  return winnerConfigSchema.parse({
    measures,
    value: Object.keys(measures)[0],
    select: { type: "nth", n: 1, order: "desc" },
  });
}

describe("listFieldPaths", () => {
  it("lists 2026 TBA match fields, with Robot{n} forms", () => {
    const { paths, openPrefixes } = listFieldPaths("tba.matches", 2026);

    expect(paths).toContain("compLevel");
    expect(paths).toContain("breakdown.hubScore.autoCount");
    expect(paths).toContain("breakdown.endGameTowerRobot1");
    expect(paths).toContain("breakdown.endGameTowerRobot{n}");
    expect(openPrefixes).toEqual([]);
  });

  it("leaves the breakdown open for a season with no schema", () => {
    const { openPrefixes } = listFieldPaths("tba.matches", 2030);
    expect(openPrefixes).toEqual(["breakdown"]);
  });

  it("lists the allowed values of fixed fields", () => {
    const { valueOptions } = listFieldPaths("tba.matches", 2026);

    expect(valueOptions.compLevel).toEqual(["pm", "qm", "ef", "qf", "sf", "f"]);
    expect(valueOptions["breakdown.endGameTowerRobot{n}"]).toEqual([
      "Level1",
      "Level2",
      "Level3",
      "None",
    ]);
    expect(valueOptions.isSurrogate).toEqual([true, false]);
    expect(valueOptions.score).toBeUndefined();
    expect(listFieldPaths("tba.alliances", 2026).valueOptions.role).toEqual([
      "captain",
      "pick1",
      "pick2",
      "pick3",
      "backup",
    ]);
  });

  it("lists array items with [i]", () => {
    expect(listFieldPaths("tba.rankings", 2026).paths).toContain(
      "sort_orders[i]",
    );
  });

  it("lists 2026 Statbotics breakdown fields", () => {
    expect(listFieldPaths("statbotics.teamEvents", 2026).paths).toContain(
      "epa.breakdown.auto_fuel",
    );
  });
});

describe("findUnknownFields", () => {
  it("accepts known fields", () => {
    expect(
      findUnknownFields(
        config({
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
          rs: { source: "tba.rankings", field: "sort_orders[0]" },
        }),
        2026,
      ),
    ).toEqual([]);
  });

  it("reports a field the season does not have", () => {
    expect(
      findUnknownFields(
        config({
          climbs: {
            source: "tba.matches",
            op: "count",
            where: [
              {
                field: "breakdown.endGameRobot{n}",
                op: "eq",
                value: "DeepCage",
              },
            ],
          },
        }),
        2026,
      ),
    ).toEqual([
      {
        measure: "climbs",
        source: "tba.matches",
        field: "breakdown.endGameRobot{n}",
      },
    ]);
  });

  it("checks a filter's field against its own source", () => {
    expect(
      findUnknownFields(
        config({
          climbs: {
            source: "tba.matches",
            op: "count",
            where: [
              {
                source: "tba.alliances",
                field: "role",
                op: "eq",
                value: "captain",
              },
              {
                source: "tba.alliances",
                field: "compLevel",
                op: "eq",
                value: "qm",
              },
            ],
          },
        }),
        2026,
      ),
    ).toEqual([
      { measure: "climbs", source: "tba.alliances", field: "compLevel" },
    ]);
  });

  it("accepts any breakdown field for a season with no schema", () => {
    expect(
      findUnknownFields(
        config({
          x: { source: "tba.matches", field: "breakdown.newGameThing" },
          y: { source: "tba.matches", field: "notAField" },
        }),
        2030,
      ),
    ).toEqual([{ measure: "y", source: "tba.matches", field: "notAField" }]);
  });
});

it("strongly typed event data fits the engine input", () => {
  // Fails type checking if ScoringEventData stops fitting the engine input.
  const toEngineInput = (data: ScoringEventData<2026>): WinnerEngineInput =>
    data;
  expect(toEngineInput).toBeTypeOf("function");
});

it("types the 2026 Statbotics breakdown", () => {
  expectTypeOf<
    ScoringEventData<2026>["sources"]["statbotics.teamEvents"][number]["epa"]["breakdown"]["auto_fuel"]
  >().toEqualTypeOf<number>();
});
