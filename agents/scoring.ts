import { gpt4_1Nano } from "@/agents/models/openai";
import { getPicksForEventTool } from "@/agents/tools/database";
import { frcEventsAllianceSelectionTool } from "@/agents/tools/frc-events";
import { statboticsEventResultsTool, statboticsMatchResultsTool } from "@/agents/tools/statbotics";
import { Output, stepCountIs, ToolLoopAgent } from "ai";
import z from "zod";

const scoringOutputSchema = z.object({
  team: z.number().describe("The FRC team number being analyzed"),
  count: z
    .number()
    .describe("How many times that team was selected in user picks"),
});

const scoringAgent = new ToolLoopAgent({
  model: gpt4_1Nano,
  instructions: `You score user pick submissions against various sources of data. For the event you are scoring, assume the event is completed and all data is final.

Use tools to gather data before assessing the user picks:
1. Use getPicksForEventTool to get user pick submissions for an event.
2. Use frcEventsAllianceSelectionTool to get alliance selection results for an event.
3. Use statboticsMatchResultsTool to get predicted and actual results of all matches in an event.
4. Use statboticsEventResultsTool to get Statbotics EPA metrics for all teams across the duration of an event.

After you have the data you need, proceed to score the picks. Each pick is comprised of teams and categories.`,
  tools: {
    frcEventsAllianceSelectionTool,
    getPicksForEventTool,
    statboticsMatchResultsTool,
    statboticsEventResultsTool,
  },
  output: Output.object({
    name: "ScoringResult",
    description:
      "The team analyzed and how many times it was selected in user picks.",
    schema: scoringOutputSchema,
  }),
  // Structured output generation counts as its own step after tool calls.
  stopWhen: stepCountIs(10),
  prepareStep: async ({ steps }) => {
    const calledTools = new Set(
      steps.flatMap((step) =>
        step.toolCalls.map((toolCall) => toolCall.toolName),
      ),
    );

    const hasAllianceData = calledTools.has("frcEventsAllianceSelectionTool");
    const hasPickData = calledTools.has("getPicksForEventTool");

    if (!hasAllianceData || !hasPickData) {
      return { toolChoice: "required" as const };
    }

    return { toolChoice: "auto" as const };
  },
});

export { scoringAgent, scoringOutputSchema };
