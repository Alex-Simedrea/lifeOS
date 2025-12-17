"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { CalendarProvider } from "@/components/calendar/calendar-context";
import { ClientContainer } from "@/components/ui/big-calendar/client-container";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TCalendarView } from "@/lib/calendar/types";
import type { IEvent } from "@/lib/calendar/interfaces";

export function CalendarContent({ view: initialView }: { view: TCalendarView }) {
  const [view, setView] = useState<TCalendarView>(initialView);
  const [items, setItems] = useState<"all" | "events" | "tasks">("all");
  const events = useQuery(api.events.list, {});
  const tasks = useQuery(api.tasks.list, {});

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
    if (items === "events") return all.filter((e) => e.kind !== "task");
    if (items === "tasks") return all.filter((e) => e.kind === "task");
    return all;
  }, [events, tasks, items]);

  if (!events || !tasks) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <p className="text-muted-foreground">Loading calendar...</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-14rem)] flex-col">
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
        >
          <ClientContainer view={view} />
        </CalendarProvider>
      </div>
    </div>
  );
}

