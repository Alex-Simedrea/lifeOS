import { startOfWeek, addDays, format, parseISO, isSameDay, areIntervalsOverlapping, startOfDay } from "date-fns";
import type { Id } from "../../../../../convex/_generated/dataModel";

import { useCalendar } from "@/components/calendar/calendar-context";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { HabitChipDialog } from "@/components/calendar/habit-chip-dialog";

import { AddEventDialog } from "@/components/ui/big-calendar/dialogs/add-event-dialog";
import { EventBlock } from "@/components/ui/big-calendar/week-and-day-view/event-block";
import { DroppableTimeBlock } from "@/components/ui/big-calendar/dnd/droppable-time-block";
import { CalendarTimeline } from "@/components/ui/big-calendar/week-and-day-view/calendar-time-line";
import { WeekViewMultiDayEventsRow } from "@/components/ui/big-calendar/week-and-day-view/week-view-multi-day-events-row";

import { cn } from "@/lib/utils";
import { groupEvents, getEventBlockStyle, isWorkingHour, getVisibleHours } from "@/lib/calendar/helpers";

import type { IEvent } from "@/lib/calendar/interfaces";

interface IProps {
  singleDayEvents: IEvent[];
  multiDayEvents: IEvent[];
  dailyHabitsByDay?: null | Array<{
    date: Date;
    habits: Array<{
      habitId: Id<"habits">;
      name: string;
      emoji: string;
      color: string;
      done: number;
      target: number;
    }>;
  }>;
  weeklyHabits?: null | Array<{
    habitId: Id<"habits">;
    name: string;
    emoji: string;
    color: string;
    done: number;
    target: number;
  }>;
}

