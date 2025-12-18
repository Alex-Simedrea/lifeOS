"use client";

import { useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { format, startOfDay } from "date-fns";
import { Flame, Trophy } from "lucide-react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function HabitChipDialog({
  habitId,
  name,
  emoji,
  color,
  period,
  target,
  done,
  dateContext,
  children,
}: {
  habitId: Id<"habits">;
  name: string;
  emoji: string;
  color: string;
  period: "day" | "week" | "month";
  target: number;
  done: number;
  dateContext?: Date;
  children: React.ReactNode;
}) {
  const checkin = useMutation(api.habits.checkin);
  const streaks = useQuery(api.habits.getStreaks, { habitId });

  const canLog = done < Math.max(1, target);

  const logTimestamp = useMemo(() => {
    if (!dateContext) return undefined;
    const d = startOfDay(dateContext);
    d.setHours(12, 0, 0, 0);
    return d.getTime();
  }, [dateContext]);

  const headline = period === "day" ? "Daily habit" : period === "week" ? "Weekly habit" : "Monthly habit";
  const progressLabel =
    period === "day"
      ? dateContext
        ? format(dateContext, "EEE, MMM d")
        : "Today"
      : period === "week"
        ? "This week"
        : "This month";

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-xl">{emoji}</span>
            <span>{name}</span>
          </DialogTitle>
          <DialogDescription>{headline}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              style={{ borderColor: (color || "").toLowerCase(), color: (color || "").toLowerCase() }}
            >
              {target}× per {period}
            </Badge>
            <Badge variant="secondary">{progressLabel}</Badge>
          </div>

          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Progress</div>
              <div className="text-sm font-semibold">
                {done}/{Math.max(1, target)}
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (done / Math.max(1, target)) * 100)}%`,
                  backgroundColor: (color || "").toLowerCase(),
                }}
              />
            </div>
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-orange-500">
                  <Flame className="h-4 w-4" />
                  <span className="font-semibold">{streaks?.current ?? 0}</span>
                  <span className="text-xs text-muted-foreground">{period} streak</span>
                </div>
                <div className="flex items-center gap-1 text-amber-500">
                  <Trophy className="h-4 w-4" />
                  <span className="font-semibold">{streaks?.longest ?? 0}</span>
                  <span className="text-xs text-muted-foreground">best</span>
                </div>
              </div>

              <Button
                disabled={!canLog}
                onClick={() => checkin({ habitId, timestamp: logTimestamp })}
                style={canLog ? { backgroundColor: (color || "").toLowerCase() } : undefined}
                className={cn(canLog && "text-white hover:opacity-90")}
              >
                Log check-in
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


