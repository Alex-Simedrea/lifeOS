"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { format, parseISO } from "date-fns";
import { Calendar, Clock, MapPin, Repeat, Tags, Text } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EditEventDialog } from "@/components/ui/big-calendar/dialogs/edit-event-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { api } from "../../../../../convex/_generated/api";
import { TaskForm } from "@/components/tasks/task-form";

import type { IEvent } from "@/lib/calendar/interfaces";
import type { Id } from "../../../../../convex/_generated/dataModel";

interface IProps {
  event: IEvent;
  children: React.ReactNode;
}

export function EventDetailsDialog({ event, children }: IProps) {
  const startDate = parseISO(event.startDate);
  const endDate = parseISO(event.endDate);
  const durationMinutes = Math.max(
    1,
    Math.round((endDate.getTime() - startDate.getTime()) / 60_000)
  );

  const tags = useQuery(api.tags.list, {});
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  const eventForEdit = useMemo(() => {
    if (event.kind !== "event") return event;
    if (!event.isRecurrenceInstance) return event;
    if (!event.seriesStartDate || !event.seriesEndDate) return event;
    return {
      ...event,
      startDate: event.seriesStartDate,
      endDate: event.seriesEndDate,
      isRecurrenceInstance: false,
    };
  }, [event]);

  const taskForForm = useMemo(() => {
    if (event.kind !== "task") return null;
    if (!event.convexId) return null;
    return {
      _id: event.convexId as Id<"tasks">,
      title: event.title,
      notes: event.notes ?? event.description ?? "",
      priority: event.taskPriority ?? "medium",
      status: event.taskStatus ?? "todo",
      dueAt: event.taskDueAt,
      startAt: event.taskStartAt,
      duration: event.taskDuration,
      tags: event.tags ?? [],
      recurrence: event.recurrence,
      subtasks: event.taskSubtasks ?? [],
    };
  }, [event]);

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="flex flex-col">
        <DialogHeader>
          <DialogTitle className="wrap-break-word whitespace-normal pr-8 leading-snug">
            {event.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-start gap-2">
            <Calendar className="mt-1 size-4 shrink-0" />
            <div>
              <p className="text-sm font-medium">When</p>
              <p className="text-sm text-muted-foreground">
                {format(startDate, "MMM d, yyyy")}
                {" · "}
                {format(startDate, "h:mm a")} – {format(endDate, "h:mm a")}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Clock className="mt-1 size-4 shrink-0" />
            <div>
              <p className="text-sm font-medium">Duration</p>
              <p className="text-sm text-muted-foreground">
                {durationMinutes} minutes
              </p>
            </div>
          </div>

          {event.location && (
            <div className="flex items-start gap-2">
              <MapPin className="mt-1 size-4 shrink-0" />
              <div>
                <p className="text-sm font-medium">Location</p>
                <p className="text-sm text-muted-foreground">
                  {event.location}
                </p>
              </div>
            </div>
          )}

          {(event.notes || event.description) && (
            <div className="flex items-start gap-2">
              <Text className="mt-1 size-4 shrink-0" />
              <div>
                <p className="text-sm font-medium">Notes</p>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {event.notes ?? event.description}
                </p>
              </div>
            </div>
          )}

          {event.recurrence && (
            <div className="flex items-start gap-2">
              <Repeat className="mt-1 size-4 shrink-0" />
              <div>
                <p className="text-sm font-medium">Recurrence</p>
                <p className="text-sm text-muted-foreground">
                  {event.recurrence.type} · every {event.recurrence.interval}
                </p>
              </div>
            </div>
          )}

          {event.tags && event.tags.length > 0 && (
            <div className="flex items-start gap-2">
              <Tags className="mt-1 size-4 shrink-0" />
              <div>
                <p className="text-sm font-medium">Tags</p>
                <p className="text-sm text-muted-foreground">
                  {event.tags.length}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {(!event.kind || event.kind === "event") && (
            <EditEventDialog event={eventForEdit}>
              <Button type="button" variant="outline">
                Edit
              </Button>
            </EditEventDialog>
          )}

          {event.kind === "task" && taskForForm && (
            <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline">
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
                <TaskForm
                  task={taskForForm}
                  tags={tags ?? []}
                  onClose={() => setTaskDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
