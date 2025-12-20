"use client";

import { Flame, Trophy, TrendingUp } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

interface HydrationStreak {
  current?: number;
  longest?: number;
  totalDays?: number;
}

interface HydrationStatsProps {
  streak: HydrationStreak | undefined;
}

export function HydrationStats({ streak }: HydrationStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
              <Flame className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <div className="text-3xl font-bold">{streak?.current ?? 0}</div>
              <p className="text-sm text-muted-foreground">Day Streak</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
              <Trophy className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <div className="text-3xl font-bold">{streak?.longest ?? 0}</div>
              <p className="text-sm text-muted-foreground">Best Streak</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <div className="text-3xl font-bold">{streak?.totalDays ?? 0}</div>
              <p className="text-sm text-muted-foreground">Total Days</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

