import { format, isValid, parseISO } from "date-fns";

export function formatEventDate(date: string) {
  const parsedDate = parseISO(date.includes("T") ? date : `${date}T00:00:00`);

  if (!isValid(parsedDate)) {
    return date;
  }

  return format(parsedDate, "EEE, MMM d, yyyy");
}

export function isEventCodeReady(eventCode: string) {
  const trimmedEventCode = eventCode.trim();
  return /^[a-zA-Z0-9]{2,}$/.test(trimmedEventCode) && trimmedEventCode.length >= 5;
}

/** "Mar 19 to 21" or "Mar 30 to Apr 2". */
export function formatDateRange(startDate: string, endDate: string) {
  const start = new Date(`${startDate.slice(0, 10)}T12:00:00`);
  const end = new Date(`${endDate.slice(0, 10)}T12:00:00`);
  const startMonth = start.toLocaleDateString("en-CA", { month: "short" });
  const endMonth = end.toLocaleDateString("en-CA", { month: "short" });
  return startMonth === endMonth
    ? `${startMonth} ${start.getDate()} to ${end.getDate()}`
    : `${startMonth} ${start.getDate()} to ${endMonth} ${end.getDate()}`;
}
