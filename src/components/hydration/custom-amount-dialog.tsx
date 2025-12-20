"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

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

interface CustomAmountDialogProps {
  onAdd: (amount: number) => Promise<void>;
}

export function CustomAmountDialog({ onAdd }: CustomAmountDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState("");

  const handleAdd = async () => {
    const amount = Number.parseInt(customAmount);
    if (amount > 0) {
      await onAdd(amount);
      setCustomAmount("");
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className="w-full mt-3 hover:bg-blue-50 hover:border-blue-500 dark:hover:bg-blue-950"
        >
          <Plus className="h-5 w-5" />
          Custom Amount
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Custom Amount</DialogTitle>
          <DialogDescription>
            Enter the amount of water you drank
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Amount (ml)</Label>
            <Input
              type="number"
              placeholder="e.g., 350"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAdd();
                }
              }}
            />
          </div>
          <Button onClick={handleAdd} className="w-full">
            Add Entry
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

