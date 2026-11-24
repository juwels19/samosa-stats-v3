import { getEventAllianceSelectionForYearAndCode } from "@/lib/fetch/frc-events";
import { tool } from "ai";
import { z } from "zod";


const frcEventsAllianceSelectionTool = tool({
  description: "Get the alliance selection results of an event from the FRC API. This tool is used to get the alliance selection results of an event by year and event code.",
  inputSchema: z.object({
    year: z.number().describe("The year of the event to fetch alliance selection for"),
    eventCode: z.string().describe("The event code to fetch alliance selection for"),
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
    const rankings = await getEventAllianceSelectionForYearAndCode({ year, eventCode });
    return rankings;
  },
});

export { frcEventsAllianceSelectionTool }