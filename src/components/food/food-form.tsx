"use client";

import type { Dispatch, SetStateAction } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import type { FoodFormData, MealType } from "./types";

type FoodFormProps = {
  formData: FoodFormData;
  setFormData: Dispatch<SetStateAction<FoodFormData>>;
  onSubmit: () => Promise<void> | void;
  submitLabel: string;
};

export function FoodForm({
  formData,
  setFormData,
  onSubmit,
  submitLabel,
}: FoodFormProps) {
  return (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2">
          <Label>Food Name *</Label>
          <Input
            placeholder="e.g., Chicken Salad"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Meal Type *</Label>
          <Select
            value={formData.mealType}
            onValueChange={(value: MealType) =>
              setFormData((prev) => ({ ...prev, mealType: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="breakfast">Breakfast</SelectItem>
              <SelectItem value="lunch">Lunch</SelectItem>
              <SelectItem value="dinner">Dinner</SelectItem>
              <SelectItem value="snack">Snack</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isFavorite}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  isFavorite: e.target.checked,
                }))
              }
              className="rounded"
            />
            Save as Favorite
          </Label>
        </div>

        <div className="space-y-2 col-span-2">
          <Label>Notes (optional)</Label>
          <Textarea
            placeholder="Any additional details..."
            value={formData.notes}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, notes: e.target.value }))
            }
            rows={2}
          />
        </div>

        <div className="col-span-2">
          <Label className="text-sm font-semibold mb-3 block">
            Nutrition Info (optional)
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <NutritionInput
              label="Calories"
              value={formData.calories}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, calories: value }))
              }
            />
            <NutritionInput
              label="Protein (g)"
              value={formData.protein}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, protein: value }))
              }
            />
            <NutritionInput
              label="Carbs (g)"
              value={formData.carbs}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, carbs: value }))
              }
            />
            <NutritionInput
              label="Fat (g)"
              value={formData.fat}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, fat: value }))
              }
            />
            <NutritionInput
              label="Fiber (g)"
              value={formData.fiber}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, fiber: value }))
              }
            />
          </div>
        </div>
      </div>

      <Button onClick={onSubmit} className="w-full" size="lg">
        {submitLabel}
      </Button>
    </div>
  );
}

function NutritionInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        placeholder="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
