import * as z from "zod";

/**
 * Statbotics API v3. Its OpenAPI spec has no response schemas, so these
 * schemas come from real responses. Objects are loose: fields not in a schema
 * are kept, so a new field does not break parsing.
 */

const DEFAULT_STATBOTICS_BASE_URL = "https://api.statbotics.io";

/**
 * Set `STATBOTICS_BASE_URL` in Convex to use a mirror while Statbotics is
 * down, for example https://api-statbotics.iterativerefinement.com.
 */
export function getStatboticsBaseUrl() {
  const baseUrl =
    process.env.STATBOTICS_BASE_URL?.trim() || DEFAULT_STATBOTICS_BASE_URL;
  return `${baseUrl.replace(/\/+$/, "")}/v3`;
}

// ---------------------------------------------------------------------------
// Season EPA breakdowns. Add a schema here for each new game.

/** 2025 REEFSCAPE. From real 2025 responses. */
export const statboticsBreakdown2025Schema = z.looseObject({
  total_points: z.number(),
  auto_points: z.number(),
  teleop_points: z.number(),
  endgame_points: z.number(),
  auto_rp: z.number(),
  coral_rp: z.number(),
  barge_rp: z.number(),
  tiebreaker_points: z.number(),
  auto_coral_points: z.number(),
  teleop_coral_points: z.number(),
  coral_l1: z.number(),
  coral_l2: z.number(),
  coral_l3: z.number(),
  coral_l4: z.number(),
  processor_algae: z.number(),
  processor_algae_points: z.number(),
  net_algae_points: z.number(),
  barge_points: z.number(),
  rp_1: z.number(),
  rp_2: z.number(),
  rp_3: z.number(),
  total_coral_points: z.number(),
  total_algae_points: z.number(),
});

/** 2026 REBUILT. */
export const statboticsBreakdown2026Schema = z.looseObject({
  total_points: z.number(),
  auto_points: z.number(),
  teleop_points: z.number(),
  endgame_points: z.number(),
  energized_rp: z.number(),
  supercharged_rp: z.number(),
  traversal_rp: z.number(),
  tiebreaker_points: z.number(),
  auto_fuel: z.number(),
  auto_tower: z.number(),
  transition_fuel: z.number(),
  first_shift_fuel: z.number(),
  second_shift_fuel: z.number(),
  teleop_fuel: z.number(),
  endgame_fuel: z.number(),
  endgame_tower: z.number(),
  total_fuel: z.number(),
  total_tower: z.number(),
  rp_1: z.number(),
  rp_2: z.number(),
  rp_3: z.number(),
});

export const unknownStatboticsBreakdownSchema = z.record(
  z.string(),
  z.unknown(),
);

export const statboticsBreakdownSchemas = {
  2025: statboticsBreakdown2025Schema,
  2026: statboticsBreakdown2026Schema,
} as const;

export type StatboticsBreakdownYear = keyof typeof statboticsBreakdownSchemas;

export type StatboticsBreakdownSchema<Year extends number> =
  Year extends StatboticsBreakdownYear
    ? (typeof statboticsBreakdownSchemas)[Year]
    : typeof unknownStatboticsBreakdownSchema;

export function getStatboticsBreakdownSchema<Year extends number>(
  year: Year,
): StatboticsBreakdownSchema<Year> {
  const schemas: Partial<Record<number, z.ZodType>> =
    statboticsBreakdownSchemas;
  return (schemas[year] ??
    unknownStatboticsBreakdownSchema) as StatboticsBreakdownSchema<Year>;
}

// ---------------------------------------------------------------------------
// Rows. Statbotics team-event objects already have one team each, so a row
// is the object with its breakdown typed for the season.

const recordFields = {
  wins: z.int(),
  losses: z.int(),
  ties: z.int(),
  count: z.int(),
  winrate: z.number(),
};

const epaFields = {
  total_points: z.number(),
  unitless: z.number().nullable(),
  norm: z.number().nullable(),
  stats: z
    .looseObject({
      start: z.number().nullable(),
      pre_elim: z.number().nullable(),
      mean: z.number().nullable(),
      max: z.number().nullable(),
    })
    .nullable(),
};

const teamEventFields = {
  team: z.int(),
  year: z.int(),
  event: z.string(),
  record: z.looseObject({
    qual: z.looseObject({
      ...recordFields,
      rps: z.number(),
      rps_per_match: z.number(),
      rank: z.int().nullable(),
      num_teams: z.int().nullable(),
    }),
    elim: z.looseObject({
      ...recordFields,
      alliance: z.string().nullable(),
      is_captain: z.boolean().nullable(),
    }),
    total: z.looseObject(recordFields),
  }),
};

export function getStatboticsTeamEventRowSchema(year: number) {
  return z.looseObject({
    ...teamEventFields,
    epa: z.looseObject({
      ...epaFields,
      breakdown: getStatboticsBreakdownSchema(year),
    }),
  });
}

export type StatboticsTeamEventRow<Year extends number = number> = z.infer<
  z.ZodObject<typeof teamEventFields>
> & {
  epa: z.infer<z.ZodObject<typeof epaFields>> & {
    breakdown: z.infer<StatboticsBreakdownSchema<Year>>;
  };
};

// ---------------------------------------------------------------------------
// Adapters

export function toStatboticsTeamEventRows<Year extends number>(
  response: unknown,
  year: Year,
): StatboticsTeamEventRow<Year>[] {
  const schema: z.ZodType = z.array(getStatboticsTeamEventRowSchema(year));
  const result = schema.safeParse(response);
  if (!result.success) {
    throw new Error(
      `Unexpected Statbotics team event data:\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data as StatboticsTeamEventRow<Year>[];
}

// ---------------------------------------------------------------------------
// Fetch

export async function fetchStatboticsTeamEvents(
  year: number,
  eventCode: string,
): Promise<unknown> {
  const params = new URLSearchParams({
    event: `${year}${eventCode.trim().toLowerCase()}`,
    limit: "1000",
  });
  const response = await fetch(
    `${getStatboticsBaseUrl()}/team_events?${params.toString()}`,
  );
  if (!response.ok) {
    throw new Error(
      `Statbotics returned ${response.status} for team events. Statbotics may be down. Configs that only use TBA sources still work.`,
    );
  }
  return await response.json();
}
