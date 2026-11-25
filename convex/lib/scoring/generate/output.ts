import * as z from "zod";

import { API_SERVICES } from "../sources/api_source";
import {
  MATCH_SCOPES,
  SCORING_SOURCES,
  TEAM_SCOPES,
  type WinnerConfigInput,
} from "../winner_config";

/**
 * The config shape the model writes. It is flatter than `winnerConfigSchema`
 * (arrays not records, nulls not unions), which models fill in more
 * reliably. `toConfigInput` turns it into a config, and the result is then
 * checked with `winnerConfigSchema`.
 */
const scalar = z.union([z.string(), z.number(), z.boolean()]);

const measureOutputSchema = z.object({
  name: z
    .string()
    .describe("Starts with a letter. Letters, numbers and underscores only, for example auto_points."),
  source: z.enum([...SCORING_SOURCES, "api"]),
  api: z
    .object({
      service: z.enum(API_SERVICES),
      path: z.string().describe("For example /event/{eventKey}/matches"),
      rows: z.string().describe("Dot path to the list in the response. Empty when the response is the list."),
      team: z.string().describe('Dot path to the team in each row. Use * for each item, for example alliances.*.team_keys.*. Use "$key" when rows is an object keyed by team.'),
    })
    .nullable()
    .describe("Only when source is api. Null otherwise."),
  op: z.enum(["value", "sum", "avg", "max", "min", "count"]),
  field: z.string().nullable().describe("Field path in each row. Null for count."),
  where: z.array(
    z.object({
      source: z.enum(SCORING_SOURCES).nullable().describe("Another typed source to check, or null for this measure's rows."),
      field: z.string(),
      op: z.enum(["eq", "neq", "in", "notIn", "gt", "gte", "lt", "lte"]),
      value: z.union([scalar, z.array(scalar)]),
    }),
  ),
});

export const configOutputSchema = z.object({
  teams: z.enum(TEAM_SCOPES),
  matches: z.enum(MATCH_SCOPES),
  measures: z.array(measureOutputSchema).min(1),
  value: z.object({
    measure: z.string().nullable().describe("One measure name, or null for a calculation."),
    op: z.enum(["add", "subtract", "multiply", "divide"]).nullable(),
    left: z.union([z.string(), z.number()]).nullable(),
    right: z.union([z.string(), z.number()]).nullable(),
  }),
  select: z.object({
    type: z.enum(["nth", "top", "threshold", "equals"]),
    n: z.number().int().nullable().describe("For nth and top."),
    order: z.enum(["desc", "asc"]).nullable().describe("For nth and top. desc means highest first."),
    op: z.enum(["gt", "gte", "lt", "lte"]).nullable().describe("For threshold."),
    value: z.number().nullable().describe("For threshold and equals."),
  }),
});

export type ConfigOutput = z.infer<typeof configOutputSchema>;

export const generationOutputSchema = z.object({
  status: z.enum(["ok", "unsupported"]),
  notes: z
    .array(z.string())
    .describe("1 to 4 short, plain sentences for the admin, one for each decision. No jargon."),
  reason: z.string().nullable().describe("When unsupported: why no data source can find these winners."),
  config: configOutputSchema.nullable().describe("The config when status is ok. Null otherwise."),
});

export type GenerationOutput = z.infer<typeof generationOutputSchema>;

export function toConfigInput(output: ConfigOutput): WinnerConfigInput {
  const { select, value } = output;
  return {
    teams: output.teams,
    matches: output.matches,
    measures: Object.fromEntries(
      output.measures.map((measure) => {
        const shared = {
          op: measure.op,
          ...(measure.op === "count" || measure.field === null ? {} : { field: measure.field }),
          where: measure.where.map((filter) => ({
            ...(filter.source === null ? {} : { source: filter.source }),
            field: filter.field,
            op: filter.op,
            value: filter.value,
          })),
        };
        return [
          measure.name,
          measure.source === "api"
            ? {
                source: "api" as const,
                api: measure.api ?? { service: "tba" as const, path: "", rows: "", team: "" },
                ...shared,
              }
            : { source: measure.source, ...shared },
        ];
      }),
    ),
    value:
      value.measure !== null
        ? value.measure
        : {
            op: value.op ?? "divide",
            left: value.left ?? "",
            right: value.right ?? "",
          },
    select:
      select.type === "nth" || select.type === "top"
        ? { type: select.type, n: select.n ?? 1, order: select.order ?? "desc" }
        : select.type === "threshold"
          ? { type: "threshold", op: select.op ?? "gte", value: select.value ?? 0 }
          : { type: "equals", value: select.value ?? 0 },
  };
}
