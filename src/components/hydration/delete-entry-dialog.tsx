"use client";

import type { Id } from "../../../convex/_generated/dataModel";

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

interface DeleteEntryDialogProps {
  entryId: Id<"hydrationEntries"> | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteEntryDialog({
  entryId,
  onOpenChange,
  onConfirm,
}: DeleteEntryDialogProps) {
  return (
    <AlertDialog open={entryId !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Entry?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove this hydration entry from your log.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

