import { getStatboticsEventResults, getStatboticsMatchResults } from "@/lib/statbotics/statbotics";
import { tool } from "ai";
import { z } from "zod";

const statboticsMatchResultsTool = tool({
  description: "Get predicted and actual results of all matches in an event from Statbotics.",
  inputSchema: z.object({
    year: z.number().describe("The year of the event"),
    eventCode: z.string().describe("The event code for the event"),
  }),
  inputExamples: [
    {
      input: {
        year: 2026,
        eventCode: "onosh",
      },
    },
  ],
  execute: async ({ year, eventCode }) => {
    const results = await getStatboticsMatchResults({ year, eventCode });
    return results;
  },
});

const statboticsEventResultsTool = tool({
  description: "Get Statbotics EPA metrics for all teams in an event.",
  inputSchema: z.object({
    year: z.number().describe("The year of the event"),
    eventCode: z.string().describe("The event code for the event"),
  }),
  inputExamples: [
    {
      input: {
        year: 2026,
        eventCode: "onosh",
      },
    },
  ],
  execute: async ({ year, eventCode }) => {
    const results = await getStatboticsEventResults({ year, eventCode });
    return results;
  },
});

export { statboticsMatchResultsTool, statboticsEventResultsTool }