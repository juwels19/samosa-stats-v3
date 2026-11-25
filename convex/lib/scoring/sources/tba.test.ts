import { describe, expect, expectTypeOf, it } from "vitest";

import matches2025 from "./fixtures/tba_matches_2025onosh.json";
import {
  toTbaAllianceRows,
  toTbaAwardRows,
  toTbaMatchRows,
  toTbaRankingRows,
  type TbaMatchRow,
} from "./tba";

export function breakdown2026(overrides: Record<string, unknown> = {}) {
  const hubScore = Object.fromEntries(
    [
      "auto",
      "transition",
      "shift1",
      "shift2",
      "shift3",
      "shift4",
      "endgame",
      "teleop",
      "total",
    ].flatMap((phase) => [
      [`${phase}Count`, 0],
      [`${phase}Points`, 0],
    ]),
  );

  return {
    adjustPoints: 0,
    autoTowerPoints: 0,
    autoTowerRobot1: "None",
    autoTowerRobot2: "None",
    autoTowerRobot3: "None",
    endGameTowerPoints: 0,
    endGameTowerRobot1: "None",
    endGameTowerRobot2: "None",
    endGameTowerRobot3: "None",
    energizedAchieved: false,
    foulPoints: 0,
    g206Penalty: false,
    hubScore,
    majorFoulCount: 0,
    minorFoulCount: 0,
    rp: 0,
    superchargedAchieved: false,
    totalAutoPoints: 0,
    totalPoints: 0,
    totalTeleopPoints: 0,
    totalTowerPoints: 0,
    traversalAchieved: false,
    ...overrides,
  };
}

function match({
  key = "2026onosh_qm1",
  compLevel = "qm",
  red = { score: 50, team_keys: ["frc1", "frc2", "frc3"] },
  blue = { score: 40, team_keys: ["frc4", "frc5", "frc6"] },
  winner = "red",
  breakdown = { red: breakdown2026(), blue: breakdown2026() } as unknown,
}: {
  key?: string;
  compLevel?: string;
  red?: { score: number; team_keys: string[]; surrogate_team_keys?: string[] };
  blue?: { score: number; team_keys: string[] };
  winner?: string;
  breakdown?: unknown;
} = {}) {
  const alliance = (a: { score: number; team_keys: string[] }) => ({
    surrogate_team_keys: [],
    dq_team_keys: [],
    ...a,
  });
  return {
    key,
    comp_level: compLevel,
    set_number: 1,
    match_number: 1,
    alliances: { red: alliance(red), blue: alliance(blue) },
    winning_alliance: winner,
    score_breakdown: breakdown,
  };
}

describe("toTbaMatchRows", () => {
  it("makes one row for each team, with its robot position", () => {
    const rows = toTbaMatchRows(
      [
        match({
          breakdown: {
            red: breakdown2026({ endGameTowerRobot2: "Level3" }),
            blue: breakdown2026(),
          },
        }),
      ],
      2026,
    );

    expect(rows).toHaveLength(6);
    expect(rows[1]).toMatchObject({
      team: 2,
      alliance: "red",
      robotIndex: 2,
      outcome: "win",
      score: 50,
      opponentScore: 40,
    });
    expect(rows[1].breakdown?.endGameTowerRobot2).toBe("Level3");
    expect(rows[4]).toMatchObject({ team: 5, outcome: "loss", robotIndex: 2 });
  });

  it("types the 2026 breakdown", () => {
    expectTypeOf<TbaMatchRow<2026>["breakdown"]>()
      .exclude<null>()
      .toHaveProperty("endGameTowerRobot1")
      .toEqualTypeOf<"Level1" | "Level2" | "Level3" | "None">();
  });

  it("parses real 2025 matches", () => {
    const rows = toTbaMatchRows(matches2025, 2025);

    expect(rows).toHaveLength(matches2025.length * 6);
    const breakdown = rows[0].breakdown;
    expect(breakdown?.teleopReef.topRow.nodeA).toBeTypeOf("boolean");
    expect(breakdown?.autoReef.trough).toBeTypeOf("number");
    expect(["DeepCage", "None", "Parked", "ShallowCage"]).toContain(breakdown?.endGameRobot1);
  });

  it("types the 2025 breakdown", () => {
    expectTypeOf<TbaMatchRow<2025>["breakdown"]>()
      .exclude<null>()
      .toHaveProperty("endGameRobot1")
      .toEqualTypeOf<"DeepCage" | "None" | "Parked" | "ShallowCage">();
  });

  it("marks a tie and a surrogate", () => {
    const rows = toTbaMatchRows(
      [
        match({
          winner: "",
          red: {
            score: 40,
            team_keys: ["frc1", "frc2", "frc3"],
            surrogate_team_keys: ["frc3"],
          },
        }),
      ],
      2026,
    );

    expect(rows[0].outcome).toBe("tie");
    expect(rows[2].isSurrogate).toBe(true);
    expect(rows[1].isSurrogate).toBe(false);
  });

  it("skips unplayed matches", () => {
    const rows = toTbaMatchRows(
      [match({ red: { score: -1, team_keys: ["frc1"] }, breakdown: null })],
      2026,
    );
    expect(rows).toEqual([]);
  });

  it("keeps a played match with no breakdown", () => {
    const rows = toTbaMatchRows([match({ breakdown: null })], 2026);
    expect(rows[0].breakdown).toBeNull();
  });

  it("throws with the field name when a 2026 breakdown is wrong", () => {
    expect(() =>
      toTbaMatchRows(
        [
          match({
            breakdown: {
              red: breakdown2026({ endGameTowerRobot1: "Level9" }),
              blue: breakdown2026(),
            },
          }),
        ],
        2026,
      ),
    ).toThrow(/2026onosh_qm1 red score breakdown[\s\S]*endGameTowerRobot1/);
  });

  it("accepts any breakdown for a season with no schema", () => {
    const rows = toTbaMatchRows(
      [match({ breakdown: { red: { anything: 1 }, blue: {} } })],
      2030,
    );
    expect(rows[0].breakdown).toEqual({ anything: 1 });
  });
});

