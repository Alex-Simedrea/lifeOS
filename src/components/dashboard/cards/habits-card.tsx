"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { Check, Target } from "lucide-react";

import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardCard } from "../dashboard-card";

type HabitSummary = {
  habit: Doc<"habits">;
  count: number;
  target: number;
  periodLabel: string;
  completed: boolean;
  todayCount: number;
};

export function HabitsCard({ className }: { className?: string }) {
  const todayStart = useMemo(() => startOfDay(Date.now()).getTime(), []);
  const todayEnd = useMemo(() => endOfDay(Date.now()).getTime(), []);
  const weekStart = useMemo(
    () => startOfWeek(Date.now(), { weekStartsOn: 1 }).getTime(),
    []
  );
  const weekEnd = useMemo(
    () => endOfWeek(Date.now(), { weekStartsOn: 1 }).getTime(),
    []
  );
  const monthStart = useMemo(() => startOfMonth(Date.now()).getTime(), []);
  const monthEnd = useMemo(() => endOfMonth(Date.now()).getTime(), []);

  const habits = useQuery(api.habits.list, { includeArchived: false });
  const habitCheckins = useQuery(api.habits.getAllCheckinsForPeriod, {
    startDate: monthStart,
    endDate: monthEnd,
  });
  const checkinHabit = useMutation(api.habits.checkin);

  const [checkingInHabitId, setCheckingInHabitId] =
    useState<Id<"habits"> | null>(null);

  const habitSummaries = useMemo<HabitSummary[]>(() => {
    if (!habits) return [];
    const map = new Map<string, number[]>();
    for (const checkin of habitCheckins ?? []) {
      const list = map.get(checkin.habitId) ?? [];
      list.push(checkin.timestamp);
      map.set(checkin.habitId, list);
    }

    return habits.map((habit) => {
      const timestamps = map.get(habit._id) ?? [];
      const todayCount = timestamps.filter(
        (ts) => ts >= todayStart && ts <= todayEnd
      ).length;
      const weekCount = timestamps.filter(
        (ts) => ts >= weekStart && ts <= weekEnd
      ).length;
      const monthCount = timestamps.length;
      const target = Math.max(1, habit.frequency.times);
      const period = habit.frequency.period;
      const count =
        period === "day"
          ? todayCount
          : period === "week"
            ? weekCount
            : monthCount;
      const periodLabel =
        period === "day"
          ? "today"
          : period === "week"
            ? "this week"
            : "this month";
      return {
        habit,
        count,
        target,
        periodLabel,
        completed: count >= target,
        todayCount,
      };
    });
  }, [habits, habitCheckins, todayStart, todayEnd, weekStart, weekEnd]);

  const totalHabitCheckinsToday = useMemo(
    () => habitSummaries.reduce((sum, habit) => sum + habit.todayCount, 0),
    [habitSummaries]
  );

  const topHabits = habitSummaries.slice(0, 3);

  const handleHabitCheckin = async (habitId: Id<"habits">) => {
    if (checkingInHabitId) return;
    setCheckingInHabitId(habitId);
    try {
      await checkinHabit({ habitId, timestamp: Date.now() });
    } finally {
      setCheckingInHabitId(null);
    }
  };

  return (
    <DashboardCard
      title="Habits"
      description="Daily check-ins and streaks"
      href="/habits"
      icon={Target}
      tone="bg-gradient-to-br from-emerald-50/70 via-background to-background dark:from-emerald-950/30 dark:via-background dark:to-background"
      iconBg="bg-emerald-100/70 dark:bg-emerald-500/20"
      iconTone="text-emerald-700 dark:text-emerald-200"
      className={className}
    >
      <div className="flex flex-wrap gap-2">
        <Badge className="bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-100">
          {habitSummaries.length} active
        </Badge>
        <Badge
          variant="outline"
          className="border-emerald-200/70 text-emerald-900 dark:border-emerald-500/40 dark:text-emerald-100"
        >
          {totalHabitCheckinsToday} check-ins today
        </Badge>
      </div>

      {habits === undefined ? (
        <p className="text-sm text-muted-foreground">Loading habits...</p>
      ) : topHabits.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No habits yet. Create one to track progress.
        </p>
      ) : (
        <div className="space-y-3">
          {topHabits.map(({ habit, count, target, periodLabel, completed }) => (
            <div
              key={habit._id}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-base"
                  style={{
                    backgroundColor: `${habit.color}20`,
                    color: habit.color,
                  }}
                >
                  {habit.emoji}
                </div>
                <div>
                  <p className="text-sm font-medium">{habit.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {count}/{target} {periodLabel}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant={completed ? "secondary" : "outline"}
                onClick={() => handleHabitCheckin(habit._id)}
                disabled={completed || checkingInHabitId === habit._id}
              >
                {completed ? "Done" : <Check className="h-4 w-4" />}
              </Button>
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  );
}
