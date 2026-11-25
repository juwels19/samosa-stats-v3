import { describe, expect, it } from "vitest";

import teamEvents2025 from "./fixtures/statbotics_team_events_2025onosh.json";
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

  it("parses a real 2025 response", () => {
    const rows = toStatboticsTeamEventRows(teamEvents2025, 2025);

    expect(rows).toHaveLength(teamEvents2025.length);
    expect(rows[0].epa.breakdown.coral_l4).toBeTypeOf("number");
    expect(rows[0].epa.breakdown.barge_points).toBeTypeOf("number");
  });

  it("names the field when the shape is wrong", () => {
    const [first] = teamEvents;
    const broken = [
      { ...first, epa: { ...first.epa, breakdown: { auto_fuel: "x" } } },
    ];

    expect(() => toStatboticsTeamEventRows(broken, 2026)).toThrow(/breakdown/);
  });
});
