import { format } from "date-fns";

export const EVENT_COLOR_CLASSES: Record<string, string> = {
  blue: "bg-blue-500",
  green: "bg-emerald-500",
  red: "bg-red-500",
  yellow: "bg-amber-500",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
  gray: "bg-slate-400",
};

export const TASK_STATUS_LABELS: Record<string, string> = {
  todo: "To do",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const TASK_PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export function formatTimeRange(startMs: number, endMs: number) {
  return `${format(new Date(startMs), "h:mm a")} - ${format(
    new Date(endMs),
    "h:mm a"
  )}`;
}

export function formatDurationShort(ms: number) {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function applyTimeToDate(baseDate: Date, timeValue: string) {
  const [hoursStr, minutesStr] = timeValue.split(":");
  const hours = Number.parseInt(hoursStr ?? "", 10);
  const minutes = Number.parseInt(minutesStr ?? "", 10);
  const next = new Date(baseDate);
  if (Number.isFinite(hours) && Number.isFinite(minutes)) {
    next.setHours(hours, minutes, 0, 0);
  }
  return next;
}
