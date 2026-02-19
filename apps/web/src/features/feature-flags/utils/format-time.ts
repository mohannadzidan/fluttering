import { differenceInMinutes, differenceInHours, format } from "date-fns";

/**
 * Format a timestamp as relative time (< 1 day) or absolute date (>= 1 day).
 *
 * Examples:
 * - < 1 min: "just now"
 * - 5 min ago: "5 min ago"
 * - 1 hr ago: "1 hr ago"
 * - 20 hr ago: "20 hr ago"
 * - 2+ days ago: "Feb 17, 2026"
 */
export function formatFlagTime(date: Date): string {
  const now = new Date();
  const minutes = differenceInMinutes(now, date);

  if (minutes < 1) {
    return "just now";
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = differenceInHours(now, date);
  if (hours < 24) {
    return `${hours} hr ago`;
  }

  // >= 1 day: show absolute date
  return format(date, "MMM d, yyyy");
}
