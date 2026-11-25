import { gateway, generateText, isStepCount, Output, tool } from "ai";
import * as z from "zod";

import { API_SERVICES, fetchApi, summarizeResponse } from "../sources/api_source";
import { checkScriptCode, SCRIPT_CONTEXT_TYPE, type ScriptContextData, type ScriptSets } from "./contract";
import { describeScriptPreview, type ScriptPreview } from "./preview";

/** The AI Gateway model. Uses the same env var as the config builder. */
const DEFAULT_MODEL = "anthropic/claude-sonnet-5.5";
const MAX_ATTEMPTS = 2;

export type ScriptGenerationResult =
  | { status: "ok"; code: string; notes: string[]; preview: ScriptPreview }
  | { status: "unsupported"; reason: string; notes: string[] };

const outputSchema = z.object({
  status: z.enum(["ok", "unsupported"]),
  code: z.string().nullable().describe("The full script when status is ok. Null otherwise."),
  notes: z
    .array(z.string())
    .describe("1 to 4 short, plain sentences for the admin: the data the script reads and each decision. No jargon."),
  reason: z.string().nullable().describe("When unsupported: why no data can score this rule."),
});

/**
 * Asks the model to write a scoring script from a plain-language rule. The
 * model can read API endpoints and run its script on the example event in
 * the sandbox. The final script is run one more time to check it.
 */
export async function generateScoringScript({
  categoryText,
  description,
  sets,
  gameName,
  context,
  runScript,
  currentCode,
}: {
  categoryText: string;
  description: string;
  sets: ScriptSets;
  gameName: string;
  context: ScriptContextData;
  /** Runs a script on the example event and checks its result. */
  runScript: (code: string) => Promise<ScriptPreview>;
  /** The current script, when the admin is changing one. */
  currentCode: string | null;
}): Promise<ScriptGenerationResult> {
  const tools = {
    fetchEndpoint: tool({
      description:
        "Get an endpoint for the example event and see its shape and a sample. Use placeholders {eventKey}, {eventCode} and {year} in the path. Only event-scoped paths work here; in the script, ctx.api can read any path.",
      inputSchema: z.object({
        service: z.enum(API_SERVICES),
        path: z.string().describe("For example /event/{eventKey}/matches"),
      }),
      execute: async ({ service, path }) => {
        try {
          return summarizeResponse(
            await fetchApi(service, path, { year: context.event.year, eventCode: context.event.code }),
          );
        } catch (error) {
          return `Error: ${error instanceof Error ? error.message : "the request failed."}`;
        }
      },
    }),
    runScript: tool({
      description:
        "Run a full script on the example event in the sandbox, with the real ctx. Returns the result and its problems, or the error, with the API calls and console.log output.",
      inputSchema: z.object({ code: z.string() }),
      execute: async ({ code }) => {
        const issue = checkScriptCode(code);
        if (issue) return `Problems:\n- ${issue}`;
        try {
          return describeScriptPreview(await runScript(code));
        } catch (error) {
          return `Error: ${error instanceof Error ? error.message : "the run failed."}`;
        }
      },
    }),
  };

  let feedback = "";
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const { output } = await generateText({
      model: gateway(process.env.SCORING_GENERATION_MODEL?.trim() || DEFAULT_MODEL),
      system: getScriptInstructions({ sets, gameName, context }),
      prompt: [
        `Category: ${categoryText}`,
        `Rule: ${description}`,
        currentCode ? `Current script (change it to fit the rule):\n${currentCode}` : "",
        feedback,
      ]
        .filter(Boolean)
        .join("\n\n"),
      tools,
      output: Output.object({ schema: outputSchema }),
      stopWhen: isStepCount(20),
    });

    if (!output) throw new Error("The model did not return a script. Try again.");
    if (output.status === "unsupported" || output.code === null) {
      return {
        status: "unsupported",
        reason: output.reason ?? "No data can score this rule.",
        notes: output.notes,
      };
    }

    const issue = checkScriptCode(output.code);
    const preview = issue === null ? await runScript(output.code) : null;
    if (preview?.ok) {
      return { status: "ok", code: output.code, notes: output.notes, preview };
    }
    feedback = `Your last script failed on the example event. Fix it:\n${
      issue ?? (preview ? describeScriptPreview(preview) : "")
    }\n\nLast script:\n${output.code}`;
  }

  throw new Error("The model could not write a script that runs. Change the rule and try again.");
}

