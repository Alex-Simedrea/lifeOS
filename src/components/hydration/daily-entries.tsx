"use client";

import { format } from "date-fns";
import { Droplets, Trash2 } from "lucide-react";

import type { Id } from "../../../convex/_generated/dataModel";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface HydrationEntry {
  _id: Id<"hydrationEntries">;
  amountMl: number;
  timestamp: number;
}

interface DailyEntriesProps {
  entries: HydrationEntry[] | undefined;
  isToday: boolean;
  onDelete: (id: Id<"hydrationEntries">) => void;
}

export function DailyEntries({
  entries,
  isToday,
  onDelete,
}: DailyEntriesProps) {
  if (!entries || entries.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isToday ? "Today's" : "Day's"} Entries</CardTitle>
        <CardDescription>{entries.length} entries logged</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry._id}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                  <Droplets className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <div className="font-semibold">{entry.amountMl}ml</div>
                  <div className="text-xs text-muted-foreground">
                    {format(entry.timestamp, "h:mm a")}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(entry._id)}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

