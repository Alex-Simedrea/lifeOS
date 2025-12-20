"use client";

import { format } from "date-fns";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { WeeklySummaryDay } from "./types";

type WeeklyTrendsSectionProps = {
  weeklySummary: WeeklySummaryDay[];
  averageCalories: number;
  selectedDate: number;
  onSelectDate: (date: number) => void;
};

export function WeeklyTrendsSection({
  weeklySummary,
  averageCalories,
  selectedDate,
  onSelectDate,
}: WeeklyTrendsSectionProps) {
  const maxCalories = Math.max(
    ...weeklySummary.map((day) => day.calories || 0),
    1,
  );

  const peakDay = weeklySummary.reduce<WeeklySummaryDay | null>(
    (highest, day) =>
      highest === null || day.calories > highest.calories ? day : highest,
    null,
  );
  const lowDay = weeklySummary.reduce<WeeklySummaryDay | null>(
    (lowest, day) =>
      lowest === null || day.calories < lowest.calories ? day : lowest,
    null,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Trends</CardTitle>
        <CardDescription>
          Your nutrition over the last 7 days (Avg: {averageCalories} cal/day)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <MetricCard
              label="Average calories"
              value={`${averageCalories} cal`}
            />
            <MetricCard
              label="High day"
              value={peakDay ? `${Math.round(peakDay.calories)} cal` : "—"}
              detail={
                peakDay
                  ? format(new Date(peakDay.date), "EEE, MMM d")
                  : undefined
              }
            />
            <MetricCard
              label="Lightest day"
              value={lowDay ? `${Math.round(lowDay.calories)} cal` : "—"}
              detail={
                lowDay ? format(new Date(lowDay.date), "EEE, MMM d") : undefined
              }
            />
          </div>

          <div className="rounded-xl border bg-muted/40 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">
                  Calories past 7 days
                </p>
                <p className="text-lg font-semibold text-orange-600">
                  Peak {Math.round(maxCalories)} cal
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <LegendDot className="bg-orange-500" />
                Calories
                <LegendDot className="bg-blue-500" />
                Protein
                <LegendDot className="bg-yellow-500" />
                Carbs
                <LegendDot className="bg-purple-500" />
                Fat
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-7">
              {weeklySummary.map((day) => {
                const height = Math.max((day.calories / maxCalories) * 100, 8);
                const isSelected =
                  new Date(day.date).toDateString() ===
                  new Date(selectedDate).toDateString();
                return (
                  <button
                    type="button"
                    key={day.date}
                    onClick={() => onSelectDate(day.date)}
                    className={cn(
                      "group flex flex-col gap-2 rounded-lg border bg-background/80 p-3 text-left transition hover:border-orange-500 hover:shadow-sm",
                      isSelected &&
                        "border-orange-500 bg-orange-50 dark:bg-orange-950",
                    )}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>{format(new Date(day.date), "EEE")}</span>
                      <span className="text-muted-foreground">
                        {day.entries} entries
                      </span>
                    </div>
                    <div className="flex h-28 items-end gap-1">
                      <Bar
                        height={height}
                        className="bg-orange-500"
                        baseClass="bg-orange-200/70"
                      />
                      <Bar
                        height={Math.max((day.protein / 200) * 100, 6)}
                        className="bg-blue-500"
                        baseClass="bg-blue-100/70"
                      />
                      <Bar
                        height={Math.max((day.carbs / 300) * 100, 6)}
                        className="bg-yellow-500"
                        baseClass="bg-yellow-100/70"
                      />
                      <Bar
                        height={Math.max((day.fat / 120) * 100, 6)}
                        className="bg-purple-500"
                        baseClass="bg-purple-100/70"
                      />
                    </div>
                    <div className="text-sm font-semibold text-orange-600">
                      {Math.round(day.calories)} cal
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>Protein {Math.round(day.protein)}g</span>
                      <span>Carbs {Math.round(day.carbs)}g</span>
                      <span>Fat {Math.round(day.fat)}g</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
      {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
    </div>
  );
}

function LegendDot({ className }: { className: string }) {
  return <span className={cn("flex h-3 w-3 rounded-full", className)} />;
}

function Bar({
  height,
  className,
  baseClass,
}: {
  height: number;
  className: string;
  baseClass: string;
}) {
  return (
    <div className={cn("flex-1 rounded-full", baseClass)}>
      <div
        className={cn("w-full rounded-full transition-all", className)}
        style={{ height: `${height}%` }}
      />
    </div>
  );
}
