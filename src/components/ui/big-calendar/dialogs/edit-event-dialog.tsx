"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Plus, X } from "lucide-react";

import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

import { useCalendar } from "@/components/calendar/calendar-context";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import InputColor from "@/components/ui/input-color";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  EmojiPicker,
  EmojiPickerContent,
  EmojiPickerFooter,
  EmojiPickerSearch,
} from "@/components/ui/emoji-picker";

import type { IEvent } from "@/lib/calendar/interfaces";
import type { TEventColor } from "@/lib/calendar/types";

interface IProps {
  children: React.ReactNode;
  event: IEvent;
}

export function EditEventDialog({ children, event }: IProps) {
  const tags = useQuery(api.tags.list, {});
  const createTag = useMutation(api.tags.create);
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

  const [showNewTag, setShowNewTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagEmoji, setNewTagEmoji] = useState("🏷️");
  const [newTagColor, setNewTagColor] = useState("#3b82f6");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

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
    setShowNewTag(false);
    setNewTagName("");
    setNewTagEmoji("🏷️");
    setNewTagColor("#3b82f6");
    setEmojiPickerOpen(false);
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

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    const tagId = await createTag({
      name: newTagName.trim(),
      color: newTagColor,
      emoji: newTagEmoji,
    });
    setSelectedTags([...selectedTags, tagId]);
    setNewTagName("");
    setNewTagEmoji("🏷️");
    setNewTagColor("#3b82f6");
    setShowNewTag(false);
  };

  const eventColors: Array<{ value: TEventColor; label: string; hex: string }> = [
    { value: "blue", label: "Blue", hex: "#3b82f6" },
    { value: "green", label: "Green", hex: "#22c55e" },
    { value: "red", label: "Red", hex: "#ef4444" },
    { value: "yellow", label: "Yellow", hex: "#eab308" },
    { value: "purple", label: "Purple", hex: "#a855f7" },
    { value: "orange", label: "Orange", hex: "#f97316" },
    { value: "gray", label: "Gray", hex: "#6b7280" },
  ];

  const daysOfWeekOptions = [
    { value: 0, label: "Sun" },
    { value: 1, label: "Mon" },
    { value: 2, label: "Tue" },
    { value: 3, label: "Wed" },
    { value: 4, label: "Thu" },
    { value: 5, label: "Fri" },
    { value: 6, label: "Sat" },
  ];

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
      prev.map(ev => {
        const sameSeries = ev.kind === "event" && ev.convexId && ev.convexId === event.convexId;
        if (!sameSeries) return ev;
        return {
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
        };
      })
    );

    setOpen(false);
  };

  const onDelete = async () => {
    if (event.kind && event.kind !== "event") return;
    if (!event.convexId) return;
    const ok = window.confirm("Delete this event?");
    if (!ok) return;
    await removeEventMutation({ id: event.convexId as Id<"events"> });
    setLocalEvents(prev => prev.filter(e => !(e.kind === "event" && e.convexId === event.convexId)));
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit</DialogTitle>
        </DialogHeader>

        {event.kind && event.kind !== "event" ? (
          <div className="py-4 text-sm text-muted-foreground">Tasks can’t be edited here.</div>
        ) : (
          <form id="event-edit" onSubmit={onSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" id="date" className="w-full justify-start text-left font-normal" type="button">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input id="duration" type="number" min="1" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} />
                            </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {eventColors.map((c) => (
                    <Badge
                      key={c.value}
                      variant={color === c.value ? "default" : "outline"}
                      className="cursor-pointer"
                      style={
                        color === c.value
                          ? { backgroundColor: c.hex, borderColor: c.hex }
                          : { borderColor: c.hex, color: c.hex }
                      }
                      onClick={() => setColor(c.value)}
                    >
                      {c.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Optional" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {(tags ?? []).map((tag) => (
                  <Badge
                    key={tag._id}
                    variant={selectedTags.includes(tag._id) ? "default" : "outline"}
                    className="cursor-pointer"
                    style={
                      selectedTags.includes(tag._id)
                        ? { backgroundColor: tag.color, borderColor: tag.color }
                        : { borderColor: tag.color, color: tag.color }
                    }
                    onClick={() => toggleTag(tag._id)}
                  >
                    <span className="mr-1">{tag.emoji}</span>
                    {tag.name}
                    {selectedTags.includes(tag._id) && <X className="w-3 h-3 ml-1" />}
                  </Badge>
                ))}

                <Popover open={showNewTag} onOpenChange={setShowNewTag}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" type="button">
                      <Plus className="w-3 h-3 mr-1" />
                      New Tag
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-96">
                    <div className="space-y-4">
                      <h4 className="font-medium">Create New Tag</h4>

                      <div className="space-y-2">
                        <Label htmlFor="tagName">Name</Label>
                        <Input id="tagName" value={newTagName} onChange={(e) => setNewTagName(e.target.value)} placeholder="e.g., Work" />
                          </div>

                      <div className="space-y-2">
                        <Label htmlFor="tagEmoji">Emoji</Label>
                        <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal" type="button">
                              <span className="text-2xl mr-2">{newTagEmoji}</span>
                              Choose emoji
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" align="start">
                            <EmojiPicker
                              onEmojiSelect={(emoji) => {
                                setNewTagEmoji(emoji.emoji);
                                setEmojiPickerOpen(false);
                              }}
                            >
                              <EmojiPickerSearch placeholder="Search emoji..." />
                              <EmojiPickerContent className="h-[300px]" />
                              <EmojiPickerFooter />
                            </EmojiPicker>
                          </PopoverContent>
                        </Popover>
                          </div>

                      <InputColor label="Color" value={newTagColor} onChange={setNewTagColor} onBlur={() => {}} className="mt-0" />

                      <Button onClick={handleCreateTag} className="w-full" type="button" disabled={!newTagName.trim()}>
                        Create Tag
                      </Button>
                          </div>
                  </PopoverContent>
                </Popover>
                          </div>
                          </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="recurring">Recurring Event</Label>
                  <p className="text-sm text-muted-foreground">Set this event to repeat on a schedule</p>
                          </div>
                <Switch id="recurring" checked={recurring} onCheckedChange={setRecurring} />
                          </div>

              {recurring && (
                <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="recurrenceType">Repeat</Label>
                      <Select value={recurrenceType} onValueChange={(value) => setRecurrenceType(value as any)}>
                        <SelectTrigger id="recurrenceType">
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

                    <div className="space-y-2">
                      <Label htmlFor="interval">Every</Label>
                      <Input id="interval" type="number" value={recurrenceInterval} onChange={(e) => setRecurrenceInterval(e.target.value)} min="1" placeholder="1" />
                    </div>
                  </div>

                  {recurrenceType === "weekly" && (
                    <div className="space-y-2">
                      <Label>Repeat on</Label>
                      <div className="flex gap-2 flex-wrap">
                        {daysOfWeekOptions.map((day) => (
                          <Button
                            key={day.value}
                            type="button"
                            variant={daysOfWeek.includes(day.value) ? "default" : "outline"}
                            size="sm"
                            className="w-12"
                            onClick={() => toggleDow(day.value)}
                          >
                            {day.label.slice(0, 1)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {recurrenceType === "monthly" && (
                    <div className="space-y-2">
                      <Label htmlFor="dayOfMonth">Day of Month</Label>
                      <Input id="dayOfMonth" type="number" value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} min="1" max="31" placeholder="1" />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date (Optional)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" id="endDate" className="w-full justify-start text-left font-normal" type="button">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {recurrenceEndDate ? format(recurrenceEndDate, "PPP") : <span>Never ends</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={recurrenceEndDate} onSelect={setRecurrenceEndDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                    {recurrenceEndDate && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setRecurrenceEndDate(undefined)} className="w-full">
                        Clear end date
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
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