function getScriptInstructions({
  sets,
  gameName,
  context,
}: {
  sets: ScriptSets;
  gameName: string;
  context: ScriptContextData;
}) {
  const needs = [
    sets.winners ? "winners (the teams that won this category)" : "",
    sets.points ? "points (the points each winning team gives at this event)" : "",
  ].filter(Boolean);

  return `You write scoring scripts for Samosa Stats, an FRC prediction game. Before an event, each player picks categories and teams. After the event, each category finds the teams that won it, and each winning team a player picked gives that category's points. A global category applies to every player.

You turn a category's plain-language rule into a JavaScript script. It runs at each event in a sandbox, with no network access except ctx.api.

Season: ${context.event.year} (${gameName}). Example event: ${context.event.name} (TBA key ${context.event.key}), with ${context.submissions.length} submissions and ${context.teams.length} teams.

This script must return: ${needs.join(" and ")}.${sets.winners ? "" : " Do not return winners; another source sets them."}${sets.points ? "" : " Do not return points."}

# Script format
An ES module (plain JavaScript, Node 24) with one default export:

export default async function score(ctx) {
  // ...
  return { ${[sets.winners ? "winners: [254, 1114]" : "", sets.points ? "points: 4" : "", 'explanation: "..."'].filter(Boolean).join(", ")} };
}

${SCRIPT_CONTEXT_TYPE}

# Rules
- Never hard-code the event. Read ctx.event.key, ctx.event.code and ctx.event.year, so the script works at every event of the season.
- ctx.api.tba, ctx.api.statbotics and ctx.api.frcEvents return parsed JSON and throw on an error status. The keys are added for you. Repeated paths are cached. Use only these for data; fetch to any other host fails.
- The same input must give the same result. Math.random is not allowed. Break ties with a clear rule and say it in the explanation.
- Use only team numbers of teams at the event (ctx.teams). TBA team keys look like "frc254"; turn them into numbers.
- winners can be [] when no team won at this event. points can be null when the rule gives no points at this event.
- explanation: 1 to 3 plain sentences that say what the script found at this event, with the key numbers.
- teams: optional per-team detail that shows how the winners were found (for example each team's measured value). Max 100.
- No imports other than node built-ins. No file or process access. Keep the script short and readable, with a few comments.

# Data notes
- TBA: /event/{key}/matches (score_breakdown, alliances.red.team_keys, actual_time, predicted_time, comp_level qm/sf/f), /event/{key}/rankings, /event/{key}/alliances, /event/{key}/awards, /event/{key}/oprs, /event/{key}/teams/statuses.
- Statbotics: /team_events?event={key}, /matches?event={key}, /team_matches?event={key}.
- FRC Events: /{year}/schedule/{CODE}?tournamentLevel=Qualification, /{year}/matches/{CODE}?tournamentLevel=Qualification, /{year}/scores/{CODE}/Qualification, /{year}/alliances/{CODE}, /{year}/rankings/{CODE}. The event code is case insensitive.
- Picks data (ctx.submissions, ctx.categories, ctx.values) is in ctx. Use it for rules about the players' picks.

# Process
1. Read the data you need with fetchEndpoint.
2. Write the script and call runScript. Fix errors and problems and run it again. Check that the result makes sense for the example event, not only that it runs.
3. Return status ok with the full script and 1 to 4 short notes for the admin.
If no data can score the rule (for example it needs human judgement), return status unsupported with the reason. Do not return a script that scores something else.`;
}
