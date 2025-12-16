import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

import { UserSelect } from "@/components/ui/big-calendar/header/user-select";
import { TodayButton } from "@/components/ui/big-calendar/header/today-button";
import { DateNavigator } from "@/components/ui/big-calendar/header/date-navigator";
import { AddEventDialog } from "@/components/ui/big-calendar/dialogs/add-event-dialog";

import type { IEvent } from "@/lib/calendar/interfaces";
import type { TCalendarView } from "@/lib/calendar/types";

interface IProps {
  view: TCalendarView;
  events: IEvent[];
}

export function CalendarHeader({ view, events }: IProps) {
  return (
    <div className="flex flex-col gap-4 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3">
        <TodayButton />
        <DateNavigator view={view} events={events} />
      </div>

      <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:justify-between">
        <AddEventDialog>
          <Button className="w-full sm:w-auto">
            <Plus />
            Add Event
          </Button>
        </AddEventDialog>
      </div>
    </div>
  );
}
