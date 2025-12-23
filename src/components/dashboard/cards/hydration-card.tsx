"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { Droplets } from "lucide-react";

import { api } from "../../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardCard } from "../dashboard-card";

export function HydrationCard({ className }: { className?: string }) {
  const summaryDate = useMemo(() => Date.now(), []);

  const hydrationSummary = useQuery(api.hydration.getDailySummary, {
    date: summaryDate,
  });
  const hydrationSettings = useQuery(api.hydration.getSettings);
  const hydrationStreak = useQuery(api.hydration.getStreak);
  const addHydrationEntry = useMutation(api.hydration.addEntry);

  const [customWaterMl, setCustomWaterMl] = useState("");
  const [isLoggingWater, setIsLoggingWater] = useState(false);

  const hydrationEntries = hydrationSummary?.entries ?? [];
  const hydrationLastEntry = hydrationEntries[0];
  const hydrationLastLog = hydrationLastEntry
    ? formatDistanceToNow(new Date(hydrationLastEntry.timestamp), {
        addSuffix: true,
      })
    : "No logs yet";

  const handleQuickWater = async (amount: number) => {
    if (isLoggingWater) return;
    setIsLoggingWater(true);
    try {
      await addHydrationEntry({ amountMl: amount, timestamp: Date.now() });
    } finally {
      setIsLoggingWater(false);
    }
  };

  const handleCustomWater = async (event: FormEvent) => {
    event.preventDefault();
    const amount = Number.parseInt(customWaterMl, 10);
    if (!Number.isFinite(amount) || amount <= 0 || isLoggingWater) return;
    setIsLoggingWater(true);
    try {
      await addHydrationEntry({ amountMl: amount, timestamp: Date.now() });
      setCustomWaterMl("");
    } finally {
      setIsLoggingWater(false);
    }
  };

  return (
    <DashboardCard
      title="Hydration"
      description="Daily goal progress"
      href="/hydration"
      icon={Droplets}
      tone="bg-gradient-to-br from-cyan-50/70 via-background to-background dark:from-cyan-950/30 dark:via-background dark:to-background"
      iconBg="bg-cyan-100/70 dark:bg-cyan-500/20"
      iconTone="text-cyan-700 dark:text-cyan-200"
      className={className}
      contentClassName="space-y-3"
    >
      {hydrationSummary === undefined ? (
        <p className="text-sm text-muted-foreground">Loading hydration...</p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                {hydrationSummary?.totalMl ?? 0} ml logged
              </p>
              <p className="text-xs text-muted-foreground">
                Goal {hydrationSummary?.dailyGoalMl ?? 2000} ml
              </p>
            </div>
            <Badge
              variant="outline"
              className="border-cyan-200/70 text-cyan-900 dark:border-cyan-500/40 dark:text-cyan-100"
            >
              {Math.round(hydrationSummary?.percentage ?? 0)}%
            </Badge>
          </div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-blue-500 transition-all"
              style={{ width: `${hydrationSummary?.percentage ?? 0}%` }}
            />
          </div>
          {hydrationStreak && (
            <Badge className="bg-cyan-100 text-cyan-900 dark:bg-cyan-500/20 dark:text-cyan-100">
              {hydrationStreak.current} day streak
            </Badge>
          )}
        </div>
      )}

      <div className="pt-4 space-y-2">
        <h3 className="text-sm font-medium">Quick Add</h3>
        <div className="flex flex-wrap gap-2">
          {(hydrationSettings?.bottlePresets ?? [250, 500, 750]).map((amount) => (
            <Button
              key={amount}
              size="sm"
              variant="outline"
              onClick={() => handleQuickWater(amount)}
              disabled={isLoggingWater}
            >
              {amount}ml
            </Button>
          ))}
        </div>
      </div>
    </DashboardCard>
  );
}
