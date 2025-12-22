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
  const totalCalories = weeklySummary.reduce(
    (sum, day) => sum + day.calories,
    0,
  );
  const totalEntries = weeklySummary.reduce((sum, day) => sum + day.entries, 0);
  const avgProtein = averageOf(weeklySummary.map((day) => day.protein));
  const avgCarbs = averageOf(weeklySummary.map((day) => day.carbs));
  const avgFat = averageOf(weeklySummary.map((day) => day.fat));

  const maxCalories = Math.max(
    ...weeklySummary.map((day) => day.calories || 0),
    1,
  );
  const selectedIndex = weeklySummary.findIndex(
    (day) =>
      new Date(day.date).toDateString() ===
      new Date(selectedDate).toDateString(),
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Food Analytics</h2>
        <p className="text-sm text-muted-foreground">
          Seven-day snapshot of calories and macros
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Day-by-day summary</CardTitle>
          <CardDescription>Pick a day to review meals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-7">
            {weeklySummary.map((day) => {
              const isSelected =
                new Date(day.date).toDateString() ===
                new Date(selectedDate).toDateString();
              return (
                <button
                  type="button"
                  key={day.date}
                  onClick={() => onSelectDate(day.date)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-left text-xs transition",
                    isSelected
                      ? "border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-950"
                      : "border-muted bg-background hover:border-orange-400",
                  )}
                >
                  <div className="font-semibold">
                    {format(new Date(day.date), "EEE")}
                  </div>
                  <div className="text-muted-foreground">
                    {Math.round(day.calories)} cal
                  </div>
                  <div className="text-muted-foreground">
                    {day.entries} entries
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weekly summary</CardTitle>
            <CardDescription>Calories + entries</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <StatRow
              label="Total calories"
              value={`${Math.round(totalCalories)} cal`}
            />
            <StatRow label="Average/day" value={`${averageCalories} cal`} />
            <StatRow label="Entries logged" value={`${totalEntries}`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Calorie trend</CardTitle>
            <CardDescription>Last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <TrendChart
              values={weeklySummary.map((day) => day.calories)}
              selectedIndex={selectedIndex}
            />
            <p className="text-xs text-muted-foreground">
              Peak {Math.round(maxCalories)} cal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Macro averages</CardTitle>
            <CardDescription>Per day, grams</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <MacroBar
              label="Protein"
              value={avgProtein}
              color="bg-blue-500"
              max={200}
            />
            <MacroBar
              label="Carbs"
              value={avgCarbs}
              color="bg-yellow-500"
              max={300}
            />
            <MacroBar
              label="Fat"
              value={avgFat}
              color="bg-purple-500"
              max={120}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

function MacroBar({
  label,
  value,
  color,
  max,
}: {
  label: string;
  value: number;
  color: string;
  max: number;
}) {
  const width = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{Math.round(value)}g</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", color)}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function TrendChart({
  values,
  selectedIndex,
}: {
  values: number[];
  selectedIndex: number;
}) {
  const width = 360;
  const height = 120;
  const padding = 12;
  const max = Math.max(...values, 1);
  const step =
    values.length > 1 ? (width - padding * 2) / (values.length - 1) : 0;

  const points = values.map((value, index) => {
    const x = padding + index * step;
    const y = height - padding - (value / max) * (height - padding * 2);
    return { x, y };
  });

  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-24 w-full"
      role="img"
      aria-label="Weekly calories trend"
    >
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-orange-500"
      />
      {points.map((point, index) => (
        <circle
          key={`${point.x}-${point.y}`}
          cx={point.x}
          cy={point.y}
          r={selectedIndex === index ? 4 : 2.5}
          className={cn(
            "text-orange-500",
            selectedIndex === index ? "fill-orange-500" : "fill-orange-400/70",
          )}
        />
      ))}
    </svg>
  );
}

function averageOf(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
