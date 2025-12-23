"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { format } from "date-fns";
import { Timer as TimerIcon } from "lucide-react";

import { api } from "../../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { DashboardCard } from "../dashboard-card";
import { formatDurationShort } from "../dashboard-utils";

export function TimersCard({ className }: { className?: string }) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 60000);
    return () => window.clearInterval(id);
  }, []);

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const timerHistory = useQuery(api.timers.listHistory, { limit: 5 });
  const timerTotals = useQuery(api.timers.totals, {
    startAt: todayStart,
    endAt: nowMs,
  });

  return (
    <DashboardCard
      title="Timers"
      description="Focus sessions and totals"
      href="/timers"
      icon={TimerIcon}
      tone="bg-gradient-to-br from-indigo-50/70 via-background to-background dark:from-indigo-950/30 dark:via-background dark:to-background"
      iconBg="bg-indigo-100/70 dark:bg-indigo-500/20"
      iconTone="text-indigo-700 dark:text-indigo-200"
      className={className}
    >
      {timerHistory === undefined || timerTotals === undefined ? (
        <p className="text-sm text-muted-foreground">Loading timers...</p>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-indigo-100 text-indigo-900 dark:bg-indigo-500/20 dark:text-indigo-100">
              Today {formatDurationShort(timerTotals?.totalDurationMs ?? 0)}
            </Badge>
          </div>

          {timerHistory && timerHistory.length > 0 ? (
            <div>
              <p className="text-sm font-medium capitalize">
                Last {timerHistory[0].type}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDurationShort(timerHistory[0].durationMs)} -{" "}
                {format(new Date(timerHistory[0].endedAt), "MMM d")}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No timer history yet.
            </p>
          )}
        </div>
      )}
    </DashboardCard>
  );
}
