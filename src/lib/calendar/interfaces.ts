import type { TEventColor } from "@/lib/calendar/types";
import type { Id } from "../../../convex/_generated/dataModel";

// Interface for big-calendar components (uses ISO string dates and simpler structure)
export interface IEvent {
  id: number | string;
  startDate: string;
  endDate: string;
  seriesStartDate?: string;
  seriesEndDate?: string;
  title: string;
  color: TEventColor;
  description: string;
  user: IUser;
  kind?: "event" | "task" | "habit";
  convexId?: Id<"events"> | Id<"tasks"> | Id<"habits">;
  isRecurrenceInstance?: boolean;
  taskPriority?: "low" | "medium" | "high" | "urgent";
  taskStatus?: "todo" | "in_progress" | "completed" | "cancelled";
  taskDueAt?: number;
  taskStartAt?: number;
  taskDuration?: number;
  taskSubtasks?: Array<{ id: string; text: string; completed: boolean }>;
  location?: string;
  notes?: string;
  tags?: Id<"tags">[];
  recurrence?: {
    type: "daily" | "weekly" | "monthly" | "yearly";
    interval: number;
    endDate?: number;
    daysOfWeek?: number[];
    dayOfMonth?: number;
  };
}

export interface IUser {
  id: string;
  name: string;
  picturePath: string | null;
}

// Interface for Convex events
export interface IConvexEvent {
  _id: Id<"events">;
  _creationTime: number;
  title: string;
  startDate: number;
  endDate: number;
  location?: string;
  notes?: string;
  color: TEventColor;
  recurrence?: {
    type: "daily" | "weekly" | "monthly" | "yearly";
    interval: number;
    endDate?: number;
    daysOfWeek?: number[];
    dayOfMonth?: number;
  };
  tags: Id<"tags">[];
  userId: string;
  createdAt: number;
  updatedAt: number;
}

export interface ITask {
  _id: Id<"tasks">;
  _creationTime: number;
  title: string;
  notes?: string;
  status: "todo" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  dueAt?: number;
  startAt?: number;
  duration?: number;
  recurrence?: {
    type: "daily" | "weekly" | "monthly" | "yearly";
    interval: number;
    endDate?: number;
    daysOfWeek?: number[];
    dayOfMonth?: number;
  };
  tags: Id<"tags">[];
  subtasks?: Array<{
    id: string;
    text: string;
    completed: boolean;
  }>;
  userId: string;
  createdAt: number;
  updatedAt: number;
}

export interface ICalendarCell {
  day: number;
  currentMonth: boolean;
  date: Date;
}

export interface ICalendarItem {
  _id: Id<"events"> | Id<"tasks">;
  title: string;
  startDate: number;
  endDate: number;
  color: TEventColor;
  notes?: string;
  type: "event" | "task";
  location?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  status?: "todo" | "in_progress" | "completed" | "cancelled";
}
