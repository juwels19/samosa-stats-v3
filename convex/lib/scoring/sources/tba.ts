import * as z from "zod";

/**
 * The Blue Alliance API v3. Schemas follow the OpenAPI spec at
 * https://www.thebluealliance.com/swagger/api_v3.json.
 *
 * Objects are loose: fields not in a schema are kept, so a new field from TBA
 * does not break parsing. Fields in a schema are required and checked.
 */

const TBA_BASE_URL = "https://www.thebluealliance.com/api/v3";

export const compLevelSchema = z.enum(["pm", "qm", "ef", "qf", "sf", "f"]);
const allianceColorSchema = z.enum(["red", "blue"]);

const wltRecordSchema = z.looseObject({
  wins: z.int(),
  losses: z.int(),
  ties: z.int(),
});

// ---------------------------------------------------------------------------
// Season score breakdowns. Add a schema here for each new game.

// 2026 REBUILT.

const towerRobot2026Schema = z.enum(["Level1", "Level2", "Level3", "None"]);

const hubScore2026Schema = z.looseObject({
  autoCount: z.int(),
  autoPoints: z.int(),
  transitionCount: z.int(),
  transitionPoints: z.int(),
  shift1Count: z.int(),
  shift1Points: z.int(),
  shift2Count: z.int(),
  shift2Points: z.int(),
  shift3Count: z.int(),
  shift3Points: z.int(),
  shift4Count: z.int(),
  shift4Points: z.int(),
  endgameCount: z.int(),
  endgamePoints: z.int(),
  teleopCount: z.int(),
  teleopPoints: z.int(),
  totalCount: z.int(),
  totalPoints: z.int(),
});

export const tbaAllianceBreakdown2026Schema = z.looseObject({
  adjustPoints: z.int(),
  autoTowerPoints: z.int(),
  autoTowerRobot1: towerRobot2026Schema,
  autoTowerRobot2: towerRobot2026Schema,
  autoTowerRobot3: towerRobot2026Schema,
  endGameTowerPoints: z.int(),
  endGameTowerRobot1: towerRobot2026Schema,
  endGameTowerRobot2: towerRobot2026Schema,
  endGameTowerRobot3: towerRobot2026Schema,
  energizedAchieved: z.boolean(),
  foulPoints: z.int(),
  g206Penalty: z.boolean(),
  hubScore: hubScore2026Schema,
  majorFoulCount: z.int(),
  minorFoulCount: z.int(),
  rp: z.number(),
  superchargedAchieved: z.boolean(),
  totalAutoPoints: z.int(),
  totalPoints: z.int(),
  totalTeleopPoints: z.int(),
  totalTowerPoints: z.int(),
  traversalAchieved: z.boolean(),
});

// 2025 REEFSCAPE. From Match_Score_Breakdown_2025_Alliance in the TBA spec.

const autoLineRobot2025Schema = z.enum(["No", "Yes"]);
const endGameRobot2025Schema = z.enum(["DeepCage", "None", "Parked", "ShallowCage"]);

/** One reef level. Each node is one coral branch, A to L. */
const reefRow2025Schema = z.looseObject({
  nodeA: z.boolean(),
  nodeB: z.boolean(),
  nodeC: z.boolean(),
  nodeD: z.boolean(),
  nodeE: z.boolean(),
  nodeF: z.boolean(),
  nodeG: z.boolean(),
  nodeH: z.boolean(),
  nodeI: z.boolean(),
  nodeJ: z.boolean(),
  nodeK: z.boolean(),
  nodeL: z.boolean(),
});

const reef2025Schema = z.looseObject({
  topRow: reefRow2025Schema,
  midRow: reefRow2025Schema,
  botRow: reefRow2025Schema,
  /** Coral in the trough (level 1). */
  trough: z.int(),
  /** TBA's own counts of the coral in each row. Not official. */
  tba_topRowCount: z.int().optional(),
  tba_midRowCount: z.int().optional(),
  tba_botRowCount: z.int().optional(),
});

