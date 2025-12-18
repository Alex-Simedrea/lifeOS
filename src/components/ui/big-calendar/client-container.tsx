"use client";

import { useMemo } from "react";
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  differenceInCalendarWeeks,
  differenceInCalendarYears,
  endOfMonth,
  endOfWeek,
  endOfYear,
  getDaysInMonth,
  isSameDay,
  min as dateMin,
  parseISO,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";

import { useCalendar } from "@/components/calendar/calendar-context";

import { DndProviderWrapper } from "@/components/ui/big-calendar/dnd/dnd-provider";

import { CalendarHeader } from "@/components/ui/big-calendar/header/calendar-header";
import { CalendarYearView } from "@/components/ui/big-calendar/year-view/calendar-year-view";
import { CalendarMonthView } from "@/components/ui/big-calendar/month-view/calendar-month-view";
import { CalendarAgendaView } from "@/components/ui/big-calendar/agenda-view/calendar-agenda-view";
import { CalendarWeekView } from "@/components/ui/big-calendar/week-and-day-view/calendar-week-view";

import type { TCalendarView } from "@/lib/calendar/types";

interface IProps {
  view: TCalendarView;
  dailyHabitsByDay?: null | Array<{
    date: Date;
    habits: Array<{
      habitId: any;
      name: string;
      emoji: string;
      color: string;
      done: number;
      target: number;
    }>;
  }>;
  weeklyHabits?: null | Array<{
    habitId: any;
    name: string;
    emoji: string;
    color: string;
    done: number;
    target: number;
  }>;
  monthlyHabits?: null | Array<{
    habitId: any;
    name: string;
    emoji: string;
    color: string;
    done: number;
    target: number;
  }>;
}

function makeOccurrenceId(baseId: number, start: Date) {
  const n = baseId * 1000003 + start.getTime();
  return Math.abs(n % Number.MAX_SAFE_INTEGER);
}

function expandRecurring(events: ReturnType<typeof useCalendar>["events"], rangeStart: Date, rangeEnd: Date) {
  const expanded: typeof events = [];

  for (const event of events) {
    expanded.push(event);

    const rec = event.recurrence;
    if (!rec) continue;

    const baseStart = parseISO(event.startDate);
    const baseEnd = parseISO(event.endDate);
    const durationMs = baseEnd.getTime() - baseStart.getTime();
    const interval = Math.max(1, rec.interval || 1);
    const recurrenceEnd = rec.endDate ? new Date(rec.endDate) : rangeEnd;
    const until = dateMin([rangeEnd, recurrenceEnd]);

    const baseH = baseStart.getHours();
    const baseM = baseStart.getMinutes();
    const baseS = baseStart.getSeconds();
    const baseMs = baseStart.getMilliseconds();

    const pushIfInRange = (occStart: Date) => {
      if (occStart.getTime() === baseStart.getTime()) return;
      if (occStart < baseStart) return;
      const occEnd = new Date(occStart.getTime() + durationMs);
      if (occEnd < rangeStart || occStart > rangeEnd) return;
      expanded.push({
        ...event,
        id: makeOccurrenceId(+event.id, occStart),
        seriesStartDate: event.seriesStartDate ?? event.startDate,
        seriesEndDate: event.seriesEndDate ?? event.endDate,
        startDate: occStart.toISOString(),
        endDate: occEnd.toISOString(),
        isRecurrenceInstance: true,
      });
    };

    if (rec.type === "daily") {
      const daysDiff = differenceInCalendarDays(rangeStart, baseStart);
      const step = Math.floor(daysDiff / interval) * interval;
      let cursor = addDays(baseStart, step);
      if (cursor < baseStart) cursor = baseStart;
      for (; cursor <= until; cursor = addDays(cursor, interval)) {
        const occStart = new Date(cursor);
        occStart.setHours(baseH, baseM, baseS, baseMs);
        pushIfInRange(occStart);
      }
      continue;
    }

    if (rec.type === "weekly") {
      const days = rec.daysOfWeek && rec.daysOfWeek.length > 0 ? rec.daysOfWeek : [baseStart.getDay()];
      const baseWeekStart = startOfWeek(baseStart);
      const weeksDiff = differenceInCalendarWeeks(rangeStart, baseWeekStart);
      const step = Math.floor(weeksDiff / interval) * interval;
      let weekCursor = addWeeks(baseWeekStart, step);
      if (weekCursor < baseWeekStart) weekCursor = baseWeekStart;

      for (; weekCursor <= until; weekCursor = addWeeks(weekCursor, interval)) {
        for (const dow of days) {
          const occStart = addDays(startOfWeek(weekCursor), dow);
          occStart.setHours(baseH, baseM, baseS, baseMs);
          pushIfInRange(occStart);
        }
      }
      continue;
    }

    if (rec.type === "monthly") {
      const dom = rec.dayOfMonth ?? baseStart.getDate();
      const baseMonthStart = startOfMonth(baseStart);
      const monthsDiff = differenceInCalendarMonths(rangeStart, baseMonthStart);
      const step = Math.floor(monthsDiff / interval) * interval;
      let monthCursor = addMonths(baseMonthStart, step);
      if (monthCursor < baseMonthStart) monthCursor = baseMonthStart;

      for (; monthCursor <= until; monthCursor = addMonths(monthCursor, interval)) {
        const maxDay = getDaysInMonth(monthCursor);
        const day = Math.max(1, Math.min(dom, maxDay));
        const occStart = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), day, baseH, baseM, baseS, baseMs);
        pushIfInRange(occStart);
      }
      continue;
    }

    if (rec.type === "yearly") {
      const baseYearStart = startOfYear(baseStart);
      const yearsDiff = differenceInCalendarYears(rangeStart, baseYearStart);
      const step = Math.floor(yearsDiff / interval) * interval;
      let yearCursor = addYears(baseYearStart, step);
      if (yearCursor < baseYearStart) yearCursor = baseYearStart;

      const month = baseStart.getMonth();
      const dom = rec.dayOfMonth ?? baseStart.getDate();

      for (; yearCursor <= until; yearCursor = addYears(yearCursor, interval)) {
        const tmp = new Date(yearCursor.getFullYear(), month, 1);
        const maxDay = getDaysInMonth(tmp);
        const day = Math.max(1, Math.min(dom, maxDay));
        const occStart = new Date(yearCursor.getFullYear(), month, day, baseH, baseM, baseS, baseMs);
        pushIfInRange(occStart);
      }
    }
  }

  return expanded;
}

