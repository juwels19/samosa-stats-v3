import { describe, expect, it } from "vitest";

import teamEvents from "./fixtures/statbotics_team_events_2026onosh.json";
import { toStatboticsTeamEventRows } from "./statbotics";

describe("toStatboticsTeamEventRows", () => {
  it("parses a real 2026 response", () => {
    const rows = toStatboticsTeamEventRows(teamEvents, 2026);

    expect(rows).toHaveLength(28);
    const row = rows.find((r) => r.team === 10015);
    expect(row?.epa.total_points).toBeTypeOf("number");
    expect(row?.epa.breakdown.auto_fuel).toBeTypeOf("number");
    expect(row?.record.qual.rank).toBe(4);
  });

  it("names the field when the shape is wrong", () => {
    const [first] = teamEvents;
    const broken = [
      { ...first, epa: { ...first.epa, breakdown: { auto_fuel: "x" } } },
    ];

    expect(() => toStatboticsTeamEventRows(broken, 2026)).toThrow(/breakdown/);
  });
});
