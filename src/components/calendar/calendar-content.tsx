"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { CalendarProvider } from "@/components/calendar/calendar-context";
import { ClientContainer } from "@/components/ui/big-calendar/client-container";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TCalendarView } from "@/lib/calendar/types";
import type { IEvent } from "@/lib/calendar/interfaces";
import {
  startOfMonth,
  endOfMonth,
  startOfDay,
  startOfWeek,
  endOfWeek,
  startOfYear,
  endOfYear,
  addDays,
} from "date-fns";
import type { Id } from "../../../convex/_generated/dataModel";

export function CalendarContent({
  view: initialView,
}: {
  view: TCalendarView;
}) {
  const [view, setView] = useState<TCalendarView>(initialView);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [items, setItems] = useState<"all" | "events" | "tasks">("all");
  const events = useQuery(api.events.list, {});
  const tasks = useQuery(api.tasks.list, {});

  const habits = useQuery(api.habits.list, { includeArchived: false });

  const range = useMemo(() => {
    if (view === "year")
      return { start: startOfYear(selectedDate), end: endOfYear(selectedDate) };
    if (view === "month" || view === "agenda")
      return {
        start: startOfMonth(selectedDate),
        end: endOfMonth(selectedDate),
      };
    return {
      start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
      end: endOfWeek(selectedDate, { weekStartsOn: 1 }),
    };
  }, [selectedDate, view]);

  const habitCheckins = useQuery(api.habits.getAllCheckinsForPeriod, {
    startDate: range.start.getTime(),
    endDate: range.end.getTime(),
  });

  const dailyHabitsByDay = useMemo(() => {
    if (view !== "week") return null;
    if (!habits) return null;
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const dailyHabits = habits.filter((h) => h.frequency.period === "day");
    const counts = new Map<string, number>();
    for (const c of habitCheckins ?? []) {
      if (!c.habit) continue;
      if (c.habit.frequency.period !== "day") continue;
      const dayStart = startOfDay(new Date(c.timestamp)).getTime();
      const k = `${c.habitId}-${dayStart}`;
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    return days.map((date) => {
      const dayStart = startOfDay(date).getTime();
      return {
        date,
        habits: dailyHabits.map((h) => {
          const done = counts.get(`${h._id}-${dayStart}`) ?? 0;
          return {
            habitId: h._id as Id<"habits">,
            name: h.name,
            emoji: h.emoji,
            color: h.color,
            done,
            target: Math.max(1, h.frequency.times),
          };
        }),
      };
    });
  }, [habits, habitCheckins, selectedDate, view]);

  const weeklyHabits = useMemo(() => {
    if (view !== "week") return null;
    if (!habits) return null;
    const list = habits.filter((h) => h.frequency.period === "week");
    const counts = new Map<string, number>();
    const weekStartMs = startOfWeek(selectedDate, {
      weekStartsOn: 1,
    }).getTime();
    const weekEndMs = endOfWeek(selectedDate, { weekStartsOn: 1 }).getTime();
    for (const c of habitCheckins ?? []) {
      if (!c.habit) continue;
      if (c.habit.frequency.period !== "week") continue;
      if (c.timestamp < weekStartMs || c.timestamp > weekEndMs) continue;
      counts.set(c.habitId, (counts.get(c.habitId) ?? 0) + 1);
    }
    return list.map((h) => ({
      habitId: h._id as Id<"habits">,
      name: h.name,
      emoji: h.emoji,
      color: h.color,
      done: counts.get(h._id) ?? 0,
      target: Math.max(1, h.frequency.times),
    }));
  }, [habits, habitCheckins, selectedDate, view]);

  const monthlyHabits = useMemo(() => {
    if (view !== "month") return null;
    if (!habits) return null;
    const list = habits.filter((h) => h.frequency.period === "month");
    const monthStartMs = startOfMonth(selectedDate).getTime();
    const monthEndMs = endOfMonth(selectedDate).getTime();
    const counts = new Map<string, number>();
    for (const c of habitCheckins ?? []) {
      if (!c.habit) continue;
      if (c.habit.frequency.period !== "month") continue;
      if (c.timestamp < monthStartMs || c.timestamp > monthEndMs) continue;
      counts.set(c.habitId, (counts.get(c.habitId) ?? 0) + 1);
    }
    return list.map((h) => ({
      habitId: h._id as Id<"habits">,
      name: h.name,
      emoji: h.emoji,
      color: h.color,
      done: counts.get(h._id) ?? 0,
      target: Math.max(1, h.frequency.times),
    }));
  }, [habits, habitCheckins, selectedDate, view]);

  const bigCalendarEvents = useMemo((): IEvent[] => {
    if (!events || !tasks) return [];

    const eventItems: IEvent[] = events.map((event) => ({
      id: event._creationTime,
      startDate: new Date(event.startDate).toISOString(),
      endDate: new Date(event.endDate).toISOString(),
      title: event.title,
      color: event.color,
      description: event.notes || "",
      user: {
        id: "current-user",
        name: "You",
        picturePath: null,
      },
      kind: "event",
      convexId: event._id,
      location: event.location,
      notes: event.notes,
      tags: event.tags,
      recurrence: event.recurrence,
    }));

    const taskItems: IEvent[] = tasks
      .filter((task) => task.startAt !== undefined || task.dueAt !== undefined)
      .map((task) => {
        const baseStart = task.startAt ?? task.dueAt!;
        const start = new Date(baseStart);
        if (!task.startAt) start.setHours(9, 0, 0, 0);
        const durationMinutes = task.duration ?? (task.startAt ? 60 : 30);
        const end = new Date(start.getTime() + durationMinutes * 60_000);
        const colorMap: Record<string, IEvent["color"]> = {
          low: "gray",
          medium: "blue",
          high: "orange",
          urgent: "red",
        };

        return {
          id: task._creationTime,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          title: task.title,
          color: colorMap[task.priority] || "blue",
          description: task.notes || "",
          user: {
            id: "current-user",
            name: "You",
            picturePath: null,
          },
          kind: "task",
          convexId: task._id,
          notes: task.notes,
          tags: task.tags,
          recurrence: task.recurrence,
          taskPriority: task.priority,
          taskStatus: task.status,
          taskDueAt: task.dueAt,
          taskStartAt: task.startAt,
          taskDuration: task.duration,
          taskSubtasks: task.subtasks,
        };
      });

    const all = [...eventItems, ...taskItems];
    if (items === "events") return all.filter((e) => e.kind === "event");
    if (items === "tasks") return all.filter((e) => e.kind === "task");
    return all;
  }, [events, tasks, habitCheckins, items]);

  if (!events || !tasks) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <p className="text-muted-foreground">Loading calendar...</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={view} onValueChange={(v) => setView(v as TCalendarView)}>
          <TabsList>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="year">Year</TabsTrigger>
            <TabsTrigger value="agenda">Agenda</TabsTrigger>
          </TabsList>
        </Tabs>

        <Tabs value={items} onValueChange={(v) => setItems(v as any)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="min-h-0 flex-1">
        <CalendarProvider
          users={[
            {
              id: "current-user",
              name: "You",
              picturePath: null,
            },
          ]}
          events={bigCalendarEvents}
          view={view}
          setView={setView}
          selectedDate={selectedDate}
          onSelectedDateChange={(d) => {
            if (d) setSelectedDate(d);
          }}
        >
          <ClientContainer
            view={view}
            dailyHabitsByDay={dailyHabitsByDay}
            weeklyHabits={weeklyHabits}
            monthlyHabits={monthlyHabits}
          />
        </CalendarProvider>
      </div>
    </div>
  );
}
