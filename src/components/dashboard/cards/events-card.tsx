"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { endOfDay, format, startOfDay } from "date-fns";
import { Calendar, Plus } from "lucide-react";

import { api } from "../../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DashboardCard } from "../dashboard-card";
import {
  EVENT_COLOR_CLASSES,
  applyTimeToDate,
  formatTimeRange,
} from "../dashboard-utils";

export function EventsCard({ className }: { className?: string }) {
  const todayStart = useMemo(() => startOfDay(Date.now()).getTime(), []);
  const todayEnd = useMemo(() => endOfDay(Date.now()).getTime(), []);
  const todayDate = useMemo(() => new Date(todayStart), [todayStart]);

  const events = useQuery(api.events.list, {
    startDate: todayStart,
    endDate: todayEnd,
  });
  const createEvent = useMutation(api.events.create);

  const [eventTitle, setEventTitle] = useState("");
  const [eventTime, setEventTime] = useState(() => format(new Date(), "HH:mm"));
  const [eventDuration, setEventDuration] = useState("30");
  const [isAddingEvent, setIsAddingEvent] = useState(false);

  const todayEvents = useMemo(() => {
    if (!events) return [];
    const sorted = [...events].sort((a, b) => a.startDate - b.startDate);
    return sorted.slice(0, 5);
  }, [events]);

  const handleAddEvent = async (event: FormEvent) => {
    event.preventDefault();
    const title = eventTitle.trim();
    if (!title || isAddingEvent) return;
    setIsAddingEvent(true);
    try {
      const start = applyTimeToDate(todayDate, eventTime);
      const durationMinutes = Number.parseInt(eventDuration, 10) || 30;
      const end = new Date(start.getTime() + durationMinutes * 60_000);
      await createEvent({
        title,
        startDate: start.getTime(),
        endDate: end.getTime(),
      });
      setEventTitle("");
    } finally {
      setIsAddingEvent(false);
    }
  };

  return (
    <DashboardCard
      title="Events"
      description="Today on your calendar"
      href="/calendar"
      icon={Calendar}
      tone="bg-gradient-to-br from-sky-50/70 via-background to-background dark:from-sky-950/30 dark:via-background dark:to-background"
      iconBg="bg-sky-100/70 dark:bg-sky-500/20"
      iconTone="text-sky-700 dark:text-sky-200"
      className={className}
    >
      <div className="flex flex-wrap gap-2">
        <Badge className="bg-sky-100 text-sky-900 dark:bg-sky-500/20 dark:text-sky-100">
          {events?.length ?? 0} today
        </Badge>
        {todayEvents[0] && (
          <Badge
            variant="outline"
            className="border-sky-200/70 text-sky-900 dark:border-sky-500/40 dark:text-sky-100"
          >
            Next at {format(new Date(todayEvents[0].startDate), "h:mm a")}
          </Badge>
        )}
      </div>

      {events === undefined ? (
        <p className="text-sm text-muted-foreground">Loading events...</p>
      ) : todayEvents.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No events scheduled for today.
        </p>
      ) : (
        <div className="space-y-3">
          {todayEvents.map((event) => (
            <div key={event._id} className="flex items-start gap-3">
              <span
                className={`mt-2 h-2 w-2 rounded-full ${
                  EVENT_COLOR_CLASSES[event.color] ?? "bg-blue-500"
                }`}
              />
              <div className="flex-1">
                <p className="text-sm font-medium">{event.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatTimeRange(event.startDate, event.endDate)}
                  {event.location ? ` - ${event.location}` : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="pt-4 mt-auto">
        <form onSubmit={handleAddEvent} className="flex gap-2 max-xl:flex-wrap">
          <Input
            value={eventTitle}
            onChange={(event) => setEventTitle(event.target.value)}
            placeholder="Quick add an event"
            aria-label="Event title"
            className="flex-1 min-w-[200px]"
          />
          <Input
            type="time"
            value={eventTime}
            onChange={(event) => setEventTime(event.target.value)}
            className="min-w-[130px] w-[130px]"
            aria-label="Event start time"
          />
          <Select value={eventDuration} onValueChange={setEventDuration}>
            <SelectTrigger className="w-[120px] h-full!" aria-label="Duration">
              <SelectValue placeholder="Duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 min</SelectItem>
              <SelectItem value="45">45 min</SelectItem>
              <SelectItem value="60">60 min</SelectItem>
              <SelectItem value="90">90 min</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="submit"
            size="sm"
            disabled={isAddingEvent}
            className="h-9!"
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </form>
      </div>
    </DashboardCard>
  );
}
