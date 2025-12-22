import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";
import type { Id } from "../../../convex/_generated/dataModel";

interface Tag {
  _id: Id<"tags">;
  name: string;
  color: string;
  emoji: string;
}

interface Note {
  _id: Id<"notes">;
  title: string;
  content: string;
  tags: Id<"tags">[];
  updatedAt: number;
}

interface NoteItemProps {
  note: Note;
  tags: Tag[];
  isSelected: boolean;
  preview: string;
  onSelect: (noteId: Id<"notes">) => void;
  onDelete: (noteId: Id<"notes">) => void;
}

export function NoteItem({
  note,
  tags,
  isSelected,
  preview,
  onSelect,
  onDelete,
}: NoteItemProps) {
  const noteTags = tags.filter((tag) => note.tags.includes(tag._id));

  return (
    <div
      className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
        isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted"
      }`}
      onClick={() => onSelect(note._id)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3
            className={`font-medium truncate ${
              isSelected ? "text-primary-foreground" : ""
            }`}
          >
            {note.title}
          </h3>
          <p
            className={`text-xs mt-1 line-clamp-2 ${
              isSelected
                ? "text-primary-foreground/80"
                : "text-muted-foreground"
            }`}
          >
            {preview}
          </p>
          <div className="flex items-center gap-2 mt-2">
            {noteTags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {noteTags.slice(0, 2).map((tag) => (
                  <Badge
                    key={tag._id}
                    variant="outline"
                    className={`text-xs h-4 px-1 ${
                      isSelected
                        ? "border-primary-foreground/30 text-primary-foreground/80"
                        : ""
                    }`}
                    style={
                      !isSelected
                        ? {
                            borderColor: tag.color,
                            color: tag.color,
                          }
                        : {}
                    }
                  >
                    <span className="mr-0.5">{tag.emoji}</span>
                    {tag.name}
                  </Badge>
                ))}
                {noteTags.length > 2 && (
                  <span
                    className={`text-xs ${
                      isSelected
                        ? "text-primary-foreground/60"
                        : "text-muted-foreground"
                    }`}
                  >
                    +{noteTags.length - 2}
                  </span>
                )}
              </div>
            )}
            <span
              className={`text-xs ${
                isSelected
                  ? "text-primary-foreground/60"
                  : "text-muted-foreground"
              }`}
            >
              {format(new Date(note.updatedAt), "MMM d")}
            </span>
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className={`h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity ${
            isSelected
              ? "hover:bg-primary-foreground/20 text-primary-foreground"
              : "hover:bg-destructive/10 hover:text-destructive"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(note._id);
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

