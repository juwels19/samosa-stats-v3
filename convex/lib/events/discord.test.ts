import { describe, expect, it } from "vitest";

import type { Id } from "../../_generated/dataModel";
import { formatEasternTime, getEventDiscordMessage } from "./discord";
import { getEventStatusTransitionTimestamps } from "./scheduling";
import type { EventStatusNotification } from "./types";

const event: EventStatusNotification = {
  _id: "event1" as Id<"events">,
  displayName: "Windsor",
  name: "ONT District Windsor Essex Great Lake Event",
  eventCode: "ONWIN",
  startDate: "2026-04-09",
  endDate: "2026-04-11",
  status: "UPCOMING",
  isMock: false,
  submissionsCloseAt: getEventStatusTransitionTimestamps({
    startDate: "2026-04-09",
    endDate: "2026-04-11",
  }).submissionsClosed,
};

describe("getEventDiscordMessage", () => {
  it("builds the reminder like v2", () => {
    expect(getEventDiscordMessage("PICK_REMINDER", event)).toEqual({
      content: "🚨Samosa Stats Pick Submission Reminder🚨 <@&1226682262070890587>",
      embeds: [
        {
          title: "Reminder to submit your picks for ONT District Windsor Essex Great Lake Event!",
          description:
            "Login to Samosa Stats and submit your picks!\n\nSubmissions will close at 9AM Eastern Time on April 10th.\n\n[samosastats.com/picks/onwin](https://samosastats.com/picks/onwin)",
          color: 6316287,
        },
      ],
    });
  });

  it("marks mock events in the header", () => {
    expect(getEventDiscordMessage("ONGOING", { ...event, isMock: true }).content).toBe(
      "🚨Samosa Stats Event LIVE (MOCK)🚨 <@&1226682262070890587>",
    );
  });
});

describe("formatEasternTime", () => {
  it("shows minutes only when there are some", () => {
    expect(formatEasternTime(Date.UTC(2026, 3, 10, 13, 0))).toBe("9AM Eastern Time on April 10th");
    expect(formatEasternTime(Date.UTC(2026, 10, 25, 2, 14))).toBe("9:14PM Eastern Time on November 24th");
  });
});
