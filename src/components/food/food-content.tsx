"use client";

import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import type { LucideIcon } from "lucide-react";
import {
  Calendar as CalendarIcon,
  Coffee,
  Cookie,
  Flame,
  Pizza,
  Salad,
  Star,
  TrendingUp,
  Utensils,
} from "lucide-react";
import { type Dispatch, type SetStateAction, useMemo, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "../../../convex/_generated/api";

import { FavoritesSection } from "./favorites-section";
import { FoodForm } from "./food-form";
import { MealSection } from "./meal-section";
import { FoodSettingsDialog } from "./food-settings-dialog";
import type {
  DailySummary,
  DailyTotals,
  FoodEntry,
  FoodEntryId,
  FoodFormData,
  MealsByType,
  MealType,
  TabValue,
  WeeklySummaryDay,
} from "./types";
import { WeeklyTrendsSection } from "./weekly-trends";
import { cn } from "@/lib/utils";

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

const MEAL_CONFIG: Record<
  MealType,
  { icon: LucideIcon; color: string; label: string }
> = {
  breakfast: { icon: Coffee, color: "#f59e0b", label: "Breakfast" },
  lunch: { icon: Salad, color: "#22c55e", label: "Lunch" },
  dinner: { icon: Pizza, color: "#3b82f6", label: "Dinner" },
  snack: { icon: Cookie, color: "#a855f7", label: "Snack" },
};

const EMPTY_TOTALS: DailyTotals = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
};

const EMPTY_BY_MEAL_TYPE: MealsByType = {
  breakfast: [],
  lunch: [],
  dinner: [],
  snack: [],
};

const createEmptyFormData = (
  overrides: Partial<FoodFormData> = {}
): FoodFormData => ({
  name: "",
  mealType: "breakfast",
  notes: "",
  calories: "",
  protein: "",
  carbs: "",
  fat: "",
  fiber: "",
  isFavorite: false,
  ...overrides,
});