export function ClientContainer({ view, dailyHabitsByDay, weeklyHabits, monthlyHabits }: IProps) {
  const { selectedDate, selectedUserId, events } = useCalendar();

  const range = useMemo(() => {
    if (view === "year") return { start: startOfYear(selectedDate), end: endOfYear(selectedDate) };
    if (view === "month" || view === "agenda") return { start: startOfMonth(selectedDate), end: endOfMonth(selectedDate) };
    return { start: startOfWeek(selectedDate), end: endOfWeek(selectedDate) };
  }, [selectedDate, view]);

  const expandedEvents = useMemo(() => expandRecurring(events, range.start, range.end), [events, range.start, range.end]);

  const filteredEvents = useMemo(() => {
    return expandedEvents.filter(event => {
      const eventStartDate = parseISO(event.startDate);
      const eventEndDate = parseISO(event.endDate);

      if (view === "year") {
        const yearStart = new Date(selectedDate.getFullYear(), 0, 1);
        const yearEnd = new Date(selectedDate.getFullYear(), 11, 31, 23, 59, 59, 999);
        const isInSelectedYear = eventStartDate <= yearEnd && eventEndDate >= yearStart;
        const isUserMatch = selectedUserId === "all" || event.user.id === selectedUserId;
        return isInSelectedYear && isUserMatch;
      }

      if (view === "month" || view === "agenda") {
        const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59, 999);
        const isInSelectedMonth = eventStartDate <= monthEnd && eventEndDate >= monthStart;
        const isUserMatch = selectedUserId === "all" || event.user.id === selectedUserId;
        return isInSelectedMonth && isUserMatch;
      }

      if (view === "week") {
        const dayOfWeek = selectedDate.getDay();

        const weekStart = new Date(selectedDate);
        weekStart.setDate(selectedDate.getDate() - dayOfWeek);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const isInSelectedWeek = eventStartDate <= weekEnd && eventEndDate >= weekStart;
        const isUserMatch = selectedUserId === "all" || event.user.id === selectedUserId;
        return isInSelectedWeek && isUserMatch;
      }
    });
  }, [selectedDate, selectedUserId, expandedEvents, view]);

  const singleDayEvents = filteredEvents.filter(event => {
    const startDate = parseISO(event.startDate);
    const endDate = parseISO(event.endDate);
    return isSameDay(startDate, endDate);
  });

  const multiDayEvents = filteredEvents.filter(event => {
    const startDate = parseISO(event.startDate);
    const endDate = parseISO(event.endDate);
    return !isSameDay(startDate, endDate);
  });

  const eventStartDates = useMemo(() => {
    return filteredEvents.map(event => ({ ...event, endDate: event.startDate }));
  }, [filteredEvents]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border">
      <CalendarHeader view={view} events={filteredEvents} />

      <div className="min-h-0 flex-1">
      <DndProviderWrapper>
          <div className="h-full overflow-auto">
        {view === "month" && <CalendarMonthView singleDayEvents={singleDayEvents} multiDayEvents={multiDayEvents} monthlyHabits={monthlyHabits ?? null} />}
        {view === "week" && (
          <CalendarWeekView
            singleDayEvents={singleDayEvents.filter(e => e.kind !== "habit")}
            multiDayEvents={multiDayEvents}
            dailyHabitsByDay={dailyHabitsByDay ?? null}
            weeklyHabits={weeklyHabits ?? null}
          />
        )}
        {view === "year" && <CalendarYearView allEvents={eventStartDates} />}
        {view === "agenda" && <CalendarAgendaView singleDayEvents={singleDayEvents} multiDayEvents={multiDayEvents} />}
          </div>
      </DndProviderWrapper>
      </div>
    </div>
  );
}
