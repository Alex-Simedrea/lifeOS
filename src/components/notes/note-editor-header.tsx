import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface NoteEditorHeaderProps {
  title: string;
  isSaving: boolean;
  onTitleChange: (title: string) => void;
  onClose: () => void;
}

export function NoteEditorHeader({
  title,
  isSaving,
  onTitleChange,
  onClose,
}: NoteEditorHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <input
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Note title..."
        className="text-xl font-semibold border-none shadow-none focus-visible:ring-0 px-0 ring-0 outline-0"
        value={title}
      />
      <div className="flex items-center gap-2">
        {isSaving && (
          <span className="text-xs text-muted-foreground">Saving...</span>
        )}
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

