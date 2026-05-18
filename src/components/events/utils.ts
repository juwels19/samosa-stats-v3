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
