import type { Id } from "../../_generated/dataModel";

export type EventStatus =
  | "UPCOMING"
  | "SUBMISSIONS_OPEN"
  | "SUBMISSIONS_CLOSED"
  | "ONGOING"
  | "COMPLETE";

export type EventStatusTransitionTimestamps = {
  submissionsOpen: number;
  pickSubmissionReminder: number;
  submissionsClosed: number;
  ongoing: number;
  complete: number;
};

export type EventStatusNotification = {
  _id: Id<"events">;
  displayName: string;
  eventCode: string;
  startDate: string;
  endDate: string;
  status: EventStatus;
};

export type DiscordWebhookPayload = {
  content?: string;
  embeds?: DiscordEmbed[];
};

export type DiscordEmbed = {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  fields?: DiscordEmbedField[];
  footer?: {
    text: string;
    icon_url?: string;
  };
  timestamp?: string;
};

export type DiscordEmbedField = {
  name: string;
  value: string;
  inline?: boolean;
};
