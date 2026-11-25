import * as z from "zod";

import { getReferencedMeasures, type ValueExpression } from "./formula";

import {
  apiSourceSpecSchema,
  getApiSourceKey,
  type ApiSourceSpec,
} from "./sources/api_source";

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

const measureOpSchema = z
  .enum(["value", "sum", "avg", "max", "min", "count"])
  .default("value");

const typedMeasureSchema = z
  .object({
    source: z.enum(SCORING_SOURCES),
    /** Only rows that match every filter are measured. */
    where: z.array(rowFilterSchema).default([]),
    /** Not used by `count`. */
    field: z.string().trim().min(1).optional(),
    op: measureOpSchema,
  })
  .refine((measure) => measure.op === "count" || measure.field !== undefined, {
    message: "Enter a field for this operation.",
    path: ["field"],
  });

/** A measure that reads a custom endpoint. See `sources/api_source.ts`. */
const apiMeasureSchema = z
  .object({
    source: z.literal("api"),
    api: apiSourceSpecSchema,
    /** Filters read the same rows. Other sources can't be named. */
    where: z.array(rowFilterSchema).default([]),
    field: z.string().trim().min(1).optional(),
    op: measureOpSchema,
  })
  .refine((measure) => measure.op === "count" || measure.field !== undefined, {
    message: "Enter a field for this operation.",
    path: ["field"],
  })
  .refine((measure) => measure.where.every((filter) => filter.source === undefined), {
    message: "Filters on a custom source can only read its own rows.",
    path: ["where"],
  });

const measureSchema = z.union([typedMeasureSchema, apiMeasureSchema]);

/**
 * One operation in a formula. Each side is a measure name, a number or
 * another operation, so a formula can have many parts. See `formula.ts`.
 */
const calculationSchema = z.object({
  op: z.enum(["add", "subtract", "multiply", "divide"]),
  get left(): z.ZodType<ValueExpression> {
    return expressionSchema;
  },
  get right(): z.ZodType<ValueExpression> {
    return expressionSchema;
  },
});

const expressionSchema: z.ZodType<ValueExpression> = z.union([
  z.string().trim().min(1, { message: "Choose a measure for each part of the formula." }),
  z.number(),
  calculationSchema,
]);

/** One measure name, or a formula of measures and numbers. */
const valueSchema = z.union([
  z.string().trim().min(1, { message: "Choose the measure to compare teams by." }),
  calculationSchema,
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

    // Each missing name once, even when the formula uses it more than once.
    for (const reference of new Set(getReferencedMeasures(config.value))) {
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
export type TypedMeasure = z.infer<typeof typedMeasureSchema>;
export type ApiMeasure = z.infer<typeof apiMeasureSchema>;
export type MeasureSource = Measure["source"];
export type Select = z.infer<typeof selectSchema>;

/** The sources a config reads, including alliances for team scopes. */
export function getRequiredSources(config: WinnerConfig): ScoringSource[] {
  const sources = new Set<ScoringSource>(
    Object.values(config.measures).flatMap((measure) => [
      ...(measure.source === "api" ? [] : [measure.source]),
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

/** The custom sources a config reads, each one once. */
export function getApiSources(config: WinnerConfig): ApiSourceSpec[] {
  const specs = new Map<string, ApiSourceSpec>();
  for (const measure of Object.values(config.measures)) {
    if (measure.source === "api") {
      specs.set(getApiSourceKey(measure.api), measure.api);
    }
  }
  return [...specs.values()];
}
