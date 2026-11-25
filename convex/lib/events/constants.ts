import { EventStatus } from "./types";

export const EVENT_TIME_ZONE = "America/New_York";
/** The Approved Degen role, the same as v2. */
export const DISCORD_ROLE_MENTION = "<@&1226682262070890587>";
export const DISCORD_EMBED_COLOR = 6316287;
export const SITE_URL = "https://samosastats.com";
export const STATUS_SCHEDULE_OFFSET_YEARS = 1;

export const EVENT_STATUS_SORT_ORDER: Record<EventStatus, number> = {
  SUBMISSIONS_OPEN: 0,
  SUBMISSIONS_CLOSED: 1,
  ONGOING: 2,
  UPCOMING: 3,
  COMPLETE: 4,
};