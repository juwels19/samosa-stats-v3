"use node";

import { v } from "convex/values";

import { internal } from "./_generated/api";
import { action, internalAction } from "./_generated/server";
import { withScriptSandbox } from "./lib/sandbox/script_runner";
import { checkScriptCode, checkScriptOutput, type ScriptContextData } from "./lib/scoring/script/contract";
import { generateScoringScript, type ScriptGenerationResult } from "./lib/scoring/script/generate";
import { scriptPreviewValidator, toScriptPreview, type ScriptPreview } from "./lib/scoring/script/preview";

/**
 * Scoring scripts: AI writes a script from a rule, and the script runs in a
 * Vercel Sandbox at each event. See "Scoring scripts" in docs/scoring.md.
 */

const setsValidator = v.object({ winners: v.boolean(), points: v.boolean() });

function checkSets(sets: { winners: boolean; points: boolean }, isGlobal: boolean) {
  if (!sets.winners && !sets.points) {
    throw new Error("Choose what the script sets: winners, points or both.");
  }
  if (sets.points && !isGlobal) {
    throw new Error("Only global categories can take their points from a script.");
  }
}

function previewEvent(context: ScriptContextData) {
  return {
    key: context.event.key,
    submissions: context.submissions.length,
    teams: context.teams.length,
  };
}

/** Runs a script on an example event. Saves nothing. */
export const previewScript = action({
  args: {
    categoryId: v.id("categories"),
    eventCode: v.string(),
    code: v.string(),
    sets: setsValidator,
  },
  returns: scriptPreviewValidator,
  handler: async (ctx, args): Promise<ScriptPreview> => {
    const input = await ctx.runQuery(internal.scoringScriptData.getExampleInput, {
      categoryId: args.categoryId,
      eventCode: args.eventCode,
    });
    if (!input.isAdmin) throw new Error("Only admins can run scoring scripts.");
    checkSets(args.sets, input.isGlobal);
    const issue = checkScriptCode(args.code);
    if (issue) throw new Error(issue);

    const context: ScriptContextData = input.context;
    const teamNumbers = new Set(input.teamNumbers);
    return await withScriptSandbox(
      async (sandbox) =>
        toScriptPreview(await sandbox.run(args.code, context), {
          sets: args.sets,
          teamNumbers,
          event: previewEvent(context),
        }),
      { timeoutMs: 3 * 60_000 },
    );
  },
});

/**
 * Asks an LLM to write a script from a plain-language rule. It reads the
 * APIs and runs its script on the example event until it works. Saves
 * nothing.
 */
export const generateScript = action({
  args: {
    categoryId: v.id("categories"),
    description: v.string(),
    eventCode: v.string(),
    sets: setsValidator,
    currentCode: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      status: v.literal("ok"),
      code: v.string(),
      notes: v.array(v.string()),
      preview: scriptPreviewValidator,
    }),
    v.object({
      status: v.literal("unsupported"),
      reason: v.string(),
      notes: v.array(v.string()),
    }),
  ),
  handler: async (ctx, args): Promise<ScriptGenerationResult> => {
    const input = await ctx.runQuery(internal.scoringScriptData.getExampleInput, {
      categoryId: args.categoryId,
      eventCode: args.eventCode,
    });
    if (!input.isAdmin) throw new Error("Only admins can generate scoring scripts.");
    checkSets(args.sets, input.isGlobal);
    const description = args.description.trim();
    if (description.length === 0 || description.length > 1000) {
      throw new Error("Describe the rule in 1 to 1000 characters.");
    }

    const context: ScriptContextData = input.context;
    const teamNumbers = new Set(input.teamNumbers);
    const currentCode = args.currentCode?.trim() || null;

    return await withScriptSandbox(async (sandbox) =>
      generateScoringScript({
        categoryText: input.categoryText,
        description,
        sets: args.sets,
        gameName: input.gameName,
        context,
        currentCode,
        runScript: async (code) =>
          toScriptPreview(await sandbox.run(code, context), {
            sets: args.sets,
            teamNumbers,
            event: previewEvent(context),
          }),
      }),
    );
  },
});

/**
 * Runs the script of each category at the event whose winners or points come
 * from a script, and saves the results. Calculate winners calls this after
 * the configs, so scripts see the new winners and awards.
 */
export const runEventScripts = internalAction({
  args: { eventId: v.id("events") },
  returns: v.object({ calculated: v.number(), errors: v.number() }),
  handler: async (ctx, args): Promise<{ calculated: number; errors: number }> => {
    const input = await ctx.runQuery(internal.scoringScriptData.getEventScriptInputs, {
      eventId: args.eventId,
    });
    if (input.isFinal || input.scripts.length === 0) return { calculated: 0, errors: 0 };

    const teamNumbers = new Set(input.teamNumbers);
    const outcomes = await withScriptSandbox(async (sandbox) =>
      Promise.all(
        input.scripts.map(async (script) => {
          const context: ScriptContextData = script.context;
          try {
            const run = await sandbox.run(script.code, context);
            if (!run.ok) {
              return { categoryId: script.categoryId, type: "error" as const, message: `The script failed: ${run.error}` };
            }
            const checked = checkScriptOutput(run.result, { sets: script.sets, teamNumbers });
            if (!checked.ok) {
              return {
                categoryId: script.categoryId,
                type: "error" as const,
                message: `The script's result is not valid: ${checked.issues.join(" ")}`,
              };
            }
            return {
              categoryId: script.categoryId,
              type: "ok" as const,
              ...checked.output,
              apiCalls: run.calls,
            };
          } catch (error) {
            return {
              categoryId: script.categoryId,
              type: "error" as const,
              message: error instanceof Error ? error.message : "The script could not run.",
            };
          }
        }),
      ),
    );

    await ctx.runMutation(internal.scoringScriptData.saveScriptResults, {
      eventId: args.eventId,
      calculatedAt: Date.now(),
      outcomes,
    });
    const errors = outcomes.filter((outcome) => outcome.type === "error").length;
    return { calculated: outcomes.length - errors, errors };
  },
});
