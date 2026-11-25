import { gateway, generateText, isStepCount, Output } from "ai";

import type { WinnerConfig } from "../winner_config";
import { generationOutputSchema } from "./output";
import { getGenerationInstructions } from "./prompt";
import { checkConfigOutput, createGenerationTools } from "./tools";

/**
 * The AI Gateway model. Set SCORING_GENERATION_MODEL in Convex to use
 * another one, for example openai/gpt-5-mini on the Gateway free tier.
 */
const DEFAULT_MODEL = "anthropic/claude-sonnet-5.5";
const MAX_ATTEMPTS = 2;

export type GenerationResult =
  | { status: "ok"; config: WinnerConfig; notes: string[] }
  | { status: "unsupported"; reason: string; notes: string[] };

/**
 * Asks the model for a winner config. It can explore the typed sources and
 * event-scoped endpoints, and test configs on the example event. The result
 * is checked with the same schema as a save.
 */
export async function generateWinnerConfig({
  categoryText,
  description,
  year,
  gameName,
  eventCode,
}: {
  categoryText: string;
  description: string;
  year: number;
  gameName: string;
  eventCode: string;
}): Promise<GenerationResult> {
  const tools = createGenerationTools({ year, eventCode });
  let feedback = "";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const { output } = await generateText({
      model: gateway(process.env.SCORING_GENERATION_MODEL?.trim() || DEFAULT_MODEL),
      system: getGenerationInstructions({ year, gameName, eventCode }),
      prompt: `Category: ${categoryText}\nRule: ${description}${feedback}`,
      tools,
      output: Output.object({ schema: generationOutputSchema }),
      stopWhen: isStepCount(16),
    });

    if (!output) {
      throw new Error("The model did not return a config. Try again.");
    }
    if (output.status === "unsupported" || output.config === null) {
      return {
        status: "unsupported",
        reason: output.reason ?? "No data source can find these winners.",
        notes: output.notes,
      };
    }

    const checked = checkConfigOutput(output.config, year);
    if (checked.ok) {
      return { status: "ok", config: checked.config, notes: output.notes };
    }
    feedback = `\n\nYour last config had these problems. Fix them:\n- ${checked.issues.join("\n- ")}`;
  }

  throw new Error("The model could not write a valid config. Edit the rule or set up the config by hand.");
}