export const tbaAllianceBreakdown2025Schema = z.looseObject({
  adjustPoints: z.int().optional(),
  algaePoints: z.int(),
  autoBonusAchieved: z.boolean().optional(),
  autoCoralCount: z.int(),
  autoCoralPoints: z.int(),
  autoLineRobot1: autoLineRobot2025Schema,
  autoLineRobot2: autoLineRobot2025Schema,
  autoLineRobot3: autoLineRobot2025Schema,
  autoMobilityPoints: z.int(),
  autoPoints: z.int(),
  autoReef: reef2025Schema,
  bargeBonusAchieved: z.boolean().optional(),
  coopertitionCriteriaMet: z.boolean().optional(),
  coralBonusAchieved: z.boolean().optional(),
  endGameBargePoints: z.int(),
  endGameRobot1: endGameRobot2025Schema,
  endGameRobot2: endGameRobot2025Schema,
  endGameRobot3: endGameRobot2025Schema,
  foulCount: z.int(),
  foulPoints: z.int(),
  g206Penalty: z.boolean(),
  g410Penalty: z.boolean(),
  g418Penalty: z.boolean(),
  g428Penalty: z.boolean(),
  netAlgaeCount: z.int(),
  rp: z.number(),
  techFoulCount: z.int(),
  teleopCoralCount: z.int(),
  teleopCoralPoints: z.int(),
  teleopPoints: z.int(),
  teleopReef: reef2025Schema,
  totalPoints: z.int(),
  wallAlgaeCount: z.int(),
});

/** For seasons with no breakdown schema yet. */
export const unknownBreakdownSchema = z.record(z.string(), z.unknown());

export const tbaBreakdownSchemas = {
  2025: tbaAllianceBreakdown2025Schema,
  2026: tbaAllianceBreakdown2026Schema,
} as const;

export type TbaBreakdownYear = keyof typeof tbaBreakdownSchemas;

export type TbaBreakdownSchema<Year extends number> =
  Year extends TbaBreakdownYear
    ? (typeof tbaBreakdownSchemas)[Year]
    : typeof unknownBreakdownSchema;

export function getTbaBreakdownSchema<Year extends number>(
  year: Year,
): TbaBreakdownSchema<Year> {
  const schemas: Partial<Record<number, z.ZodType>> = tbaBreakdownSchemas;
  return (schemas[year] ?? unknownBreakdownSchema) as TbaBreakdownSchema<Year>;
}

// ---------------------------------------------------------------------------
// API responses

const tbaMatchAllianceSchema = z.looseObject({
  score: z.int(),
  team_keys: z.array(z.string()),
  surrogate_team_keys: z.array(z.string()),
  dq_team_keys: z.array(z.string()),
});

export const tbaMatchSchema = z.looseObject({
  key: z.string(),
  comp_level: compLevelSchema,
  set_number: z.int(),
  match_number: z.int(),
  alliances: z.looseObject({
    red: tbaMatchAllianceSchema,
    blue: tbaMatchAllianceSchema,
  }),
  winning_alliance: z.enum(["red", "blue", ""]),
  score_breakdown: z
    .looseObject({ red: z.unknown(), blue: z.unknown() })
    .nullable(),
});

const tbaRankingSchema = z.looseObject({
  team_key: z.string(),
  rank: z.int(),
  matches_played: z.int(),
  dq: z.int(),
  qual_average: z.number().nullable(),
  sort_orders: z.array(z.number()),
  extra_stats: z.array(z.number()),
  record: wltRecordSchema.nullable(),
});

export const tbaRankingsSchema = z
  .looseObject({
    rankings: z.array(tbaRankingSchema),
    sort_order_info: z
      .array(z.looseObject({ name: z.string(), precision: z.number() }))
      .nullable(),
  })
  .nullable();

