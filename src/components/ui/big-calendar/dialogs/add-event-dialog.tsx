"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";

import { useCalendar } from "@/components/calendar/calendar-context";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SingleDayPicker } from "@/components/ui/single-day-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogHeader, DialogClose, DialogContent, DialogTrigger, DialogTitle, DialogFooter } from "@/components/ui/dialog";

import type { Id } from "../../../../../convex/_generated/dataModel";
import type { TEventColor } from "@/lib/calendar/types";

interface IProps {
  children: React.ReactNode;
  startDate?: Date;
  startTime?: { hour: number; minute: number };
}

export function AddEventDialog({ children, startDate, startTime }: IProps) {
  const createEvent = useMutation(api.events.create);
  const tags = useQuery(api.tags.list, {});

  const { setLocalEvents } = useCalendar();

  const [open, setOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState<Date | undefined>(startDate);
  const [time, setTime] = useState<string>(() => {
    if (!startTime) return "09:00";
    const hh = String(startTime.hour).padStart(2, "0");
    const mm = String(startTime.minute).padStart(2, "0");
    return `${hh}:${mm}`;
  });
  const [durationMinutes, setDurationMinutes] = useState<string>("60");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [color, setColor] = useState<TEventColor>("blue");
  const [selectedTags, setSelectedTags] = useState<Id<"tags">[]>([]);

  const [recurring, setRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<"daily" | "weekly" | "monthly" | "yearly">("weekly");
  const [recurrenceInterval, setRecurrenceInterval] = useState<string>("1");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | undefined>(undefined);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [dayOfMonth, setDayOfMonth] = useState<string>("1");

  useEffect(() => {
    if (!open) return;
    setDate(startDate);
    if (startTime) {
      const hh = String(startTime.hour).padStart(2, "0");
      const mm = String(startTime.minute).padStart(2, "0");
      setTime(`${hh}:${mm}`);
    }
  }, [open, startDate, startTime]);

  const canSubmit = useMemo(() => {
    if (!title.trim()) return false;
    if (!date) return false;
    if (!time) return false;
    const d = Number(durationMinutes);
    return Number.isFinite(d) && d > 0;
  }, [title, date, time, durationMinutes]);

  const toggleTag = (tagId: Id<"tags">) => {
    setSelectedTags(prev => (prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]));
  };

  const toggleDow = (day: number) => {
    setDaysOfWeek(prev => (prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()));
  };

  const resetForm = () => {
    setTitle("");
    setDate(startDate);
    setLocation("");
    setNotes("");
    setColor("blue");
    setSelectedTags([]);
    setRecurring(false);
    setRecurrenceType("weekly");
    setRecurrenceInterval("1");
    setRecurrenceEndDate(undefined);
    setDaysOfWeek([]);
    setDayOfMonth("1");
    if (startTime) {
      const hh = String(startTime.hour).padStart(2, "0");
      const mm = String(startTime.minute).padStart(2, "0");
      setTime(`${hh}:${mm}`);
    } else {
      setTime("09:00");
    }
    setDurationMinutes("60");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !date) return;

    const [hh, mm] = time.split(":").map(n => Number(n));
    const start = new Date(date);
    start.setHours(hh || 0, mm || 0, 0, 0);

    const duration = Number(durationMinutes);
    const end = new Date(start.getTime() + duration * 60_000);

    const recurrence = recurring
      ? {
          type: recurrenceType,
          interval: Math.max(1, Number(recurrenceInterval) || 1),
          endDate: recurrenceEndDate ? recurrenceEndDate.getTime() : undefined,
          daysOfWeek: recurrenceType === "weekly" && daysOfWeek.length > 0 ? daysOfWeek : undefined,
          dayOfMonth: recurrenceType === "monthly" ? Math.max(1, Math.min(31, Number(dayOfMonth) || 1)) : undefined,
        }
      : undefined;

    const id = await createEvent({
      title: title.trim(),
      startDate: start.getTime(),
      endDate: end.getTime(),
      location: location.trim() ? location.trim() : undefined,
      notes: notes.trim() ? notes.trim() : undefined,
      color,
      tags: selectedTags,
      recurrence,
    });

    setLocalEvents(prev => [
      ...prev,
      {
        id: Date.now(),
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        title: title.trim(),
        color,
        description: notes.trim(),
        user: { id: "current-user", name: "You", picturePath: null },
        kind: "event",
        convexId: id,
        location: location.trim() ? location.trim() : undefined,
        notes: notes.trim() ? notes.trim() : undefined,
        tags: selectedTags,
        recurrence,
      },
    ]);

    setOpen(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Event</DialogTitle>
        </DialogHeader>

        <form id="event-form" onSubmit={onSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="title">
              Title
            </label>
            <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Event title" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Date</label>
              <SingleDayPicker value={date} onSelect={d => setDate(d as Date)} placeholder="Select a date" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="time">
                Time
              </label>
              <Input id="time" type="time" value={time} onChange={e => setTime(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="duration">
                Duration (minutes)
              </label>
              <Input id="duration" type="number" min={1} value={durationMinutes} onChange={e => setDurationMinutes(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Color</label>
              <Select value={color} onValueChange={v => setColor(v as TEventColor)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blue">Blue</SelectItem>
                  <SelectItem value="green">Green</SelectItem>
                  <SelectItem value="red">Red</SelectItem>
                  <SelectItem value="yellow">Yellow</SelectItem>
                  <SelectItem value="purple">Purple</SelectItem>
                  <SelectItem value="orange">Orange</SelectItem>
                  <SelectItem value="gray">Gray</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="location">
              Location
            </label>
            <Input id="location" value={location} onChange={e => setLocation(e.target.value)} placeholder="Optional" />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="notes">
              Notes
            </label>
            <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={4} />
          </div>

          {tags && tags.length > 0 && (
            <div className="grid gap-2">
              <div className="text-sm font-medium">Tags</div>
              <ScrollArea className="h-28 rounded-md border p-2">
                <div className="grid gap-2">
                  {tags.map(t => (
                    <label key={t._id} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={selectedTags.includes(t._id)} onCheckedChange={() => toggleTag(t._id)} />
                      <span>{t.emoji}</span>
                      <span className="truncate">{t.name}</span>
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="grid">
              <div className="text-sm font-medium">Recurrence</div>
              <div className="text-xs text-muted-foreground">Repeat this event</div>
            </div>
            <Switch checked={recurring} onCheckedChange={setRecurring} />
          </div>

          {recurring && (
            <div className="grid gap-3 rounded-md border p-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <div className="text-sm font-medium">Type</div>
                  <Select value={recurrenceType} onValueChange={v => setRecurrenceType(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <div className="text-sm font-medium">Interval</div>
                  <Input type="number" min={1} value={recurrenceInterval} onChange={e => setRecurrenceInterval(e.target.value)} />
                </div>
              </div>

              {recurrenceType === "weekly" && (
                <div className="grid gap-2">
                  <div className="text-sm font-medium">Days</div>
                  <div className="grid grid-cols-7 gap-2">
                    {["S", "M", "T", "W", "T", "F", "S"].map((label, idx) => (
                      <button
                        key={label + idx}
                        type="button"
                        onClick={() => toggleDow(idx)}
                        className={`h-8 rounded-md border text-sm ${daysOfWeek.includes(idx) ? "bg-primary text-primary-foreground" : "bg-background"}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {recurrenceType === "monthly" && (
                <div className="grid gap-2">
                  <div className="text-sm font-medium">Day of month</div>
                  <Input type="number" min={1} max={31} value={dayOfMonth} onChange={e => setDayOfMonth(e.target.value)} />
                </div>
              )}

              <div className="grid gap-2">
                <div className="text-sm font-medium">End date</div>
                <SingleDayPicker value={recurrenceEndDate} onSelect={d => setRecurrenceEndDate(d as Date)} placeholder="Optional" />
              </div>
            </div>
          )}
        </form>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>

          <Button form="event-form" type="submit" disabled={!canSubmit}>
            Create Event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
