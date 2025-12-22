import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";

interface EmptyStateProps {
  onCreateNote: () => void;
}

export function EmptyState({ onCreateNote }: EmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-4">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
        <div>
          <h3 className="text-lg font-semibold mb-2">No note selected</h3>
          <p className="text-muted-foreground mb-4">
            Select a note from the sidebar or create a new one
          </p>
          <Button onClick={onCreateNote}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Note
          </Button>
        </div>
      </div>
    </div>
  );
}