const allianceStatusSchema = z.enum(["eliminated", "playing", "won"]);

export const tbaAlliancesSchema = z
  .array(
    z.looseObject({
      picks: z.array(z.string()),
      backup: z.looseObject({ in: z.string(), out: z.string() }).nullish(),
      status: z
        .looseObject({
          status: allianceStatusSchema,
          level: compLevelSchema,
        })
        .nullish(),
    }),
  )
  .nullable();

export const tbaAwardsSchema = z.array(
  z.looseObject({
    name: z.string(),
    award_type: z.int(),
    recipient_list: z.array(
      z.looseObject({
        team_key: z.string().nullable(),
        awardee: z.string().nullable(),
      }),
    ),
  }),
);

// ---------------------------------------------------------------------------
// Rows. Each row belongs to one team.

const tbaMatchRowFields = {
  team: z.int(),
  matchKey: z.string(),
  compLevel: compLevelSchema,
  setNumber: z.int(),
  matchNumber: z.int(),
  alliance: allianceColorSchema,
  /** The team's position in its alliance, 1 to 3. Matches `Robot{n}` fields. */
  robotIndex: z.int().min(1),
  outcome: z.enum(["win", "loss", "tie"]),
  score: z.int(),
  opponentScore: z.int(),
  isSurrogate: z.boolean(),
  isDisqualified: z.boolean(),
};

export function getTbaMatchRowSchema(year: number) {
  return z.object({
    ...tbaMatchRowFields,
    breakdown: getTbaBreakdownSchema(year).nullable(),
  });
}

export type TbaMatchRow<Year extends number = number> = z.infer<
  z.ZodObject<typeof tbaMatchRowFields>
> & {
  breakdown: z.infer<TbaBreakdownSchema<Year>> | null;
};

export const tbaRankingRowSchema = tbaRankingSchema.extend({ team: z.int() });
export type TbaRankingRow = z.infer<typeof tbaRankingRowSchema>;

export const tbaAllianceRowSchema = z.object({
  team: z.int(),
  allianceNumber: z.int().min(1),
  role: z.enum(["captain", "pick1", "pick2", "pick3", "backup"]),
  allianceStatus: allianceStatusSchema.nullable(),
  /** The last match level the alliance played. */
  finalLevel: compLevelSchema.nullable(),
});
export type TbaAllianceRow = z.infer<typeof tbaAllianceRowSchema>;

export const tbaAwardRowSchema = z.object({
  team: z.int(),
  awardType: z.int(),
  awardName: z.string(),
  awardee: z.string().nullable(),
});
export type TbaAwardRow = z.infer<typeof tbaAwardRowSchema>;

// ---------------------------------------------------------------------------
// Adapters

/** `frc254` to 254. Returns null for keys like `frc254B`. */
export function teamNumberFromKey(teamKey: string): number | null {
  const match = /^frc(\d+)$/.exec(teamKey);
  return match ? Number(match[1]) : null;
}

export function toTbaTeamNumbers(response: unknown): number[] {
  const teamKeys = parseResponse(z.array(z.string()), response, "team keys");
  return teamKeys
    .map(teamNumberFromKey)
    .filter((team): team is number => team !== null)
    .sort((a, b) => a - b);
}

