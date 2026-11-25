import * as z from "zod";

/**
 * The contract between the app and a scoring script. A script is an ES
 * module with `export default async function score(ctx)`. It gets a read-only
 * `ctx` and returns winners, points or both. See "Scoring scripts" in
 * docs/scoring.md.
 */

/** What a script must return for a category. */
export type ScriptSets = { winners: boolean; points: boolean };

export const MAX_SCRIPT_LENGTH = 20_000;

/** The data a script gets, without the API helpers. Sent to the sandbox as JSON. */
export type ScriptContextData = {
  event: {
    /** TBA event key, for example 2026onosh. */
    key: string;
    year: number;
    /** FRC event code in lower case, for example onosh. */
    code: string;
    name: string;
  };
  /** The category this script scores. */
  category: { id: string; text: string; isGlobal: boolean };
  /** The teams at the event. */
  teams: { number: number; name: string }[];
  /** Every pick submission at the event. */
  submissions: {
    name: string;
    /** The teams the player picked. */
    teams: number[];
    /** The ids of the chosen (not global) categories the player picked. */
    categories: string[];
  }[];
  /** Every category at the event, with its picks and current winners. */
  categories: {
    id: string;
    text: string;
    isGlobal: boolean;
    /** Chosen categories only. Null for a global category. */
    picks: number | null;
    /** picks + 1. Null for a global category. */
    baseValue: number | null;
    /** The current winners. Null when there are none yet. Null for this script's own category. */
    winners: number[] | null;
  }[];
  /** Event values from the picks. */
  values: {
    /** The highest baseValue of the chosen categories. */
    maxCategoryValue: number;
    /** The lowest baseValue of the chosen categories. */
    minCategoryValue: number;
    /** The most picks of one team. */
    topTeamValue: number;
    submissions: number;
    /** baseValue of each chosen category, highest first. */
    categoryValues: number[];
    /** Each picked team with its number of picks, most picked first. */
    teamPicks: { team: number; picks: number }[];
  };
  /** The event's TBA awards from the last Calculate winners. Null before that. */
  awards: { team: number; awardType: number }[] | null;
};

/** The TypeScript shape of `ctx`, for the AI prompt. Keep in step with `ScriptContextData`. */
export const SCRIPT_CONTEXT_TYPE = `type Ctx = {
  event: { key: string /* TBA key, e.g. "2026onosh" */; year: number; code: string /* e.g. "onosh" */; name: string };
  category: { id: string; text: string; isGlobal: boolean }; // the category this script scores
  teams: { number: number; name: string }[]; // teams at the event
  submissions: { name: string; teams: number[]; categories: string[] /* chosen category ids */ }[];
  categories: {
    id: string; text: string; isGlobal: boolean;
    picks: number | null;     // chosen categories only
    baseValue: number | null; // picks + 1, chosen categories only
    winners: number[] | null; // current winners; null when none yet or for this category
  }[];
  values: {
    maxCategoryValue: number; minCategoryValue: number; // highest and lowest baseValue of chosen categories
    topTeamValue: number;      // most picks of one team
    submissions: number;
    categoryValues: number[];  // baseValue of each chosen category, highest first
    teamPicks: { team: number; picks: number }[]; // most picked first
  };
  awards: { team: number; awardType: number }[] | null; // TBA awards, null before Calculate winners
  api: {
    tba(path: string): Promise<any>;        // https://www.thebluealliance.com/api/v3 + path
    statbotics(path: string): Promise<any>; // https://api.statbotics.io/v3 + path
    frcEvents(path: string): Promise<any>;  // https://frc-api.firstinspires.org/v3.0 + path
  };
};

type Result = {
  winners?: number[];  // team numbers; [] when no team won
  points?: number | null; // points for each winning team; null when there are none at this event
  explanation: string; // 1 to 3 plain sentences for the admin: what the script found at this event
  teams?: { team: number; value?: number | null; note?: string }[]; // optional per-team detail, max 100
};`;

/** The result a script returns. Checked in Convex after each run. */
export const scriptOutputSchema = z.object({
  winners: z.array(z.number().int().positive()).max(100).optional(),
  points: z.number().finite().nullable().optional(),
  explanation: z.string().trim().min(1).max(1000),
  teams: z
    .array(
      z.object({
        team: z.number().int().positive(),
        value: z.number().finite().nullable().optional(),
        note: z.string().max(200).optional(),
      }),
    )
    .max(100)
    .optional(),
});

export type ScriptOutput = z.infer<typeof scriptOutputSchema>;

export type CheckedScriptOutput = {
  winners: number[] | null;
  points: number | null;
  explanation: string;
  teams: { team: number; value: number | null; note: string | null }[];
};

/** Checks a script's result against what the category needs and the event's teams. */
export function checkScriptOutput(
  raw: unknown,
  { sets, teamNumbers }: { sets: ScriptSets; teamNumbers: ReadonlySet<number> },
): { ok: true; output: CheckedScriptOutput } | { ok: false; issues: string[] } {
  const parsed = scriptOutputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((issue) =>
        issue.path.length > 0 ? `${issue.path.join(".")}: ${issue.message}` : issue.message,
      ),
    };
  }

  const output = parsed.data;
  const issues: string[] = [];
  if (sets.winners && output.winners === undefined) {
    issues.push("Return winners: this category takes its winners from the script.");
  }
  if (sets.points && output.points === undefined) {
    issues.push("Return points: this category takes its points from the script.");
  }
  const unknownTeams = [...(output.winners ?? []), ...(output.teams ?? []).map((row) => row.team)].filter(
    (team) => !teamNumbers.has(team),
  );
  if (teamNumbers.size > 0 && unknownTeams.length > 0) {
    issues.push(`These teams are not at the event: ${[...new Set(unknownTeams)].join(", ")}.`);
  }
  if (issues.length > 0) return { ok: false, issues };

  return {
    ok: true,
    output: {
      winners: output.winners === undefined ? null : [...new Set(output.winners)].toSorted((a, b) => a - b),
      points: output.points ?? null,
      explanation: output.explanation,
      teams: (output.teams ?? []).map((row) => ({
        team: row.team,
        value: row.value ?? null,
        note: row.note ?? null,
      })),
    },
  };
}

/** What a category needs from its script. Null when nothing comes from a script. */
export function getScriptSets(category: {
  isGlobal: boolean;
  winnerSource?: { type: string };
  pointsSource?: "formula" | "script" | "manual";
}): ScriptSets | null {
  const sets = {
    winners: category.winnerSource?.type === "script",
    points: category.isGlobal && category.pointsSource === "script",
  };
  return sets.winners || sets.points ? sets : null;
}

/** A quick check of a script's text before it is saved. It is not run here. */
export function checkScriptCode(code: string): string | null {
  if (code.trim() === "") return "The script is empty.";
  if (code.length > MAX_SCRIPT_LENGTH) {
    return `The script must be ${MAX_SCRIPT_LENGTH} characters or fewer.`;
  }
  if (!/export\s+default\s+(async\s+)?function/.test(code)) {
    return "The script must have export default async function score(ctx).";
  }
  return null;
}
