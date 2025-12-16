"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { parseISO } from "date-fns";

import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

import { useCalendar } from "@/components/calendar/calendar-context";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SingleDayPicker } from "@/components/ui/single-day-picker";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import type { IEvent } from "@/lib/calendar/interfaces";
import type { TEventColor } from "@/lib/calendar/types";

interface IProps {
  children: React.ReactNode;
  event: IEvent;
}

export function EditEventDialog({ children, event }: IProps) {
  const tags = useQuery(api.tags.list, {});
  const updateEventMutation = useMutation(api.events.update);
  const removeEventMutation = useMutation(api.events.remove);

  const { setLocalEvents } = useCalendar();

  const [open, setOpen] = useState(false);

  const start = useMemo(() => parseISO(event.startDate), [event.startDate]);
  const end = useMemo(() => parseISO(event.endDate), [event.endDate]);

  const [title, setTitle] = useState(event.title);
  const [date, setDate] = useState<Date | undefined>(start);
  const [time, setTime] = useState<string>(`${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`);
  const [durationMinutes, setDurationMinutes] = useState<string>(String(Math.max(1, Math.round((end.getTime() - start.getTime()) / 60_000))));
  const [location, setLocation] = useState(event.location ?? "");
  const [notes, setNotes] = useState(event.notes ?? event.description ?? "");
  const [color, setColor] = useState<TEventColor>(event.color);
  const [selectedTags, setSelectedTags] = useState<Id<"tags">[]>((event.tags ?? []) as Id<"tags">[]);

  const [recurring, setRecurring] = useState(Boolean(event.recurrence));
  const [recurrenceType, setRecurrenceType] = useState<"daily" | "weekly" | "monthly" | "yearly">(event.recurrence?.type ?? "weekly");
  const [recurrenceInterval, setRecurrenceInterval] = useState<string>(String(event.recurrence?.interval ?? 1));
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | undefined>(event.recurrence?.endDate ? new Date(event.recurrence.endDate) : undefined);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(event.recurrence?.daysOfWeek ?? []);
  const [dayOfMonth, setDayOfMonth] = useState<string>(String(event.recurrence?.dayOfMonth ?? 1));

  useEffect(() => {
    if (!open) return;
    const s = parseISO(event.startDate);
    const e = parseISO(event.endDate);
    setTitle(event.title);
    setDate(s);
    setTime(`${String(s.getHours()).padStart(2, "0")}:${String(s.getMinutes()).padStart(2, "0")}`);
    setDurationMinutes(String(Math.max(1, Math.round((e.getTime() - s.getTime()) / 60_000))));
    setLocation(event.location ?? "");
    setNotes(event.notes ?? event.description ?? "");
    setColor(event.color);
    setSelectedTags((event.tags ?? []) as Id<"tags">[]);
    setRecurring(Boolean(event.recurrence));
    setRecurrenceType(event.recurrence?.type ?? "weekly");
    setRecurrenceInterval(String(event.recurrence?.interval ?? 1));
    setRecurrenceEndDate(event.recurrence?.endDate ? new Date(event.recurrence.endDate) : undefined);
    setDaysOfWeek(event.recurrence?.daysOfWeek ?? []);
    setDayOfMonth(String(event.recurrence?.dayOfMonth ?? 1));
  }, [open, event]);

  const canSubmit = useMemo(() => {
    if (event.kind && event.kind !== "event") return false;
    if (!event.convexId) return false;
    if (!title.trim()) return false;
    if (!date) return false;
    const d = Number(durationMinutes);
    return Number.isFinite(d) && d > 0;
  }, [event.kind, event.convexId, title, date, durationMinutes]);

  const toggleTag = (tagId: Id<"tags">) => {
    setSelectedTags(prev => (prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]));
  };

  const toggleDow = (day: number) => {
    setDaysOfWeek(prev => (prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !date) return;

    const [hh, mm] = time.split(":").map(n => Number(n));
    const startDateTime = new Date(date);
    startDateTime.setHours(hh || 0, mm || 0, 0, 0);

    const duration = Math.max(1, Number(durationMinutes) || 1);
    const endDateTime = new Date(startDateTime.getTime() + duration * 60_000);

    const recurrence = recurring
      ? {
          type: recurrenceType,
          interval: Math.max(1, Number(recurrenceInterval) || 1),
          endDate: recurrenceEndDate ? recurrenceEndDate.getTime() : undefined,
          daysOfWeek: recurrenceType === "weekly" && daysOfWeek.length > 0 ? daysOfWeek : undefined,
          dayOfMonth: recurrenceType === "monthly" ? Math.max(1, Math.min(31, Number(dayOfMonth) || 1)) : undefined,
        }
      : undefined;

    await updateEventMutation({
      id: event.convexId as Id<"events">,
      title: title.trim(),
      startDate: startDateTime.getTime(),
      endDate: endDateTime.getTime(),
      location: location.trim() ? location.trim() : undefined,
      notes: notes.trim() ? notes.trim() : undefined,
      color,
      tags: selectedTags,
      recurrence,
    });

    setLocalEvents(prev =>
      prev.map(ev =>
        ev.id === event.id
          ? {
              ...ev,
              title: title.trim(),
              startDate: startDateTime.toISOString(),
              endDate: endDateTime.toISOString(),
              color,
              description: notes.trim(),
              location: location.trim() ? location.trim() : undefined,
              notes: notes.trim() ? notes.trim() : undefined,
              tags: selectedTags,
              recurrence,
            }
          : ev
      )
    );

    setOpen(false);
  };

  const onDelete = async () => {
    if (event.kind && event.kind !== "event") return;
    if (!event.convexId) return;
    const ok = window.confirm("Delete this event?");
    if (!ok) return;
    await removeEventMutation({ id: event.convexId as Id<"events"> });
    setLocalEvents(prev => prev.filter(e => e.id !== event.id));
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit</DialogTitle>
        </DialogHeader>

        {event.kind && event.kind !== "event" ? (
          <div className="py-4 text-sm text-muted-foreground">Tasks can’t be edited here.</div>
        ) : (
          <form id="event-edit" onSubmit={onSubmit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="title">
                Title
              </label>
              <Input id="title" value={title} onChange={e => setTitle(e.target.value)} />
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
        )}

        <DialogFooter>
          {(!event.kind || event.kind === "event") && (
            <Button type="button" variant="destructive" onClick={onDelete} disabled={!event.convexId}>
              Delete
            </Button>
          )}
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          {(!event.kind || event.kind === "event") && (
            <Button form="event-edit" type="submit" disabled={!canSubmit}>
              Save
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