describe("toTbaRankingRows", () => {
  it("adds the team number", () => {
    const rows = toTbaRankingRows({
      rankings: [
        {
          team_key: "frc1114",
          rank: 1,
          matches_played: 12,
          dq: 0,
          qual_average: null,
          sort_orders: [3.5, 120],
          extra_stats: [],
          record: { wins: 11, losses: 1, ties: 0 },
        },
      ],
      sort_order_info: [{ name: "Ranking Score", precision: 2 }],
    });

    expect(rows[0]).toMatchObject({
      team: 1114,
      rank: 1,
      sort_orders: [3.5, 120],
    });
  });

  it("returns no rows before rankings exist", () => {
    expect(toTbaRankingRows(null)).toEqual([]);
  });
});

describe("toTbaAllianceRows", () => {
  it("gives each team its alliance and role, with the backup", () => {
    const rows = toTbaAllianceRows([
      {
        picks: ["frc1", "frc2", "frc3"],
        backup: { in: "frc9", out: "frc3" },
        declines: [],
        status: { status: "won", level: "f" },
      },
      { picks: ["frc4", "frc5", "frc6"], declines: [] },
    ]);

    expect(rows).toEqual([
      {
        team: 1,
        role: "captain",
        allianceNumber: 1,
        allianceStatus: "won",
        finalLevel: "f",
      },
      {
        team: 2,
        role: "pick1",
        allianceNumber: 1,
        allianceStatus: "won",
        finalLevel: "f",
      },
      {
        team: 3,
        role: "pick2",
        allianceNumber: 1,
        allianceStatus: "won",
        finalLevel: "f",
      },
      {
        team: 9,
        role: "backup",
        allianceNumber: 1,
        allianceStatus: "won",
        finalLevel: "f",
      },
      {
        team: 4,
        role: "captain",
        allianceNumber: 2,
        allianceStatus: null,
        finalLevel: null,
      },
      {
        team: 5,
        role: "pick1",
        allianceNumber: 2,
        allianceStatus: null,
        finalLevel: null,
      },
      {
        team: 6,
        role: "pick2",
        allianceNumber: 2,
        allianceStatus: null,
        finalLevel: null,
      },
    ]);
  });
});

describe("toTbaAwardRows", () => {
  it("makes one row for each team recipient", () => {
    const rows = toTbaAwardRows([
      {
        name: "Excellence in Engineering Award",
        award_type: 21,
        event_key: "2026onosh",
        year: 2026,
        recipient_list: [
          { team_key: "frc1", awardee: null },
          { team_key: "frc2", awardee: null },
        ],
      },
      {
        name: "Volunteer of the Year",
        award_type: 5,
        event_key: "2026onosh",
        year: 2026,
        recipient_list: [{ team_key: null, awardee: "A Person" }],
      },
    ]);

    expect(rows).toEqual([
      {
        team: 1,
        awardType: 21,
        awardName: "Excellence in Engineering Award",
        awardee: null,
      },
      {
        team: 2,
        awardType: 21,
        awardName: "Excellence in Engineering Award",
        awardee: null,
      },
    ]);
  });
});
