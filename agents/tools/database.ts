import { tool } from "ai";
import { z } from "zod";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

function serializeForJson<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_, currentValue) =>
      typeof currentValue === "bigint" ? Number(currentValue) : currentValue,
    ),
  );
}

const getPicksForEventTool = tool({
  description: "Get the picks for an event from the database.",
  inputSchema: z.object({
    eventCode: z.string().describe("The event code to get the picks for"),
    year: z.number().describe("The year of the event to get the picks for"),
  }),
  inputExamples: [
    {
      input: {
        eventCode: "onosh",
        year: 2026,
      },
    },
  ],
  execute: async ({ eventCode, year }) => {
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    const picks = await convex.query(api.picks.listPicksForEvent, { eventCode, year });
    return serializeForJson(picks);
  },
});

export { getPicksForEventTool }