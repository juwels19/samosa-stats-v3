import { describe, expect, it } from "vitest";

import { findCategoryWinners } from "../find_category_winners";
import { winnerConfigSchema } from "../winner_config";
import {
  checkApiPath,
  getApiSourceKey,
  resolveApiPath,
  selectPath,
  toApiRows,
  toTeamNumber,
} from "./api_source";

const matches = [
  {
    comp_level: "qm",
    actual_time: 1100,
    predicted_time: 1000,
    alliances: {
      red: { score: 80, team_keys: ["frc254", "frc1114"] },
      blue: { score: 60, team_keys: ["frc2056", "frc4917"] },
    },
  },
  {
    comp_level: "qm",
    actual_time: 2000,
    predicted_time: 2000,
    alliances: {
      red: { score: 50, team_keys: ["frc254", "frc2056"] },
      blue: { score: 90, team_keys: ["frc1114", "frc4917"] },
    },
  },
];

describe("checkApiPath", () => {
  it("allows event-scoped paths for each service", () => {
    expect(checkApiPath("tba", "/event/{eventKey}/matches")).toBeNull();
    expect(checkApiPath("statbotics", "/matches?event={eventKey}")).toBeNull();
    expect(checkApiPath("frcEvents", "/{year}/schedule/{eventCode}?tournamentLevel=Qualification")).toBeNull();
  });

  it("rejects paths outside an event", () => {
    expect(checkApiPath("tba", "/team/frc254")).not.toBeNull();
    expect(checkApiPath("statbotics", "/teams")).not.toBeNull();
    expect(checkApiPath("frcEvents", "/{year}/teams")).not.toBeNull();
    expect(checkApiPath("tba", "/event/{eventKey}/../status")).not.toBeNull();
    expect(checkApiPath("tba", "https://example.com/event/{eventKey}")).not.toBeNull();
  });
});

describe("resolveApiPath", () => {
  it("fills in the event placeholders", () => {
    expect(resolveApiPath({ service: "tba", path: "/event/{eventKey}/matches" }, { year: 2026, eventCode: "ONOSH" })).toBe(
      "/event/2026onosh/matches",
    );
    expect(resolveApiPath({ service: "frcEvents", path: "/{year}/alliances/{eventCode}" }, { year: 2026, eventCode: "onosh" })).toBe(
      "/2026/alliances/ONOSH",
    );
  });
});

describe("selectPath", () => {
  it("expands * over lists and object values, keeping the first match as context", () => {
    const found = selectPath(matches[0], "alliances.*.team_keys.*");
    expect(found.map((match) => match.value)).toEqual(["frc254", "frc1114", "frc2056", "frc4917"]);
    expect(found[0].context).toBe(matches[0].alliances.red);
  });
});

describe("toTeamNumber", () => {
  it("reads numbers, digit strings and TBA keys", () => {
    expect(toTeamNumber(254)).toBe(254);
    expect(toTeamNumber("254")).toBe(254);
    expect(toTeamNumber("frc254")).toBe(254);
    expect(toTeamNumber("frc254B")).toBeNull();
    expect(toTeamNumber(null)).toBeNull();
  });
});

describe("toApiRows", () => {
  it("makes one row for each team in each item, with its alliance as $context", () => {
    const rows = toApiRows(matches, { rows: "", team: "alliances.*.team_keys.*" });
    expect(rows).toHaveLength(8);
    expect(rows[0]).toMatchObject({ team: 254, actual_time: 1100, $context: { score: 80 } });
  });

  it("makes one row for each entry of an object keyed by team", () => {
    const oprs = { oprs: { frc254: 41.2, frc1114: 38.7, frc9999B: 1 }, dprs: { frc254: 10 } };
    expect(toApiRows(oprs, { rows: "oprs", team: "$key" })).toEqual([
      { value: 41.2, $key: "frc254", team: 254 },
      { value: 38.7, $key: "frc1114", team: 1114 },
    ]);
  });

  it("keeps the fields of keyed objects", () => {
    const statuses = {
      frc254: { qual: { ranking: { rank: 1 } }, overall_status_str: "Won" },
      frc1114: null,
    };
    const rows = toApiRows(statuses, { rows: "", team: "$key" });
    expect(rows).toEqual([
      { qual: { ranking: { rank: 1 } }, overall_status_str: "Won", $key: "frc254", team: 254 },
      { value: null, $key: "frc1114", team: 1114 },
    ]);
  });

  it("finds rows under a path", () => {
    const rows = toApiRows({ Alliances: [{ captain: 254 }, { captain: 1114 }] }, { rows: "Alliances", team: "captain" });
    expect(rows.map((row) => row.team)).toEqual([254, 1114]);
  });
});

describe("custom sources in the engine", () => {
  it("measures rows of a custom source by its key", () => {
    const api = { service: "tba", path: "/event/{eventKey}/matches", rows: "", team: "alliances.*.team_keys.*" } as const;
    const config = winnerConfigSchema.parse({
      measures: {
        actual: { source: "api", api, field: "actual_time", op: "avg" },
        predicted: { source: "api", api, field: "predicted_time", op: "avg" },
      },
      value: { op: "subtract", left: "actual", right: "predicted" },
      select: { type: "nth", n: 1, order: "desc" },
    });
    const rows = toApiRows(matches, api);

    const result = findCategoryWinners(config, {
      teams: [254, 1114, 2056, 4917],
      sources: {},
      api: { [getApiSourceKey(api)]: rows },
    });

    // Every team played both matches: (1100 + 2000) / 2 - (1000 + 2000) / 2 = 50.
    expect(result.teams.find((team) => team.team === 254)?.value).toBe(50);
    expect(result.winners).toEqual([254, 1114, 2056, 4917]);
  });

  it("ranks teams by a keyed custom source", () => {
    const api = { service: "tba", path: "/event/{eventKey}/oprs", rows: "oprs", team: "$key" } as const;
    const config = winnerConfigSchema.parse({
      measures: { opr: { source: "api", api, field: "value", op: "value" } },
      value: "opr",
      select: { type: "nth", n: 1, order: "desc" },
    });
    const rows = toApiRows({ oprs: { frc254: 41.2, frc1114: 38.7 } }, api);

    const result = findCategoryWinners(config, {
      teams: [254, 1114, 2056],
      sources: {},
      api: { [getApiSourceKey(api)]: rows },
    });

    expect(result.winners).toEqual([254]);
    expect(result.teams.find((team) => team.team === 2056)?.excludedReason).toBe("missingData");
  });

  it("rejects filters that name another source", () => {
    const parsed = winnerConfigSchema.safeParse({
      measures: {
        late: {
          source: "api",
          api: { service: "tba", path: "/event/{eventKey}/matches", team: "alliances.*.team_keys.*" },
          op: "count",
          where: [{ source: "tba.rankings", field: "rank", op: "lte", value: 8 }],
        },
      },
      value: "late",
      select: { type: "nth", n: 1, order: "desc" },
    });
    expect(parsed.success).toBe(false);
  });
});
