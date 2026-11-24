import * as z from "zod";

import { getStatboticsBaseUrl } from "./statbotics";
import { compLevelSchema } from "./tba";

/**
 * Statbotics matches (`/v3/matches`). Statbotics has no per-team match
 * endpoint, so each match becomes one row for each team on it, with:
 * - the team's own EPA before (`preEpa`) and after (`epa`) the match
 * - its alliance's result and prediction, with `red_`/`blue_` removed
 * - the opponent alliance's result
 * Schemas come from real 2026 responses.
 */

const allianceColorSchema = z.enum(["red", "blue"]);

// ---------------------------------------------------------------------------
// Season schemas. Add schemas here for each new game. Keys are without the
// `red_` / `blue_` prefix.

const teamMatchEpaFields = {
  epa: z.number(),
  auto_epa: z.number(),
  teleop_epa: z.number(),
  endgame_epa: z.number(),
  rp_1_epa: z.number(),
  rp_2_epa: z.number(),
  rp_3_epa: z.number(),
  tiebreaker_epa: z.number(),
};

export const statboticsTeamMatchEpa2026Schema = z.looseObject({
  ...teamMatchEpaFields,
  comp_0_epa: z.number(),
  comp_1_epa: z.number(),
  comp_2_epa: z.number(),
  comp_3_epa: z.number(),
  comp_4_epa: z.number(),
  comp_5_epa: z.number(),
  comp_6_epa: z.number(),
  comp_7_epa: z.number(),
  comp_8_epa: z.number(),
  comp_9_epa: z.number(),
});

export const statboticsMatchResult2026Schema = z.looseObject({
  score: z.number(),
  no_foul: z.number(),
  auto_points: z.number(),
  teleop_points: z.number(),
  endgame_points: z.number(),
  tiebreaker_points: z.number(),
  auto_fuel: z.number(),
  auto_tower: z.number(),
  transition_fuel: z.number(),
  first_shift_fuel: z.number(),
  second_shift_fuel: z.number(),
  endgame_fuel: z.number(),
  endgame_tower: z.number(),
  energized_rp: z.boolean(),
  supercharged_rp: z.boolean(),
  traversal_rp: z.boolean(),
  rp_1: z.boolean(),
  rp_2: z.boolean(),
  rp_3: z.boolean(),
});

export const statboticsMatchPred2026Schema = z.looseObject({
  score: z.number(),
  win_prob: z.number(),
  energized_rp: z.number(),
  supercharged_rp: z.number(),
  traversal_rp: z.number(),
  rp_1: z.number(),
  rp_2: z.number(),
  rp_3: z.number(),
});

const unknownRecordSchema = z.record(z.string(), z.unknown());

const seasonSchemas = {
  2026: {
    epa: statboticsTeamMatchEpa2026Schema,
    result: statboticsMatchResult2026Schema,
    pred: statboticsMatchPred2026Schema,
  },
} as const;

type SeasonYear = keyof typeof seasonSchemas;
type SeasonSchemas<Year extends number> = Year extends SeasonYear
  ? (typeof seasonSchemas)[Year]
  : {
      epa: typeof unknownRecordSchema;
      result: typeof unknownRecordSchema;
      pred: typeof unknownRecordSchema;
    };

function getSeasonSchemas<Year extends number>(
  year: Year,
): SeasonSchemas<Year> {
  const schemas: Partial<
    Record<number, { epa: z.ZodType; result: z.ZodType; pred: z.ZodType }>
  > = seasonSchemas;
  return (schemas[year] ?? {
    epa: unknownRecordSchema,
    result: unknownRecordSchema,
    pred: unknownRecordSchema,
  }) as SeasonSchemas<Year>;
}

// ---------------------------------------------------------------------------
// API response

const statboticsMatchAllianceSchema = z.looseObject({
  team_keys: z.array(z.int()),
  surrogate_team_keys: z.array(z.int()),
  dq_team_keys: z.array(z.int()),
});

const statboticsMatchSchema = z.looseObject({
  key: z.string(),
  comp_level: compLevelSchema,
  set_number: z.int(),
  match_number: z.int(),
  status: z.string(),
  alliances: z.looseObject({
    red: statboticsMatchAllianceSchema,
    blue: statboticsMatchAllianceSchema,
  }),
  epas: z.record(z.string(), z.unknown()).nullable(),
  pre_epas: z.record(z.string(), z.unknown()).nullable(),
  pred: z.record(z.string(), z.unknown()).nullable(),
  result: z.record(z.string(), z.unknown()).nullable(),
});

// ---------------------------------------------------------------------------
// Rows

const rowFields = {
  team: z.int(),
  matchKey: z.string(),
  compLevel: compLevelSchema,
  setNumber: z.int(),
  matchNumber: z.int(),
  alliance: allianceColorSchema,
  /** The team's position in its alliance, 1 to 3. */
  robotIndex: z.int().min(1),
  outcome: z.enum(["win", "loss", "tie"]),
  isSurrogate: z.boolean(),
  isDisqualified: z.boolean(),
};