export function FoodContent() {
  const [selectedDate, setSelectedDate] = useState(() => Date.now());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteEntryId, setDeleteEntryId] = useState<FoodEntryId | null>(null);
  const [editingEntry, setEditingEntry] = useState<FoodEntry | null>(null);
  const [formData, setFormData] = useState<FoodFormData>(() =>
    createEmptyFormData()
  );
  const [tab, setTab] = useState<TabValue>("meals");

  const dailySummary = useQuery(api.food.getDailySummary, {
    date: selectedDate,
  }) as DailySummary | undefined;
  const weeklySummary = useQuery(api.food.getWeeklySummary) as
    | WeeklySummaryDay[]
    | undefined;
  const favorites = useQuery(api.food.getFavorites) as FoodEntry[] | undefined;

  const addEntry = useMutation(api.food.addEntry);
  const updateEntry = useMutation(api.food.updateEntry);
  const removeEntry = useMutation(api.food.removeEntry);
  const toggleFavorite = useMutation(api.food.toggleFavorite);
  const addFromFavorite = useMutation(api.food.addFromFavorite);

  const normalizedDailySummary = useMemo<DailySummary>(
    () =>
      dailySummary ?? {
        entries: [],
        byMealType: EMPTY_BY_MEAL_TYPE,
        totals: EMPTY_TOTALS,
        goals: {
          calories: 2000,
          protein: 150,
          carbs: 250,
          fat: 65,
          fiber: 25,
        },
        percentages: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
        },
        entriesCount: 0,
      },
    [dailySummary]
  );

  const isToday = useMemo(() => {
    const today = new Date();
    const selected = new Date(selectedDate);
    return (
      today.getFullYear() === selected.getFullYear() &&
      today.getMonth() === selected.getMonth() &&
      today.getDate() === selected.getDate()
    );
  }, [selectedDate]);

  const averageCalories = useMemo(() => {
    if (!weeklySummary || weeklySummary.length === 0) return 0;
    const total = weeklySummary.reduce((sum, day) => sum + day.calories, 0);
    return Math.round(total / weeklySummary.length);
  }, [weeklySummary]);

  const resetForm = (overrides: Partial<FoodFormData> = {}) =>
    setFormData(createEmptyFormData(overrides));

  const openAddDialogForMeal = (mealType: MealType) => {
    resetForm({ mealType });
    setIsAddDialogOpen(true);
  };

  const handleAddEntry = async () => {
    if (!formData.name.trim()) return;

    await addEntry({
      name: formData.name,
      mealType: formData.mealType,
      notes: formData.notes || undefined,
      calories: toOptionalNumber(formData.calories),
      protein: toOptionalNumber(formData.protein),
      carbs: toOptionalNumber(formData.carbs),
      fat: toOptionalNumber(formData.fat),
      fiber: toOptionalNumber(formData.fiber),
      timestamp: selectedDate,
      isFavorite: formData.isFavorite,
    });

    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEditEntry = async () => {
    if (!editingEntry || !formData.name.trim()) return;

    await updateEntry({
      id: editingEntry._id,
      name: formData.name,
      mealType: formData.mealType,
      notes: formData.notes || undefined,
      calories: toOptionalNumber(formData.calories),
      protein: toOptionalNumber(formData.protein),
      carbs: toOptionalNumber(formData.carbs),
      fat: toOptionalNumber(formData.fat),
      fiber: toOptionalNumber(formData.fiber),
      isFavorite: formData.isFavorite,
    });

    resetForm();
    setEditingEntry(null);
    setIsEditDialogOpen(false);
  };

  const handleEditClick = (entry: FoodEntry) => {
    setEditingEntry(entry);
    setFormData({
      name: entry.name,
      mealType: entry.mealType,
      notes: entry.notes ?? "",
      calories: entry.calories?.toString() ?? "",
      protein: entry.protein?.toString() ?? "",
      carbs: entry.carbs?.toString() ?? "",
      fat: entry.fat?.toString() ?? "",
      fiber: entry.fiber?.toString() ?? "",
      isFavorite: entry.isFavorite,
    });
    setIsEditDialogOpen(true);
  };

  const handleQuickAddFromFavorite = async (
    favoriteId: FoodEntryId,
    mealType: MealType
  ) => {
    await addFromFavorite({
      favoriteId,
      mealType,
      timestamp: selectedDate,
    });
  };

  const mealsByType = normalizedDailySummary.byMealType ?? EMPTY_BY_MEAL_TYPE;

  return (
    <div>
      <FoodHeader tab={tab} onTabChange={setTab} />

      <AddEntryDialog
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) resetForm();
        }}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleAddEntry}
      />

      <div className="px-4 py-8">
        <div className="flex flex-col gap-6">
          {!isToday && (
            <DateBanner
              selectedDate={selectedDate}
              onReset={() => {
                setSelectedDate(Date.now());
              }}
            />
          )}

          <TotalsGrid
            totals={normalizedDailySummary.totals}
            goals={normalizedDailySummary.goals}
            percentages={normalizedDailySummary.percentages}
          />

          {tab === "meals" && (
            <div className="space-y-6">
              {MEAL_TYPES.map((mealType) => {
                const config = MEAL_CONFIG[mealType];
                const mealEntries = mealsByType[mealType] ?? [];

                return (
                  <MealSection
                    key={mealType}
                    mealType={mealType}
                    entries={mealEntries}
                    label={config.label}
                    color={config.color}
                    icon={config.icon}
                    onAddClick={() => openAddDialogForMeal(mealType)}
                    onEdit={handleEditClick}
                    onDelete={(id) => setDeleteEntryId(id)}
                    onToggleFavorite={(id) => toggleFavorite({ id })}
                  />
                );
              })}
            </div>
          )}

          {tab === "favorites" && (
            <FavoritesSection
              favorites={favorites ?? []}
              mealIcons={
                Object.fromEntries(
                  MEAL_TYPES.map((mealType) => [
                    mealType,
                    MEAL_CONFIG[mealType].icon,
                  ])
                ) as Record<MealType, LucideIcon>
              }
              onQuickAdd={handleQuickAddFromFavorite}
            />
          )}

          {tab === "trends" && (
            <WeeklyTrendsSection
              weeklySummary={weeklySummary ?? []}
              averageCalories={averageCalories}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          )}
        </div>
      </div>

      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setEditingEntry(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Food Entry</DialogTitle>
            <DialogDescription>Update your meal details</DialogDescription>
          </DialogHeader>
          <FoodForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleEditEntry}
            submitLabel="Save Changes"
          />
        </DialogContent>
      </Dialog>

      <DeleteConfirmationDialog
        entryId={deleteEntryId}
        onOpenChange={(open) => !open && setDeleteEntryId(null)}
        onConfirm={async () => {
          if (deleteEntryId) {
            await removeEntry({ id: deleteEntryId });
            setDeleteEntryId(null);
          }
        }}
      />
    </div>
  );
}

