"use client";

import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface DateNavigationBannerProps {
  selectedDate: number;
  onBackToToday: () => void;
}

export function DateNavigationBanner({
  selectedDate,
  onBackToToday,
}: DateNavigationBannerProps) {
  return (
    <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
      <CardContent className="py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium">
            Viewing: {format(selectedDate, "MMMM d, yyyy")}
          </span>
        </div>
        <Button size="sm" variant="outline" onClick={onBackToToday}>
          Back to Today
        </Button>
      </CardContent>
    </Card>
  );
}

