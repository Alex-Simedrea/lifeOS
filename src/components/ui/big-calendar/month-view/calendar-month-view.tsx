import { useMemo } from "react";
import type { Id } from "../../../../../convex/_generated/dataModel";

import { useCalendar } from "@/components/calendar/calendar-context";

import { DayCell } from "@/components/ui/big-calendar/month-view/day-cell";
import { Badge } from "@/components/ui/badge";
import { HabitChipDialog } from "@/components/calendar/habit-chip-dialog";

import { getCalendarCells, calculateMonthEventPositions } from "@/lib/calendar/helpers";

import type { IEvent } from "@/lib/calendar/interfaces";

interface IProps {
  singleDayEvents: IEvent[];
  multiDayEvents: IEvent[];
  monthlyHabits?: null | Array<{
    habitId: Id<"habits">;
    name: string;
    emoji: string;
    color: string;
    done: number;
    target: number;
  }>;
}

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarMonthView({ singleDayEvents, multiDayEvents, monthlyHabits }: IProps) {
  const { selectedDate } = useCalendar();

  const allEvents = [...multiDayEvents, ...singleDayEvents];

  const cells = useMemo(() => getCalendarCells(selectedDate), [selectedDate]);

  const eventPositions = useMemo(
    () => calculateMonthEventPositions(multiDayEvents, singleDayEvents, selectedDate),
    [multiDayEvents, singleDayEvents, selectedDate]
  );

  return (
    <div>
      {monthlyHabits && monthlyHabits.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
          {monthlyHabits.map((h) => {
            const completed = h.done >= h.target;
            return (
              <HabitChipDialog
                key={h.habitId}
                habitId={h.habitId}
                name={h.name}
                emoji={h.emoji}
                color={h.color}
                period="month"
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
          <span className="ml-auto text-xs text-muted-foreground">Monthly habits</span>
        </div>
      )}
      <div className="grid grid-cols-7 divide-x">
        {WEEK_DAYS.map(day => (
          <div key={day} className="flex items-center justify-center py-2">
            <span className="text-xs font-medium text-muted-foreground">{day}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 overflow-hidden">
        {cells.map(cell => (
          <DayCell key={cell.date.toISOString()} cell={cell} events={allEvents} eventPositions={eventPositions} />
        ))}
      </div>
    </div>
  );
}
