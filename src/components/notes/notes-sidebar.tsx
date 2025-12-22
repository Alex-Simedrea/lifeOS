import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Search, X } from "lucide-react";
import { NoteItem } from "./note-item";
import { parseContent } from "./use-note-drafts";
import type { Id } from "../../../convex/_generated/dataModel";
import { SerializedEditorState } from "lexical";

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

interface NotesSidebarProps {
  notes: Note[] | undefined;
  tags: Tag[];
  selectedNoteId: Id<"notes"> | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNoteSelect: (noteId: Id<"notes">) => void;
  onNoteDelete: (noteId: Id<"notes">) => void;
  onCreateNote: () => void;
}

function getNotePreview(content: string): string {
  try {
    const parsed = JSON.parse(content) as SerializedEditorState;
    const firstParagraph = parsed.root?.children?.[0];
    if (firstParagraph && "children" in firstParagraph) {
      const textNodes = (firstParagraph.children as any[]).filter(
        (child: any) => child.type === "text"
      );
      const text = textNodes.map((node: any) => node.text || "").join("");
      return text.slice(0, 100) + (text.length > 100 ? "..." : "");
    }
  } catch {
    return content.slice(0, 100) + (content.length > 100 ? "..." : "");
  }
  return "No content";
}

export function NotesSidebar({
  notes,
  tags,
  selectedNoteId,
  searchQuery,
  onSearchChange,
  onNoteSelect,
  onNoteDelete,
  onCreateNote,
}: NotesSidebarProps) {
  const filteredNotes =
    notes?.filter((note) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query)
      );
    }) ?? [];

  return (
    <div className="w-80 border-r bg-muted/30 flex flex-col">
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Notes</h2>
          <Button size="icon" variant="outline" onClick={onCreateNote}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8"
          />
          {searchQuery && (
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
              onClick={() => onSearchChange("")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        {notes === undefined ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Loading notes...
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {searchQuery
              ? "No notes found"
              : "No notes yet. Create one to get started!"}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredNotes.map((note) => (
              <NoteItem
                key={note._id}
                note={note}
                tags={tags}
                isSelected={selectedNoteId === note._id}
                preview={getNotePreview(note.content)}
                onSelect={onNoteSelect}
                onDelete={onNoteDelete}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

