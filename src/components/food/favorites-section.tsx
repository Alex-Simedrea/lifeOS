"use client";

import { type LucideIcon, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { FoodEntry, FoodEntryId, MealType } from "./types";

type FavoritesSectionProps = {
  favorites: FoodEntry[];
  mealIcons: Record<MealType, LucideIcon>;
  onQuickAdd: (favoriteId: FoodEntryId, mealType: MealType) => void;
};

export function FavoritesSection({
  favorites,
  mealIcons,
  onQuickAdd,
}: FavoritesSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Favorite Meals</CardTitle>
        <CardDescription>Quick add your frequently eaten meals</CardDescription>
      </CardHeader>
      <CardContent>
        {favorites.length === 0 ? (
          <EmptyFavorites />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {favorites.map((fav) => (
              <div
                key={fav._id}
                className="p-4 rounded-lg border hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold flex items-center gap-2">
                      {fav.name}
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    </h4>
                    {fav.notes && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {fav.notes}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {fav.calories !== undefined && (
                    <Badge variant="secondary">
                      {Math.round(fav.calories)} cal
                    </Badge>
                  )}
                  {fav.protein !== undefined && (
                    <Badge
                      variant="outline"
                      className="text-blue-600 border-blue-600"
                    >
                      P: {Math.round(fav.protein)}g
                    </Badge>
                  )}
                  {fav.carbs !== undefined && (
                    <Badge
                      variant="outline"
                      className="text-yellow-600 border-yellow-600"
                    >
                      C: {Math.round(fav.carbs)}g
                    </Badge>
                  )}
                  {fav.fat !== undefined && (
                    <Badge
                      variant="outline"
                      className="text-purple-600 border-purple-600"
                    >
                      F: {Math.round(fav.fat)}g
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  {(
                    ["breakfast", "lunch", "dinner", "snack"] as MealType[]
                  ).map((mealType) => {
                    const MealIcon = mealIcons[mealType];
                    return (
                      <Button
                        key={mealType}
                        size="sm"
                        variant="outline"
                        onClick={() => onQuickAdd(fav._id, mealType)}
                        className="flex-1"
                      >
                        <MealIcon className="h-3 w-3" />
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyFavorites() {
  return (
    <div className="text-center py-12">
      <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <p className="text-muted-foreground">
        No favorites yet. Star any meal to add it here!
      </p>
    </div>
  );
}
