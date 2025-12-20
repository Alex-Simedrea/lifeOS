import type { Doc, Id } from "../../../convex/_generated/dataModel";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type FoodEntry = Doc<"foodEntries">;
export type FoodEntryId = Id<"foodEntries">;

export type TabValue = "meals" | "favorites" | "trends";

export type MealsByType = Record<MealType, FoodEntry[]>;

export type DailyTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
};

export type DailySummary = {
  entries: FoodEntry[];
  byMealType: MealsByType;
  totals: DailyTotals;
  entriesCount: number;
};

export type WeeklySummaryDay = {
  date: number;
  entries: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type FoodFormData = {
  name: string;
  mealType: MealType;
  notes: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  isFavorite: boolean;
};