export function getStatboticsMatchRowSchema(year: number) {
  const schemas = getSeasonSchemas(year);
  return z.object({
    ...rowFields,
    /** The team's EPA after the match. */
    epa: schemas.epa.nullable(),
    /** The team's EPA before the match. */
    preEpa: schemas.epa.nullable(),
    result: schemas.result,
    opponentResult: schemas.result,
    pred: schemas.pred.nullable(),
  });
}

export type StatboticsMatchRow<Year extends number = number> = z.infer<
  z.ZodObject<typeof rowFields>
> & {
  epa: z.infer<SeasonSchemas<Year>["epa"]> | null;
  preEpa: z.infer<SeasonSchemas<Year>["epa"]> | null;
  result: z.infer<SeasonSchemas<Year>["result"]>;
  opponentResult: z.infer<SeasonSchemas<Year>["result"]>;
  pred: z.infer<SeasonSchemas<Year>["pred"]> | null;
};

// ---------------------------------------------------------------------------
// Adapter

/** Keeps `red_*` or `blue_*` keys for one alliance, without the prefix. */
function forAlliance(
  values: Record<string, unknown>,
  color: "red" | "blue",
): Record<string, unknown> {
  const prefix = `${color}_`;
  return Object.fromEntries(
    Object.entries(values)
      .filter(([key]) => key.startsWith(prefix))
      .map(([key, value]) => [key.slice(prefix.length), value]),
  );
}

function parse<Schema extends z.ZodType>(
  schema: Schema,
  data: unknown,
  label: string,
): z.infer<Schema> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(
      `Unexpected Statbotics ${label} data:\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}

/** One row for each team in each completed match. */
export function toStatboticsMatchRows<Year extends number>(
  response: unknown,
  year: Year,
): StatboticsMatchRow<Year>[] {
  const matches = parse(z.array(statboticsMatchSchema), response, "matches");
  const schemas: { epa: z.ZodType; result: z.ZodType; pred: z.ZodType } =
    getSeasonSchemas(year);
  const rows: StatboticsMatchRow<Year>[] = [];

  for (const match of matches) {
    if (match.status !== "Completed" || match.result === null) {
      continue;
    }
    const winner = match.result.winner;

    for (const color of allianceColorSchema.options) {
      const opponent = color === "red" ? "blue" : "red";
      const alliance = match.alliances[color];
      const label = `${match.key} ${color}`;
      const result = parse(
        schemas.result,
        forAlliance(match.result, color),
        `${label} result`,
      );
      const opponentResult = parse(
        schemas.result,
        forAlliance(match.result, opponent),
        `${label} opponent result`,
      );
      const pred =
        match.pred === null
          ? null
          : parse(
              schemas.pred,
              {
                ...forAlliance(match.pred, color),
                win_prob:
                  typeof match.pred.red_win_prob === "number"
                    ? color === "red"
                      ? match.pred.red_win_prob
                      : 1 - match.pred.red_win_prob
                    : undefined,
              },
              `${label} prediction`,
            );

      alliance.team_keys.forEach((team, index) => {
        const teamEpa = match.epas?.[String(team)];
        const teamPreEpa = match.pre_epas?.[String(team)];
        rows.push({
          team,
          matchKey: match.key,
          compLevel: match.comp_level,
          setNumber: match.set_number,
          matchNumber: match.match_number,
          alliance: color,
          robotIndex: index + 1,
          outcome:
            winner === color ? "win" : winner === opponent ? "loss" : "tie",
          isSurrogate: alliance.surrogate_team_keys.includes(team),
          isDisqualified: alliance.dq_team_keys.includes(team),
          epa:
            teamEpa === undefined
              ? null
              : parse(schemas.epa, teamEpa, `${label} ${team} EPA`),
          preEpa:
            teamPreEpa === undefined
              ? null
              : parse(
                  schemas.epa,
                  teamPreEpa,
                  `${label} ${team} pre-match EPA`,
                ),
          result,
          opponentResult,
          pred,
        } as StatboticsMatchRow<Year>);
      });
    }
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Fetch

export async function fetchStatboticsMatches(
  year: number,
  eventCode: string,
): Promise<unknown> {
  const params = new URLSearchParams({
    event: `${year}${eventCode.trim().toLowerCase()}`,
    limit: "1000",
  });
  const response = await fetch(
    `${getStatboticsBaseUrl()}/matches?${params.toString()}`,
  );
  if (!response.ok) {
    throw new Error(
      `Statbotics returned ${response.status} for matches. Statbotics may be down. Configs that only use TBA sources still work.`,
    );
  }
  return await response.json();
}
