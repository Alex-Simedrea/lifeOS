"use client";

import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCalendar } from "@/components/calendar/calendar-context";
import type { IEvent } from "@/lib/calendar/interfaces";
import type { Id } from "../../../convex/_generated/dataModel";

export function useUpdateEvent() {
  const { setLocalEvents } = useCalendar();
  const updateConvexEvent = useMutation(api.events.update);
  const updateTask = useMutation(api.tasks.update);

  const updateEvent = (updated: IEvent) => {
    setLocalEvents(prev =>
      prev.map(e => {
        if (updated.convexId && e.convexId && e.convexId === updated.convexId) {
          return {
            ...e,
            ...updated,
            taskStartAt: updated.kind === "task" ? new Date(updated.startDate).getTime() : e.taskStartAt,
            taskDuration:
              updated.kind === "task"
                ? Math.max(1, Math.round((new Date(updated.endDate).getTime() - new Date(updated.startDate).getTime()) / 60_000))
                : e.taskDuration,
          };
        }
        return e.id === updated.id ? updated : e;
      })
    );

    if (updated.kind === "event" && updated.convexId) {
      void updateConvexEvent({
        id: updated.convexId as Id<"events">,
        startDate: new Date(updated.startDate).getTime(),
        endDate: new Date(updated.endDate).getTime(),
      });
    }

    if (updated.kind === "task" && updated.convexId) {
      const startAt = new Date(updated.startDate).getTime();
      const endAt = new Date(updated.endDate).getTime();
      const durationMinutes = Math.max(1, Math.round((endAt - startAt) / 60_000));
      void updateTask({
        id: updated.convexId as Id<"tasks">,
        startAt,
        duration: durationMinutes,
      });
    }
  };

  return { updateEvent };
}