/** One row for each team in each played match. Unplayed matches are skipped. */
export function toTbaMatchRows<Year extends number>(
  response: unknown,
  year: Year,
): TbaMatchRow<Year>[] {
  const matches = parseResponse(z.array(tbaMatchSchema), response, "matches");
  const breakdownSchema: z.ZodType = getTbaBreakdownSchema(year);
  const rows: TbaMatchRow<Year>[] = [];

  for (const match of matches) {
    const { red, blue } = match.alliances;
    if (red.score < 0 || blue.score < 0) {
      continue;
    }

    for (const color of allianceColorSchema.options) {
      const alliance = match.alliances[color];
      const opponent = match.alliances[color === "red" ? "blue" : "red"];
      const breakdown =
        match.score_breakdown === null
          ? null
          : parseResponse(
              breakdownSchema,
              match.score_breakdown[color],
              `${match.key} ${color} score breakdown`,
            );

      alliance.team_keys.forEach((teamKey, index) => {
        const team = teamNumberFromKey(teamKey);
        if (team === null) {
          return;
        }

        rows.push({
          team,
          matchKey: match.key,
          compLevel: match.comp_level,
          setNumber: match.set_number,
          matchNumber: match.match_number,
          alliance: color,
          robotIndex: index + 1,
          outcome:
            match.winning_alliance === ""
              ? "tie"
              : match.winning_alliance === color
                ? "win"
                : "loss",
          score: alliance.score,
          opponentScore: opponent.score,
          isSurrogate: alliance.surrogate_team_keys.includes(teamKey),
          isDisqualified: alliance.dq_team_keys.includes(teamKey),
          breakdown: breakdown as TbaMatchRow<Year>["breakdown"],
        });
      });
    }
  }

  return rows;
}

export function toTbaRankingRows(response: unknown): TbaRankingRow[] {
  const rankings = parseResponse(tbaRankingsSchema, response, "rankings");
  return (rankings?.rankings ?? []).flatMap((ranking) => {
    const team = teamNumberFromKey(ranking.team_key);
    return team === null ? [] : [{ ...ranking, team }];
  });
}

const PICK_ROLES = ["captain", "pick1", "pick2", "pick3"] as const;

export function toTbaAllianceRows(response: unknown): TbaAllianceRow[] {
  const alliances = parseResponse(tbaAlliancesSchema, response, "alliances");

  return (alliances ?? []).flatMap((alliance, index) => {
    const shared = {
      allianceNumber: index + 1,
      allianceStatus: alliance.status?.status ?? null,
      finalLevel: alliance.status?.level ?? null,
    };
    const teamKeys = [
      ...alliance.picks.map((teamKey, pickIndex) => ({
        teamKey,
        role: PICK_ROLES[pickIndex] ?? ("pick3" as const),
      })),
      ...(alliance.backup
        ? [{ teamKey: alliance.backup.in, role: "backup" as const }]
        : []),
    ];

    return teamKeys.flatMap(({ teamKey, role }) => {
      const team = teamNumberFromKey(teamKey);
      return team === null ? [] : [{ team, role, ...shared }];
    });
  });
}

export function toTbaAwardRows(response: unknown): TbaAwardRow[] {
  const awards = parseResponse(tbaAwardsSchema, response, "awards");

  return awards.flatMap((award) =>
    award.recipient_list.flatMap((recipient) => {
      const team =
        recipient.team_key === null
          ? null
          : teamNumberFromKey(recipient.team_key);
      return team === null
        ? []
        : [
            {
              team,
              awardType: award.award_type,
              awardName: award.name,
              awardee: recipient.awardee,
            },
          ];
    }),
  );
}

// ---------------------------------------------------------------------------
// Fetch

export function getTbaEventKey(year: number, eventCode: string) {
  return `${year}${eventCode.trim().toLowerCase()}`;
}

export async function fetchTba(path: string): Promise<unknown> {
  const apiKey = process.env.TBA_API_KEY;
  if (!apiKey) {
    throw new Error("TBA_API_KEY is not set.");
  }

  const response = await fetch(`${TBA_BASE_URL}${path}`, {
    headers: { "X-TBA-Auth-Key": apiKey },
  });
  if (!response.ok) {
    throw new Error(
      `The Blue Alliance returned ${response.status} for ${path}.`,
    );
  }
  return await response.json();
}

function parseResponse<Schema extends z.ZodType>(
  schema: Schema,
  data: unknown,
  label: string,
): z.infer<Schema> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(
      `Unexpected TBA ${label} data:\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}
