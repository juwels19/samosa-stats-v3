import { describe, expect, it } from "vitest";

import { listFieldPaths } from "../field_paths";
import matches2025 from "./fixtures/statbotics_matches_2025onosh.json";
import matches from "./fixtures/statbotics_matches_2026onosh.json";
import { toStatboticsMatchRows } from "./statbotics_matches";

describe("toStatboticsMatchRows", () => {
  it("parses a real 2026 response into one row for each team in each match", () => {
    const rows = toStatboticsMatchRows(matches, 2026);

    expect(rows).toHaveLength(matches.length * 6);
    const first = rows[0];
    expect(first).toMatchObject({ matchKey: "2026onosh_qm1", alliance: "red", robotIndex: 1 });
    expect(first.epa?.auto_epa).toBeTypeOf("number");
    expect(first.preEpa?.epa).toBeTypeOf("number");
    expect(first.result.score).toBe(matches[0].result.red_score);
    expect(first.opponentResult.score).toBe(matches[0].result.blue_score);
    expect(first.pred?.win_prob).toBe(matches[0].pred.red_win_prob);
    expect(rows[3].pred?.win_prob).toBeCloseTo(1 - matches[0].pred.red_win_prob);
  });

  it("parses a real 2025 response", () => {
    const rows = toStatboticsMatchRows(matches2025, 2025);

    expect(rows).toHaveLength(matches2025.length * 6);
    expect(rows[0].result.coral_l4).toBeTypeOf("number");
    expect(rows[0].result.barge_rp).toBeTypeOf("boolean");
    expect(rows[0].pred?.coral_rp).toBeTypeOf("number");
    expect(rows[0].epa?.comp_9_epa).toBeTypeOf("number");
  });

  it("lists typed fields for the field picker", () => {
    const { paths } = listFieldPaths("statbotics.matches", 2026);
    expect(paths).toEqual(
      expect.arrayContaining(["epa.auto_epa", "preEpa.epa", "result.auto_fuel", "pred.win_prob"]),
    );
  });
});
