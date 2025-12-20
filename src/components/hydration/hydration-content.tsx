"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

import { HydrationHeader } from "./hydration-header";
import { DateNavigationBanner } from "./date-navigation-banner";
import { HydrationProgress } from "./hydration-progress";
import { QuickAddSection } from "./quick-add-section";
import { HydrationStats } from "./hydration-stats";
import { WeeklyOverview } from "./weekly-overview";
import { DailyEntries } from "./daily-entries";
import { DeleteEntryDialog } from "./delete-entry-dialog";

export function HydrationContent() {
  const [selectedDate, setSelectedDate] = useState(Date.now());
  const [deleteEntryId, setDeleteEntryId] =
    useState<Id<"hydrationEntries"> | null>(null);

  const dailySummary = useQuery(api.hydration.getDailySummary, {
    date: selectedDate,
  });
  const streak = useQuery(api.hydration.getStreak);
  const weeklySummary = useQuery(api.hydration.getWeeklySummary);

  const addEntry = useMutation(api.hydration.addEntry);
  const removeEntry = useMutation(api.hydration.removeEntry);

  const handleQuickAdd = async (amount: number) => {
    await addEntry({ amountMl: amount, timestamp: selectedDate });
  };

  const handleCustomAdd = async (amount: number) => {
    await addEntry({ amountMl: amount, timestamp: selectedDate });
  };

  const handleDeleteEntry = () => {
    if (deleteEntryId) {
      removeEntry({ id: deleteEntryId });
      setDeleteEntryId(null);
    }
  };

  const isToday = useMemo(() => {
    const today = new Date();
    const selected = new Date(selectedDate);
    return (
      today.getFullYear() === selected.getFullYear() &&
      today.getMonth() === selected.getMonth() &&
      today.getDate() === selected.getDate()
    );
  }, [selectedDate]);

  const percentage = dailySummary?.percentage ?? 0;
  const totalMl = dailySummary?.totalMl ?? 0;
  const dailyGoalMl = dailySummary?.dailyGoalMl ?? 2000;

  return (
    <div>
      <HydrationHeader />

      <div className="px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {!isToday && (
            <DateNavigationBanner
              selectedDate={selectedDate}
              onBackToToday={() => setSelectedDate(Date.now())}
            />
          )}

          <HydrationProgress
            percentage={percentage}
            totalMl={totalMl}
            dailyGoalMl={dailyGoalMl}
          />

          <QuickAddSection
            onQuickAdd={handleQuickAdd}
            onCustomAdd={handleCustomAdd}
          />

          <HydrationStats streak={streak} />

          <WeeklyOverview
            weeklySummary={weeklySummary}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />

          <DailyEntries
            entries={dailySummary?.entries}
            isToday={isToday}
            onDelete={setDeleteEntryId}
          />
        </div>
      </div>

      <DeleteEntryDialog
        entryId={deleteEntryId}
        onOpenChange={(open) => !open && setDeleteEntryId(null)}
        onConfirm={handleDeleteEntry}
      />
    </div>
  );
}