export function CalendarWeekView({ singleDayEvents, multiDayEvents, dailyHabitsByDay, weeklyHabits }: IProps) {
  const { selectedDate, workingHours, visibleHours } = useCalendar();

  const { hours, earliestEventHour, latestEventHour } = getVisibleHours(visibleHours, singleDayEvents);

  const weekStart = startOfWeek(selectedDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <>
      <div className="flex flex-col items-center justify-center border-b py-4 text-sm text-muted-foreground sm:hidden">
        <p>Weekly view is not available on smaller devices.</p>
        <p>Please switch to month or agenda view.</p>
      </div>

      <div className="hidden h-full flex-col sm:flex">
        <div>
          {weeklyHabits && weeklyHabits.length > 0 && (
            <div className="flex items-center justify-between gap-3 border-b px-4 py-2">
              <div className="flex flex-wrap items-center gap-2">
                {weeklyHabits.map((h) => {
                  const completed = h.done >= h.target;
                  return (
                    <HabitChipDialog
                      key={h.habitId}
                      habitId={h.habitId}
                      name={h.name}
                      emoji={h.emoji}
                      color={h.color}
                      period="week"
                      target={h.target}
                      done={h.done}
                    >
                      <Badge
                        variant={completed ? "default" : "outline"}
                        className="gap-2 cursor-pointer"
                        style={
                          completed
                            ? { backgroundColor: (h.color || "").toLowerCase(), borderColor: (h.color || "").toLowerCase() }
                            : { borderColor: (h.color || "").toLowerCase(), color: (h.color || "").toLowerCase() }
                        }
                      >
                        <span>{h.emoji}</span>
                        <span className="font-semibold">{h.name}</span>
                        <span className={completed ? "text-white/80" : "text-muted-foreground"}>
                          {h.done}/{h.target}
                        </span>
                      </Badge>
                    </HabitChipDialog>
                  );
                })}
              </div>
              <div className="text-xs text-muted-foreground">Weekly habits</div>
            </div>
          )}

          <WeekViewMultiDayEventsRow selectedDate={selectedDate} multiDayEvents={multiDayEvents} />

          <div className="relative z-20 flex border-b">
            <div className="w-18"></div>
            <div className="grid flex-1 grid-cols-7 divide-x border-l">
              {weekDays.map((day, index) => (
                <span key={index} className="py-2 text-center text-xs font-medium text-muted-foreground">
                  {format(day, "EE")} <span className="ml-1 font-semibold text-foreground">{format(day, "d")}</span>
                </span>
              ))}
            </div>
          </div>

          {dailyHabitsByDay && dailyHabitsByDay.length === 7 && (
            <div className="relative z-20 flex border-b">
              <div className="w-18"></div>
              <div className="grid flex-1 grid-cols-7 divide-x border-l bg-muted/20">
                {dailyHabitsByDay.map((d) => {
                  const dayStart = startOfDay(d.date).getTime();
                  const items = d.habits.filter((h) => h.done > 0 || h.target > 0).slice(0, 3);
                  return (
                    <div key={dayStart} className="flex min-h-10 flex-col gap-1 px-2 py-2">
                      <div className="flex flex-wrap gap-1">
                        {items.map((h) => {
                          const completed = h.done >= h.target;
                          return (
                            <HabitChipDialog
                              key={h.habitId}
                              habitId={h.habitId}
                              name={h.name}
                              emoji={h.emoji}
                              color={h.color}
                              period="day"
                              target={h.target}
                              done={h.done}
                              dateContext={d.date}
                            >
                              <Badge
                                variant={completed ? "default" : "secondary"}
                                className="px-2 py-0.5 text-[10px] gap-1"
                                style={completed ? { backgroundColor: (h.color || "").toLowerCase(), borderColor: (h.color || "").toLowerCase() } : undefined}
                              >
                                <span>{h.emoji}</span>
                                <span className="font-semibold">{h.done}/{h.target}</span>
                              </Badge>
                            </HabitChipDialog>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <ScrollArea className="min-h-0 flex-1" type="always">
          <div className="flex overflow-hidden">
            <div className="relative w-18">
              {hours.map((hour, index) => (
                <div key={hour} className="relative" style={{ height: "96px" }}>
                  <div className="absolute -top-3 right-2 flex h-6 items-center">
                    {index !== 0 && <span className="text-xs text-muted-foreground">{format(new Date().setHours(hour, 0, 0, 0), "hh a")}</span>}
                  </div>
                </div>
              ))}
            </div>

            <div className="relative flex-1 border-l">
              <div className="grid grid-cols-7 divide-x">
                {weekDays.map((day, dayIndex) => {
                  const dayEvents = singleDayEvents.filter(event => isSameDay(parseISO(event.startDate), day) || isSameDay(parseISO(event.endDate), day));
                  const groupedEvents = groupEvents(dayEvents);

                  return (
                    <div key={dayIndex} className="relative">
                      {hours.map((hour, index) => {
                        const isDisabled = !isWorkingHour(day, hour, workingHours);

                        return (
                          <div key={hour} className={cn("relative", isDisabled && "bg-calendar-disabled-hour")} style={{ height: "96px" }}>
                            {index !== 0 && <div className="pointer-events-none absolute inset-x-0 top-0 border-b"></div>}

                            <DroppableTimeBlock date={day} hour={hour} minute={0}>
                              <AddEventDialog startDate={day} startTime={{ hour, minute: 0 }}>
                                <div className="absolute inset-x-0 top-0 h-[24px] cursor-pointer transition-colors hover:bg-accent" />
                              </AddEventDialog>
                            </DroppableTimeBlock>

                            <DroppableTimeBlock date={day} hour={hour} minute={15}>
                              <AddEventDialog startDate={day} startTime={{ hour, minute: 15 }}>
                                <div className="absolute inset-x-0 top-[24px] h-[24px] cursor-pointer transition-colors hover:bg-accent" />
                              </AddEventDialog>
                            </DroppableTimeBlock>

                            <div className="pointer-events-none absolute inset-x-0 top-1/2 border-b border-dashed"></div>

                            <DroppableTimeBlock date={day} hour={hour} minute={30}>
                              <AddEventDialog startDate={day} startTime={{ hour, minute: 30 }}>
                                <div className="absolute inset-x-0 top-[48px] h-[24px] cursor-pointer transition-colors hover:bg-accent" />
                              </AddEventDialog>
                            </DroppableTimeBlock>

                            <DroppableTimeBlock date={day} hour={hour} minute={45}>
                              <AddEventDialog startDate={day} startTime={{ hour, minute: 45 }}>
                                <div className="absolute inset-x-0 top-[72px] h-[24px] cursor-pointer transition-colors hover:bg-accent" />
                              </AddEventDialog>
                            </DroppableTimeBlock>
                          </div>
                        );
                      })}

                      {groupedEvents.map((group, groupIndex) =>
                        group.map(event => {
                          let style = getEventBlockStyle(event, day, groupIndex, groupedEvents.length, { from: earliestEventHour, to: latestEventHour });
                          const hasOverlap = groupedEvents.some(
                            (otherGroup, otherIndex) =>
                              otherIndex !== groupIndex &&
                              otherGroup.some(otherEvent =>
                                areIntervalsOverlapping(
                                  { start: parseISO(event.startDate), end: parseISO(event.endDate) },
                                  { start: parseISO(otherEvent.startDate), end: parseISO(otherEvent.endDate) }
                                )
                              )
                          );

                          if (!hasOverlap) style = { ...style, width: "100%", left: "0%" };

                          return (
                            <div key={event.id} className="absolute p-1" style={style}>
                              <EventBlock event={event} />
                            </div>
                          );
                        })
                      )}
                    </div>
                  );
                })}
              </div>

              <CalendarTimeline firstVisibleHour={earliestEventHour} lastVisibleHour={latestEventHour} />
            </div>
          </div>
        </ScrollArea>
      </div>
    </>
  );
}
