import type { EventCardEvent } from "@/components/events/types";

export function getEventPicksCtaLabel(event: EventCardEvent) {
  if (event.status === "ONGOING" || event.status === "COMPLETE") {
    return "View picks";
  }

  if (event.hasSubmittedPicks) {
    return "Edit picks";
  }

  return "Make picks";
}
