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
      .filter(task => task.startAt !== undefined)
      .map((task, index) => {
        const startDate = task.startAt!;
        const endDate = startDate + (task.duration ?? 60) * 60_000;
        const colorMap: Record<string, IEvent["color"]> = {
          low: "gray",
          medium: "blue",
          high: "orange",
          urgent: "red",
        };

        return {
          id: task._creationTime,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
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
        };
      });

    return [...eventItems, ...taskItems];
  }, [events, tasks]);

  if (!events || !tasks) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <p className="text-muted-foreground">Loading calendar...</p>
      </div>
    );
  }

  return (
    <div>
      <Tabs value={view} onValueChange={(v) => setView(v as TCalendarView)} className="mb-4">
        <TabsList>
          <TabsTrigger value="month">Month</TabsTrigger>
          <TabsTrigger value="week">Week</TabsTrigger>
          <TabsTrigger value="day">Day</TabsTrigger>
          <TabsTrigger value="year">Year</TabsTrigger>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
        </TabsList>
      </Tabs>
      <CalendarProvider
        users={[
          {
            id: "current-user",
            name: "You",
            picturePath: null,
          },
        ]}
        events={bigCalendarEvents}
      >
        <ClientContainer view={view} />
      </CalendarProvider>
    </div>
  );
}

