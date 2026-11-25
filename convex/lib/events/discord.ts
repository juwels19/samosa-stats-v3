import { formatInTimeZone } from "date-fns-tz";

import {
  DISCORD_EMBED_COLOR,
  DISCORD_ROLE_MENTION,
  EVENT_TIME_ZONE,
  SITE_URL,
} from "./constants";
import type {
  DiscordWebhookPayload,
  EventStatusNotification,
} from "./types";

export type DiscordMessageKind =
  | "SUBMISSIONS_OPEN"
  | "PICK_REMINDER"
  | "SUBMISSIONS_CLOSED"
  | "ONGOING";

export type EventDiscordMessage = DiscordWebhookPayload & {
  content: string;
  embeds: [{ title: string; description: string; color: number }];
};

/**
 * The message for a status change or reminder: a header line that mentions
 * the role, and an embed with the details. The style is the same as v2.
 */
export function getEventDiscordMessage(
  kind: DiscordMessageKind,
  event: EventStatusNotification,
): EventDiscordMessage {
  const picksLink = link(`${SITE_URL}/picks/${event.eventCode.toLowerCase()}`);
  const closes = `Submissions will close at ${formatEasternTime(event.submissionsCloseAt)}.`;

  const { header, title, description } = ((): {
    header: string;
    title: string;
    description: string;
  } => {
    switch (kind) {
      case "SUBMISSIONS_OPEN":
        return {
          header: "Event Submissions OPEN",
          title: `Submissions are now open for ${event.name}!`,
          description: `Login to Samosa Stats and submit your picks!\n\n${closes}\n\n${picksLink}`,
        };
      case "PICK_REMINDER":
        return {
          header: "Pick Submission Reminder",
          title: `Reminder to submit your picks for ${event.name}!`,
          description: `Login to Samosa Stats and submit your picks!\n\n${closes}\n\n${picksLink}`,
        };
      case "SUBMISSIONS_CLOSED":
        return {
          header: "Event Submissions CLOSED",
          title: `GATES ARE NOW CLOSED FOR ${event.name}!`,
          description: `If you didn't submit your picks, too bad... You can still make a random pick until the event starts.\n\n${picksLink}`,
        };
      case "ONGOING":
        return {
          header: "Event LIVE",
          title: `${event.name} is now live!`,
          description: `ALL PICK SUBMISSIONS ARE CLOSED.\n\n${link(SITE_URL)}`,
        };
    }
  })();

  const label = event.isMock ? `${header} (MOCK)` : header;
  return {
    content: `🚨Samosa Stats ${label}🚨 ${DISCORD_ROLE_MENTION}`,
    embeds: [{ title, description, color: DISCORD_EMBED_COLOR }],
  };
}

/** `https://samosastats.com/x` to a Markdown link that shows the URL without https://. */
function link(url: string) {
  return `[${url.replace(/^https?:\/\//, "")}](${url})`;
}

/** "9AM Eastern Time on April 10th", or "9:30AM ..." when there are minutes. */
export function formatEasternTime(timestamp: number) {
  const minutes = formatInTimeZone(timestamp, EVENT_TIME_ZONE, "mm");
  const time = formatInTimeZone(
    timestamp,
    EVENT_TIME_ZONE,
    minutes === "00" ? "ha" : "h:mma",
  );
  return `${time} Eastern Time on ${formatInTimeZone(timestamp, EVENT_TIME_ZONE, "MMMM do")}`;
}

export async function postDiscordMessage(
  webhookUrl: string,
  payload: DiscordWebhookPayload,
) {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Discord webhook failed with status ${response.status}.`);
  }
}
