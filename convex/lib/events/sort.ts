import { EVENT_STATUS_SORT_ORDER } from "./constants";
import type { EventStatus } from "./types";

export function sortCategoriesByText<TCategory extends { text: string }>(
  categories: TCategory[],
) {
  return categories.toSorted((a, b) => a.text.localeCompare(b.text));
}

export function sortEventsByStartDate<TEvent extends { startDate: string }>(
  events: TEvent[],
) {
  return events.toSorted((a, b) => a.startDate.localeCompare(b.startDate));
}

export function sortEventsForDashboard<
  TEvent extends {
    status: EventStatus;
    startDate: string;
    displayName: string;
  },
>(events: TEvent[]) {
  return events.toSorted((a, b) => {
    const statusOrder =
      EVENT_STATUS_SORT_ORDER[a.status] - EVENT_STATUS_SORT_ORDER[b.status];

    if (statusOrder !== 0) {
      return statusOrder;
    }

    const startDateOrder = a.startDate.localeCompare(b.startDate);

    if (startDateOrder !== 0) {
      return startDateOrder;
    }

    return a.displayName.localeCompare(b.displayName);
  });
}
