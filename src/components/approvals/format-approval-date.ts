import { format } from "date-fns";

export function formatApprovalDate(date: Date | number | string) {
  return format(date, "MMM d, yyyy, h:mm a");
}
