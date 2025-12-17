"use client";

import { CalendarContent } from "@/components/calendar/calendar-content";

export default function CalendarPage() {
  return (
    <div>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground">View and manage your events and tasks</p>
            </div>
          </div>
          <CalendarContent view="month" />
        </div>
  );
}
