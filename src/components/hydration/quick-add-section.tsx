"use client";

import { useQuery } from "convex/react";
import { Droplets } from "lucide-react";

import { api } from "../../../convex/_generated/api";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CustomAmountDialog } from "./custom-amount-dialog";

interface QuickAddSectionProps {
  onQuickAdd: (amount: number) => Promise<void>;
  onCustomAdd: (amount: number) => Promise<void>;
}

export function QuickAddSection({
  onQuickAdd,
  onCustomAdd,
}: QuickAddSectionProps) {
  const settings = useQuery(api.hydration.getSettings);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Add</CardTitle>
        <CardDescription>Tap to log your water intake</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(settings?.bottlePresets ?? [250, 500, 750, 1000]).map((amount) => (
            <Button
              key={amount}
              variant="outline"
              size="lg"
              onClick={() => onQuickAdd(amount)}
              className="h-20 flex-col gap-1 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600 dark:hover:bg-blue-950"
            >
              <Droplets className="h-6 w-6" />
              <span className="font-bold">{amount}ml</span>
            </Button>
          ))}
        </div>
        <CustomAmountDialog onAdd={onCustomAdd} />
      </CardContent>
    </Card>
  );
}

