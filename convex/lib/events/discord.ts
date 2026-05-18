import { DISCORD_ROLE_MENTION } from "./constants";
import type {
  DiscordWebhookPayload,
  EventStatusNotification,
} from "./types";

export function getEventStatusDiscordMessage(
  event: EventStatusNotification,
): string {
  switch (event.status) {
    case "SUBMISSIONS_OPEN":
      return `${DISCORD_ROLE_MENTION} ${event.displayName} (${event.eventCode}) submissions are now open.`;
    case "SUBMISSIONS_CLOSED":
      return `${DISCORD_ROLE_MENTION} ${event.displayName} (${event.eventCode}) submissions are now closed. Random picks are still allowed.`;
    case "ONGOING":
      return `${DISCORD_ROLE_MENTION} ${event.displayName} (${event.eventCode}) is now ongoing. ALL PICK SUBMISSIONS ARE CLOSED.`;
    default:
      throw new Error(`No Discord message configured for ${event.status}.`);
  }
}

export function getPickSubmissionReminderDiscordMessage(
  event: EventStatusNotification,
): string {
  return `${DISCORD_ROLE_MENTION} Reminder: ${event.displayName} (${event.eventCode}) starts tomorrow. Submit your picks before submissions close.`;
}

export async function sendDiscordMessage(payload: DiscordWebhookPayload) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (webhookUrl === undefined) {
    throw new Error("DISCORD_WEBHOOK_URL is not configured.");
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Discord webhook failed with status ${response.status}.`);
  }
}
