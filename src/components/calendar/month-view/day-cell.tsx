import { useMemo } from "react";
import { isToday, startOfDay } from "date-fns";

import { useCalendar } from "@/lib/calendar/calendar-context";
import { MonthItemBadge } from "./month-item-badge";

import { cn } from "@/lib/utils";
import { getMonthCellItems } from "@/lib/calendar/helpers";

import type { ICalendarCell, ICalendarItem } from "@/lib/calendar/interfaces";

interface IProps {
  cell: ICalendarCell;
  items: ICalendarItem[];
  itemPositions: Record<string, number>;
}

const MAX_VISIBLE_ITEMS = 3;

export function DayCell({ cell, items, itemPositions }: IProps) {
  const { setSelectedDate, setView } = useCalendar();

  const { day, currentMonth, date } = cell;

  const cellItems = useMemo(
    () => getMonthCellItems(date, items, itemPositions),
    [date, items, itemPositions]
  );
  const isSunday = date.getDay() === 0;

  const handleClick = () => {
    setSelectedDate(date);
    setView("day");
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col gap-1 border-l border-t py-1.5 lg:pb-2 lg:pt-1",
        isSunday && "border-l-0"
      )}
    >
      <button
        onClick={handleClick}
        className={cn(
          "flex size-6 translate-x-1 items-center justify-center rounded-full text-xs font-semibold hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring lg:px-2",
          !currentMonth && "opacity-20",
          isToday(date) && "bg-primary font-bold text-primary-foreground hover:bg-primary"
        )}
      >
        {day}
      </button>

      <div
        className={cn(
          "flex h-6 gap-1 px-2 lg:h-[94px] lg:flex-col lg:gap-2 lg:px-0",
          !currentMonth && "opacity-50"
        )}
      >
        {[0, 1, 2].map((position) => {
          const item = cellItems.find((e) => e.position === position);
          const itemKey = item ? `item-${item.id}-${position}` : `empty-${position}`;

          return (
            <div key={itemKey} className="lg:flex-1">
              {item && <MonthItemBadge className="hidden lg:flex" item={item} cellDate={startOfDay(date)} />}
            </div>
          );
        })}
      </div>

      {cellItems.length > MAX_VISIBLE_ITEMS && (
        <p
          className={cn(
            "h-4.5 px-1.5 text-xs font-semibold text-muted-foreground",
            !currentMonth && "opacity-50"
          )}
        >
          <span className="sm:hidden">+{cellItems.length - MAX_VISIBLE_ITEMS}</span>
          <span className="hidden sm:inline"> {cellItems.length - MAX_VISIBLE_ITEMS} more...</span>
        </p>
      )}
    </div>
  );
}
