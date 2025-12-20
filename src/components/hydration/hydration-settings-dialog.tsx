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

export function HydrationSettingsDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const settings = useQuery(api.hydration.getSettings);
  const updateSettings = useMutation(api.hydration.updateSettings);

  const [settingsForm, setSettingsForm] = useState({
    dailyGoalMl: 2000,
    bottlePresets: [250, 500, 750, 1000],
  });

  useEffect(() => {
    if (settings) {
      setSettingsForm({
        dailyGoalMl: settings.dailyGoalMl,
        bottlePresets: settings.bottlePresets,
      });
    }
  }, [settings]);

  const handleSaveSettings = async () => {
    await updateSettings({
      dailyGoalMl: settingsForm.dailyGoalMl,
      bottlePresets: settingsForm.bottlePresets,
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hydration Settings</DialogTitle>
          <DialogDescription>
            Customize your daily goal and bottle presets
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Daily Goal (ml)</Label>
            <Input
              type="number"
              value={settingsForm.dailyGoalMl}
              onChange={(e) =>
                setSettingsForm({
                  ...settingsForm,
                  dailyGoalMl: Number.parseInt(e.target.value) || 2000,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Quick Add Presets (ml)</Label>
            <div className="grid grid-cols-4 gap-2">
              {settingsForm.bottlePresets.map((preset, index) => (
                <Input
                  key={index}
                  type="number"
                  value={preset}
                  onChange={(e) => {
                    const newPresets = [...settingsForm.bottlePresets];
                    newPresets[index] = Number.parseInt(e.target.value) || 0;
                    setSettingsForm({
                      ...settingsForm,
                      bottlePresets: newPresets,
                    });
                  }}
                />
              ))}
            </div>
          </div>
          <Button onClick={handleSaveSettings} className="w-full">
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

