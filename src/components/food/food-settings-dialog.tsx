"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Settings as SettingsIcon } from "lucide-react";

import { api } from "../../../convex/_generated/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function FoodSettingsDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const settings = useQuery(api.food.getSettings);
  const updateSettings = useMutation(api.food.updateSettings);

  const [settingsForm, setSettingsForm] = useState({
    dailyGoalCalories: 2000,
    dailyGoalProtein: 150,
    dailyGoalCarbs: 250,
    dailyGoalFat: 65,
    dailyGoalFiber: 25,
  });

  useEffect(() => {
    if (settings) {
      setSettingsForm({
        dailyGoalCalories: settings.dailyGoalCalories,
        dailyGoalProtein: settings.dailyGoalProtein,
        dailyGoalCarbs: settings.dailyGoalCarbs,
        dailyGoalFat: settings.dailyGoalFat,
        dailyGoalFiber: settings.dailyGoalFiber,
      });
    }
  }, [settings]);

  const handleSaveSettings = async () => {
    await updateSettings({
      dailyGoalCalories: settingsForm.dailyGoalCalories,
      dailyGoalProtein: settingsForm.dailyGoalProtein,
      dailyGoalCarbs: settingsForm.dailyGoalCarbs,
      dailyGoalFat: settingsForm.dailyGoalFat,
      dailyGoalFiber: settingsForm.dailyGoalFiber,
    });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <SettingsIcon className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Food Goals Settings</DialogTitle>
          <DialogDescription>
            Customize your daily nutrition goals
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="calories">Daily Calories Goal (kcal)</Label>
            <Input
              id="calories"
              type="number"
              value={settingsForm.dailyGoalCalories}
              onChange={(e) =>
                setSettingsForm({
                  ...settingsForm,
                  dailyGoalCalories: Number.parseInt(e.target.value) || 2000,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="protein">Daily Protein Goal (g)</Label>
            <Input
              id="protein"
              type="number"
              value={settingsForm.dailyGoalProtein}
              onChange={(e) =>
                setSettingsForm({
                  ...settingsForm,
                  dailyGoalProtein: Number.parseInt(e.target.value) || 150,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="carbs">Daily Carbs Goal (g)</Label>
            <Input
              id="carbs"
              type="number"
              value={settingsForm.dailyGoalCarbs}
              onChange={(e) =>
                setSettingsForm({
                  ...settingsForm,
                  dailyGoalCarbs: Number.parseInt(e.target.value) || 250,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fat">Daily Fat Goal (g)</Label>
            <Input
              id="fat"
              type="number"
              value={settingsForm.dailyGoalFat}
              onChange={(e) =>
                setSettingsForm({
                  ...settingsForm,
                  dailyGoalFat: Number.parseInt(e.target.value) || 65,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fiber">Daily Fiber Goal (g)</Label>
            <Input
              id="fiber"
              type="number"
              value={settingsForm.dailyGoalFiber}
              onChange={(e) =>
                setSettingsForm({
                  ...settingsForm,
                  dailyGoalFiber: Number.parseInt(e.target.value) || 25,
                })
              }
            />
          </div>
          <Button onClick={handleSaveSettings} className="w-full">
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

