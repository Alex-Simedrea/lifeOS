"use client";

import { format } from "date-fns";
import { Check } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface WeeklyDay {
  date: number;
  percentage: number;
  goalMet: boolean;
}

interface WeeklyOverviewProps {
  weeklySummary: WeeklyDay[] | undefined;
  selectedDate: number;
  onDateSelect: (date: number) => void;
}

export function WeeklyOverview({
  weeklySummary,
  selectedDate,
  onDateSelect,
}: WeeklyOverviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Overview</CardTitle>
        <CardDescription>Last 7 days of hydration</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {(weeklySummary ?? []).map((day, index) => {
            const dayDate = new Date(day.date);
            const isSelected =
              dayDate.toDateString() === new Date(selectedDate).toDateString();

            return (
              <button
                key={index}
                onClick={() => onDateSelect(day.date)}
                className={cn(
                  "flex flex-col items-center p-3 rounded-lg border-2 transition-all hover:border-blue-500",
                  isSelected
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                    : "border-transparent"
                )}
              >
                <span className="text-xs text-muted-foreground mb-2">
                  {format(dayDate, "EEE")}
                </span>
                <div className="relative w-12 h-12 mb-2">
                  <svg className="w-12 h-12 transform -rotate-90">
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      className="text-muted"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 20}`}
                      strokeDashoffset={`${2 * Math.PI * 20 * (1 - day.percentage / 100)}`}
                      className={cn(
                        "transition-all",
                        day.goalMet ? "text-green-500" : "text-blue-500"
                      )}
                      strokeLinecap="round"
                    />
                  </svg>
                  {day.goalMet && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium">
                  {Math.round(day.percentage)}%
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

