import { v } from "convex/values";
import * as z from "zod";

import { internalAction } from "./_generated/server";
import { fetchTba, tbaAwardsSchema } from "./lib/scoring/sources/tba";

/** Regional, district, district championship and championship events. */
const OFFICIAL_EVENT_TYPES = new Set([0, 1, 2, 3, 4, 5]);
const BATCH_SIZE = 10;

const eventsSchema = z.array(
  z.looseObject({ key: z.string(), event_type: z.int() }),
);

/**
 * Counts the award types given at official events in a season, with the
 * names events used. Use it to update `tba_award_types.ts`:
 * `npx convex run award_audit:auditAwardTypes '{"year": 2026}'`
 */
export const auditAwardTypes = internalAction({
  args: { year: v.number() },
  returns: v.array(
    v.object({
      awardType: v.number(),
      eventCount: v.number(),
      names: v.array(v.object({ name: v.string(), count: v.number() })),
    }),
  ),
  handler: async (_ctx, args) => {
    const events = eventsSchema
      .parse(await fetchTba(`/events/${args.year}/simple`))
      .filter((event) => OFFICIAL_EVENT_TYPES.has(event.event_type));

    const tally = new Map<
      number,
      { eventCount: number; names: Map<string, number> }
    >();

    for (let start = 0; start < events.length; start += BATCH_SIZE) {
      const batch = events.slice(start, start + BATCH_SIZE);
      const responses = await Promise.all(
        batch.map((event) => fetchTba(`/event/${event.key}/awards`)),
      );

      for (const response of responses) {
        const seenAtEvent = new Set<number>();
        for (const award of tbaAwardsSchema.parse(response)) {
          const entry = tally.get(award.award_type) ?? {
            eventCount: 0,
            names: new Map<string, number>(),
          };
          if (!seenAtEvent.has(award.award_type)) {
            entry.eventCount += 1;
            seenAtEvent.add(award.award_type);
          }
          entry.names.set(award.name, (entry.names.get(award.name) ?? 0) + 1);
          tally.set(award.award_type, entry);
        }
      }
    }

    return [...tally.entries()]
      .map(([awardType, entry]) => ({
        awardType,
        eventCount: entry.eventCount,
        names: [...entry.names.entries()]
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
      }))
      .sort((a, b) => a.awardType - b.awardType);
  },
});
