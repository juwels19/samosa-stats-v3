import * as z from "zod";

/**
 * Data sources a measure can read. Each source is a list of rows, and each
 * row belongs to one team. The row schemas are in `sources/`.
 */
export const SCORING_SOURCES = [
  "tba.matches",
  "tba.rankings",
  "tba.alliances",
  "tba.awards",
  "statbotics.teamEvents",
  "statbotics.matches",
] as const;

/** Sources with one row for each team in each match. */
export const MATCH_SOURCES: readonly ScoringSource[] = [
  "tba.matches",
  "statbotics.matches",
];

export const TEAM_SCOPES = [
  "all",
  "inEliminations",
  "notInEliminations",
  "captains",
] as const;

/** The matches that match sources read. Practice never counts. */
export const MATCH_SCOPES = ["qualification", "playoffs", "all"] as const;

const scalarSchema = z.union([z.string(), z.number(), z.boolean()]);

const rowFilterSchema = z.object({
  /**
   * Another source to check. The row counts only if its team has at least
   * one row in that source that matches. Not set means the measure's source.
   */
  source: z.enum(SCORING_SOURCES).optional(),
  field: z.string().trim().min(1),
  op: z.enum(["eq", "neq", "in", "notIn", "gt", "gte", "lt", "lte"]),
  value: z.union([scalarSchema, z.array(scalarSchema)]),
});

const measureSchema = z
  .object({
    source: z.enum(SCORING_SOURCES),
    /** Only rows that match every filter are measured. */
    where: z.array(rowFilterSchema).default([]),
    /** Not used by `count`. */
    field: z.string().trim().min(1).optional(),
    op: z.enum(["value", "sum", "avg", "max", "min", "count"]).default("value"),
  })
  .refine((measure) => measure.op === "count" || measure.field !== undefined, {
    message: "Enter a field for this operation.",
    path: ["field"],
  });

const operandSchema = z.union([z.string().trim().min(1), z.number()]);

const valueSchema = z.union([
  z.string().trim().min(1),
  z.object({
    op: z.enum(["add", "subtract", "multiply", "divide"]),
    left: operandSchema,
    right: operandSchema,
  }),
]);

const orderSchema = z.enum(["desc", "asc"]);

const selectSchema = z.discriminatedUnion("type", [
  /** The nth distinct value. All teams with that value win. */
  z.object({
    type: z.literal("nth"),
    n: z.int().min(1),
    order: orderSchema,
  }),
  /** The first n teams in order. Teams tied at the cutoff also win. */
  z.object({
    type: z.literal("top"),
    n: z.int().min(1),
    order: orderSchema,
  }),
  z.object({
    type: z.literal("threshold"),
    op: z.enum(["gt", "gte", "lt", "lte"]),
    value: z.number(),
  }),
  z.object({
    type: z.literal("equals"),
    value: z.number(),
  }),
]);

export const winnerConfigSchema = z
  .object({
    teams: z.enum(TEAM_SCOPES).default("all"),
    matches: z.enum(MATCH_SCOPES).default("qualification"),
    measures: z.record(
      z
        .string()
        .trim()
        .regex(/^[A-Za-z][A-Za-z0-9_]*$/, {
          message:
            "Measure names start with a letter and use letters, numbers and underscores only.",
        }),
      measureSchema,
    ),
    value: valueSchema,
    select: selectSchema,
  })
  .superRefine((config, ctx) => {
    const names = Object.keys(config.measures);
    if (names.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Add at least one measure.",
        path: ["measures"],
      });
    }

    const references =
      typeof config.value === "string"
        ? [config.value]
        : [config.value.left, config.value.right].filter(
            (operand): operand is string => typeof operand === "string",
          );

    for (const reference of references) {
      if (!names.includes(reference)) {
        ctx.addIssue({
          code: "custom",
          message: `No measure is named "${reference}".`,
          path: ["value"],
        });
      }
    }
  });

export type WinnerConfig = z.infer<typeof winnerConfigSchema>;
export type WinnerConfigInput = z.input<typeof winnerConfigSchema>;
export type ScoringSource = (typeof SCORING_SOURCES)[number];
export type TeamScope = (typeof TEAM_SCOPES)[number];
export type MatchScope = (typeof MATCH_SCOPES)[number];
export type RowFilter = z.infer<typeof rowFilterSchema>;
export type Measure = z.infer<typeof measureSchema>;
export type Select = z.infer<typeof selectSchema>;

/** The sources a config reads, including alliances for team scopes. */
export function getRequiredSources(config: WinnerConfig): ScoringSource[] {
  const sources = new Set<ScoringSource>(
    Object.values(config.measures).flatMap((measure) => [
      measure.source,
      ...measure.where.flatMap((filter) =>
        filter.source ? [filter.source] : [],
      ),
    ]),
  );
  if (config.teams !== "all") {
    sources.add("tba.alliances");
  }
  return SCORING_SOURCES.filter((source) => sources.has(source));
}
