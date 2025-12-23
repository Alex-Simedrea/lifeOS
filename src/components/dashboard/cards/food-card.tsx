"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import { Plus, Utensils } from "lucide-react";

import { api } from "../../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DashboardCard } from "../dashboard-card";

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export function FoodCard({ className }: { className?: string }) {
  const summaryDate = useMemo(() => Date.now(), []);

  const foodSummary = useQuery(api.food.getDailySummary, {
    date: summaryDate,
  });
  const addFoodEntry = useMutation(api.food.addEntry);

  const [foodName, setFoodName] = useState("");
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [isLoggingFood, setIsLoggingFood] = useState(false);

  const recentFoodEntries = useMemo(
    () => [...(foodSummary?.entries ?? [])].slice(-3).reverse(),
    [foodSummary]
  );

  const handleAddFood = async (event: FormEvent) => {
    event.preventDefault();
    const name = foodName.trim();
    if (!name || isLoggingFood) return;
    setIsLoggingFood(true);
    try {
      await addFoodEntry({
        name,
        mealType,
        timestamp: Date.now(),
        isFavorite: false,
      });
      setFoodName("");
    } finally {
      setIsLoggingFood(false);
    }
  };

  return (
    <DashboardCard
      title="Food"
      description="Meals and nutrition"
      href="/food"
      icon={Utensils}
      tone="bg-gradient-to-br from-orange-50/70 via-background to-background dark:from-orange-950/30 dark:via-background dark:to-background"
      iconBg="bg-orange-100/70 dark:bg-orange-500/20"
      iconTone="text-orange-700 dark:text-orange-200"
      className={className}
    >
      {foodSummary === undefined ? (
        <p className="text-sm text-muted-foreground">Loading food...</p>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-orange-100 text-orange-900 dark:bg-orange-500/20 dark:text-orange-100">
              {foodSummary?.totals.calories ?? 0} /{" "}
              {foodSummary?.goals.calories ?? 2000} kcal
            </Badge>
            <Badge
              variant="outline"
              className="border-orange-200/70 text-orange-900 dark:border-orange-500/40 dark:text-orange-100"
            >
              Protein {foodSummary?.totals.protein ?? 0}g
            </Badge>
            <Badge
              variant="outline"
              className="border-orange-200/70 text-orange-900 dark:border-orange-500/40 dark:text-orange-100"
            >
              Carbs {foodSummary?.totals.carbs ?? 0}g
            </Badge>
          </div>

          {recentFoodEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No meals logged today.
            </p>
          ) : (
            <div className="space-y-3">
              {recentFoodEntries.map((entry) => (
                <div key={entry._id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{entry.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {entry.mealType} - {format(new Date(entry.timestamp), "h:mm a")}
                    </p>
                  </div>
                  {entry.calories ? (
                    <Badge variant="outline">{entry.calories} kcal</Badge>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="pt-4">
        <form onSubmit={handleAddFood} className="flex gap-2 max-xl:flex-wrap">
          <Input
            value={foodName}
            onChange={(event) => setFoodName(event.target.value)}
            placeholder="Quick log meal"
            aria-label="Meal name"
          />
          <Select
            value={mealType}
            onValueChange={(value) => setMealType(value as MealType)}
          >
            <SelectTrigger className="min-w-[140px] w-[140px] h-full!" aria-label="Meal type">
              <SelectValue placeholder="Meal type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="breakfast">Breakfast</SelectItem>
              <SelectItem value="lunch">Lunch</SelectItem>
              <SelectItem value="dinner">Dinner</SelectItem>
              <SelectItem value="snack">Snack</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" size="sm" disabled={isLoggingFood} className="h-9!">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </form>
      </div>
    </DashboardCard>
  );
}
