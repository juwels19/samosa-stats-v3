import { format, isValid, parseISO } from "date-fns";

export function formatEventDate(date: string) {
  const parsedDate = parseISO(date.includes("T") ? date : `${date}T00:00:00`);

  if (!isValid(parsedDate)) {
    return date;
  }

  return format(parsedDate, "EEE, MMM d, yyyy");
}
