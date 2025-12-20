"use client";

import { Check, Droplets } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

interface HydrationProgressProps {
  percentage: number;
  totalMl: number;
  dailyGoalMl: number;
}

export function HydrationProgress({
  percentage,
  totalMl,
  dailyGoalMl,
}: HydrationProgressProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="py-12">
        <div className="flex flex-col items-center">
          <div className="relative">
            <svg className="w-64 h-64 transform -rotate-90">
              <circle
                cx="128"
                cy="128"
                r="110"
                stroke="currentColor"
                strokeWidth="16"
                fill="none"
                className="text-muted"
              />
              <circle
                cx="128"
                cy="128"
                r="110"
                stroke="currentColor"
                strokeWidth="16"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 110}`}
                strokeDashoffset={`${2 * Math.PI * 110 * (1 - percentage / 100)}`}
                className="text-blue-500 transition-all duration-1000 ease-out"
                strokeLinecap="round"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Droplets className="h-12 w-12 text-blue-500 mb-2" />
              <div className="text-5xl font-bold text-blue-600">
                {Math.round(percentage)}%
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                {totalMl}ml / {dailyGoalMl}ml
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            {percentage >= 100 && (
              <div className="flex items-center gap-2 text-green-600 font-semibold">
                <Check className="h-5 w-5" />
                <span>Goal reached! Great job! 🎉</span>
              </div>
            )}
            {percentage >= 75 && percentage < 100 && (
              <p className="text-muted-foreground">
                Almost there! Keep going! 💪
              </p>
            )}
            {percentage >= 50 && percentage < 75 && (
              <p className="text-muted-foreground">
                You're halfway there! 🚀
              </p>
            )}
            {percentage < 50 && percentage > 0 && (
              <p className="text-muted-foreground">
                Good start! Keep sipping! 💧
              </p>
            )}
            {percentage === 0 && (
              <p className="text-muted-foreground">
                Time to hydrate! Let's get started! 💙
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

