"use client";

import { Settings as SettingsIcon } from "lucide-react";
import { Droplets } from "lucide-react";

import { Button } from "@/components/ui/button";
import { HydrationSettingsDialog } from "./hydration-settings-dialog";

export function HydrationHeader() {
  return (
    <div className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex h-14 items-center px-4 justify-between">
        <div className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-blue-500" />
          <h1 className="text-lg font-semibold">Hydration</h1>
        </div>
        <HydrationSettingsDialog />
      </div>
    </div>
  );
}

