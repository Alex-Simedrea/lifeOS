"use client";

import { format, parseISO } from "date-fns";
import { Calendar, Clock, MapPin, Repeat, Tags, Text } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EditEventDialog } from "@/components/ui/big-calendar/dialogs/edit-event-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import type { IEvent } from "@/lib/calendar/interfaces";

interface IProps {
  event: IEvent;
  children: React.ReactNode;
}

export function EventDetailsDialog({ event, children }: IProps) {
  const startDate = parseISO(event.startDate);
  const endDate = parseISO(event.endDate);
  const durationMinutes = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 60_000));

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{event.title}</DialogTitle>
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
              <p className="text-sm text-muted-foreground">{durationMinutes} minutes</p>
            </div>
          </div>

          {event.location && (
            <div className="flex items-start gap-2">
              <MapPin className="mt-1 size-4 shrink-0" />
              <div>
                <p className="text-sm font-medium">Location</p>
                <p className="text-sm text-muted-foreground">{event.location}</p>
              </div>
            </div>
          )}

          {(event.notes || event.description) && (
            <div className="flex items-start gap-2">
              <Text className="mt-1 size-4 shrink-0" />
              <div>
                <p className="text-sm font-medium">Notes</p>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{event.notes ?? event.description}</p>
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
                <p className="text-sm text-muted-foreground">{event.tags.length}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {(!event.kind || event.kind === "event") && (
            <EditEventDialog event={event}>
              <Button type="button" variant="outline">
                Edit
              </Button>
            </EditEventDialog>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
