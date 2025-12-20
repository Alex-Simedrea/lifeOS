"use client";

import { Edit, type LucideIcon, Star, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { FoodEntry, FoodEntryId, MealType } from "./types";

type MealSectionProps = {
  mealType: MealType;
  entries: FoodEntry[];
  label: string;
  color: string;
  icon: LucideIcon;
  onAddClick: () => void;
  onEdit: (entry: FoodEntry) => void;
  onDelete: (id: FoodEntryId) => void;
  onToggleFavorite: (id: FoodEntryId) => void;
};

export function MealSection({
  mealType,
  entries,
  label,
  color,
  icon: MealIcon,
  onAddClick,
  onEdit,
  onDelete,
  onToggleFavorite,
}: MealSectionProps) {
  return (
    <Card key={mealType}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${color}20` }}
            >
              <MealIcon className="h-5 w-5" style={{ color }} />
            </div>
            <div>
              <CardTitle>{label}</CardTitle>
              <CardDescription>
                {entries.length} {entries.length === 1 ? "entry" : "entries"}
              </CardDescription>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={onAddClick}>
            Add
          </Button>
        </div>
      </CardHeader>
      {entries.length > 0 && (
        <CardContent className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry._id}
              className="flex items-start justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{entry.name}</h4>
                  {entry.isFavorite && (
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  )}
                </div>
                {entry.notes && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {entry.notes}
                  </p>
                )}
                <NutritionBadges entry={entry} />
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onToggleFavorite(entry._id)}
                >
                  <Star
                    className={cn(
                      "h-4 w-4",
                      entry.isFavorite
                        ? "fill-yellow-500 text-yellow-500"
                        : "text-muted-foreground",
                    )}
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(entry)}
                >
                  <Edit className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(entry._id)}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}

function NutritionBadges({ entry }: { entry: FoodEntry }) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {entry.calories !== undefined && (
        <Badge variant="secondary">{Math.round(entry.calories)} cal</Badge>
      )}
      {entry.protein !== undefined && (
        <Badge variant="outline" className="text-blue-600 border-blue-600">
          P: {Math.round(entry.protein)}g
        </Badge>
      )}
      {entry.carbs !== undefined && (
        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
          C: {Math.round(entry.carbs)}g
        </Badge>
      )}
      {entry.fat !== undefined && (
        <Badge variant="outline" className="text-purple-600 border-purple-600">
          F: {Math.round(entry.fat)}g
        </Badge>
      )}
      {entry.fiber !== undefined && (
        <Badge variant="outline" className="text-green-600 border-green-600">
          Fi: {Math.round(entry.fiber)}g
        </Badge>
      )}
    </div>
  );
}