function FoodHeader({
  tab,
  onTabChange,
}: {
  tab: TabValue;
  onTabChange: (tab: TabValue) => void;
}) {
  return (
    <div className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Utensils className="h-5 w-5 text-orange-500" />
          <h1 className="text-lg font-semibold">Food Log</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={tab === "meals" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onTabChange("meals")}
          >
            <Utensils className="h-4 w-4" />
            Today's Meals
          </Button>
          <Button
            variant={tab === "favorites" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onTabChange("favorites")}
          >
            <Star className="h-4 w-4" />
            Favorites
          </Button>
          <Button
            variant={tab === "trends" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onTabChange("trends")}
          >
            <TrendingUp className="h-4 w-4" />
            Analytics
          </Button>
          <FoodSettingsDialog />
        </div>
      </div>
    </div>
  );
}

function DateBanner({
  selectedDate,
  onReset,
}: {
  selectedDate: number;
  onReset: () => void;
}) {
  return (
    <Card className="bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800">
      <CardContent className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-orange-600" />
          <span className="text-sm font-medium">
            Viewing: {format(selectedDate, "MMMM d, yyyy")}
          </span>
        </div>
        <Button size="sm" variant="outline" onClick={onReset}>
          Back to Today
        </Button>
      </CardContent>
    </Card>
  );
}

function TotalsGrid({
  totals,
  goals,
  percentages,
}: {
  totals: DailyTotals;
  goals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  percentages: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
      <TotalsCardWithProgress
        value={Math.round(totals.calories)}
        goal={goals.calories}
        percentage={percentages.calories}
        label="Calories"
        unit="kcal"
        icon={Flame}
        iconColor="text-orange-500"
        bgColor="bg-orange-100 dark:bg-orange-950"
        accent="text-orange-600"
        className="md:col-span-2"
      />

      <TotalsCardWithProgress
        value={Math.round(totals.protein)}
        goal={goals.protein}
        percentage={percentages.protein}
        label="Protein"
        unit="g"
        accent="text-blue-600"
      />
      <TotalsCardWithProgress
        value={Math.round(totals.carbs)}
        goal={goals.carbs}
        percentage={percentages.carbs}
        label="Carbs"
        unit="g"
        accent="text-yellow-600"
      />
      <TotalsCardWithProgress
        value={Math.round(totals.fat)}
        goal={goals.fat}
        percentage={percentages.fat}
        label="Fat"
        unit="g"
        accent="text-purple-600"
      />
      <TotalsCardWithProgress
        value={Math.round(totals.fiber)}
        goal={goals.fiber}
        percentage={percentages.fiber}
        label="Fiber"
        unit="g"
        accent="text-green-600"
      />
    </div>
  );
}

function TotalsCardWithProgress({
  value,
  goal,
  percentage,
  label,
  unit,
  icon: Icon,
  iconColor,
  bgColor,
  accent,
  className = "",
}: {
  value: number;
  goal: number;
  percentage: number;
  label: string;
  unit: string;
  icon?: LucideIcon;
  iconColor?: string;
  bgColor?: string;
  accent: string;
  className?: string;
}) {
  return (
    <Card className={cn("flex flex-col gap-2 py-4", className)}>
      <CardContent>
        <p className={cn("text-sm font-medium brightness-150", accent)}>
          {label}
        </p>
        <div className={`text-2xl font-bold ${accent}`}>
          {value}
          <span className="text-sm font-normal text-muted-foreground ml-1">
            / {goal} {unit}
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 mt-2">
          <div
            className={cn(
              "h-2 rounded-full transition-all duration-500",
              percentage >= 100
                ? "bg-green-500"
                : accent === "text-orange-600"
                  ? "bg-orange-500"
                  : accent === "text-blue-600"
                    ? "bg-blue-500"
                    : accent === "text-yellow-600"
                      ? "bg-yellow-500"
                      : accent === "text-purple-600"
                        ? "bg-purple-500"
                        : accent === "text-green-600"
                          ? "bg-green-500"
                          : "bg-primary"
            )}
            style={{ width: `${Math.min(100, percentage)}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function AddEntryDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: FoodFormData;
  setFormData: Dispatch<SetStateAction<FoodFormData>>;
  onSubmit: () => Promise<void> | void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Food Entry</DialogTitle>
          <DialogDescription>
            Log your meal with optional nutrition info
          </DialogDescription>
        </DialogHeader>
        <FoodForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={onSubmit}
          submitLabel="Add Entry"
        />
      </DialogContent>
    </Dialog>
  );
}

function DeleteConfirmationDialog({
  entryId,
  onOpenChange,
  onConfirm,
}: {
  entryId: FoodEntryId | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}) {
  return (
    <AlertDialog open={entryId !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Entry?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove this food entry from your log.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (entryId) {
                void onConfirm();
              }
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function toOptionalNumber(value: string) {
  return value ? Number.parseFloat(value) : undefined;
}
