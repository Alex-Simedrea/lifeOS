"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Editor } from "@/components/notes/editor";
import { SerializedEditorState } from "lexical";
import type { Id } from "../../../convex/_generated/dataModel";
import { NotesSidebar } from "./notes-sidebar";
import { DeleteNoteDialog } from "./delete-note-dialog";
import { NoteEditorHeader } from "./note-editor-header";
import { NoteTagsSection } from "./note-tags-section";
import { EmptyState } from "./empty-state";
import { useNoteDrafts, initialEditorState } from "./use-note-drafts";

export function NotesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const notes = useQuery(api.notes.list, {});
  const tags = useQuery(api.tags.list, {});
  const createNote = useMutation(api.notes.create);
  const updateNote = useMutation(api.notes.update);
  const deleteNote = useMutation(api.notes.remove);
  const createTag = useMutation(api.tags.create);

  const [selectedNoteId, setSelectedNoteId] = useState<Id<"notes"> | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<Id<"notes"> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { drafts, setDrafts } = useNoteDrafts(notes);
  const activeDraft = selectedNoteId ? drafts[selectedNoteId] : undefined;
  const noteIdParam = searchParams.get("note");
  const lastNoteIdParam = useRef<string | null>(null);

  const updateUrlNote = (noteId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (noteId) {
      params.set("note", noteId);
    } else {
      params.delete("note");
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  useEffect(() => {
    if (!notes) return;
    if (noteIdParam === lastNoteIdParam.current) return;
    lastNoteIdParam.current = noteIdParam;
    if (!noteIdParam) {
      setSelectedNoteId(null);
      return;
    }
    const hasNote = notes.some((note) => note._id === noteIdParam);
    if (hasNote) {
      setSelectedNoteId(noteIdParam as Id<"notes">);
    }
  }, [noteIdParam, notes]);

  useEffect(() => {
    if (!selectedNoteId || !activeDraft?.isDirty) return;

    const titleToSave = activeDraft.title.trim() || "Untitled Note";
    const contentToSave = activeDraft.content;
    const timeoutId = setTimeout(async () => {
      setIsSaving(true);
      try {
        await updateNote({
          id: selectedNoteId,
          title: titleToSave,
          content: JSON.stringify(contentToSave),
          tags: activeDraft.tags,
        });
        setDrafts((prev) => {
          const current = prev[selectedNoteId];
          if (!current) return prev;
          if (
            current.title !== activeDraft.title ||
            current.content !== activeDraft.content
          ) {
            return prev;
          }
          return {
            ...prev,
            [selectedNoteId]: {
              ...current,
              isDirty: false,
              updatedAt: Date.now(),
            },
          };
        });
      } catch (error) {
        console.error("Failed to save note:", error);
      } finally {
        setIsSaving(false);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [activeDraft, selectedNoteId, updateNote, setDrafts]);

  const handleCreateNote = async () => {
    try {
      const newNoteId = await createNote({
        title: "Untitled Note",
        content: JSON.stringify(initialEditorState),
        tags: [],
      });
      setSelectedNoteId(newNoteId);
      updateUrlNote(newNoteId);
      setDrafts((prev) => ({
        ...prev,
        [newNoteId]: {
          title: "Untitled Note",
          content: initialEditorState,
          tags: [],
          isDirty: false,
          updatedAt: Date.now(),
        },
      }));
    } catch (error) {
      console.error("Failed to create note:", error);
    }
  };

  const handleDelete = async () => {
    if (noteToDelete) {
      await deleteNote({ id: noteToDelete });
      setDeleteDialogOpen(false);
      setNoteToDelete(null);
      if (selectedNoteId === noteToDelete) {
        setSelectedNoteId(null);
        updateUrlNote(null);
      }
      setDrafts((prev) => {
        if (!prev[noteToDelete]) return prev;
        const next = { ...prev };
        delete next[noteToDelete];
        return next;
      });
    }
  };

  const handleNoteSelect = (noteId: Id<"notes">) => {
    setSelectedNoteId(noteId);
    updateUrlNote(noteId);
  };

  const handleNoteDelete = (noteId: Id<"notes">) => {
    setNoteToDelete(noteId);
    setDeleteDialogOpen(true);
  };

  const handleTitleChange = (title: string) => {
    if (!selectedNoteId) return;
    setDrafts((prev) => {
      const existing = prev[selectedNoteId];
      if (!existing || existing.title === title) return prev;
      return {
        ...prev,
        [selectedNoteId]: {
          ...existing,
          title,
          isDirty: true,
        },
      };
    });
  };

  const handleContentChange = (nextState: SerializedEditorState) => {
    if (!selectedNoteId) return;
    setDrafts((prev) => {
      const existing = prev[selectedNoteId];
      if (!existing) return prev;
      return {
        ...prev,
        [selectedNoteId]: {
          ...existing,
          content: nextState,
          isDirty: true,
        },
      };
    });
  };

  const handleToggleTag = (tagId: Id<"tags">) => {
    if (!selectedNoteId) return;
    setDrafts((prev) => {
      const existing = prev[selectedNoteId];
      if (!existing) return prev;
      const nextTags = existing.tags.includes(tagId)
        ? existing.tags.filter((id) => id !== tagId)
        : [...existing.tags, tagId];
      return {
        ...prev,
        [selectedNoteId]: {
          ...existing,
          tags: nextTags,
          isDirty: true,
        },
      };
    });
  };

  const handleCreateTag = async (
    name: string,
    color: string,
    emoji: string
  ): Promise<Id<"tags">> => {
    if (!selectedNoteId) {
      throw new Error("No note selected");
    }
    const tagId = await createTag({
      name,
      color,
      emoji,
    });
    setDrafts((prev) => {
      const existing = prev[selectedNoteId];
      if (!existing) return prev;
      return {
        ...prev,
        [selectedNoteId]: {
          ...existing,
          tags: [...existing.tags, tagId],
          isDirty: true,
        },
      };
    });
    return tagId;
  };

  const handleCloseNote = () => {
    setSelectedNoteId(null);
    updateUrlNote(null);
  };

  return (
    <div className="flex h-full overflow-hidden">
      <NotesSidebar
        notes={notes}
        tags={tags ?? []}
        selectedNoteId={selectedNoteId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNoteSelect={handleNoteSelect}
        onNoteDelete={handleNoteDelete}
        onCreateNote={handleCreateNote}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedNoteId && activeDraft ? (
          <>
            <div className="p-4 border-b space-y-3">
              <NoteEditorHeader
                title={activeDraft.title}
                isSaving={isSaving}
                onTitleChange={handleTitleChange}
                onClose={handleCloseNote}
              />
              <NoteTagsSection
                tags={tags ?? []}
                selectedTagIds={activeDraft.tags}
                onToggleTag={handleToggleTag}
                onCreateTag={handleCreateTag}
              />
            </div>
            <div className="flex-1 overflow-hidden p-4">
              <Editor
                key={selectedNoteId}
                editorSerializedState={
                  activeDraft.content ?? initialEditorState
                }
                onSerializedChange={handleContentChange}
              />
            </div>
          </>
        ) : (
          <EmptyState onCreateNote={handleCreateNote} />
        )}
      </div>

      <DeleteNoteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        onCancel={() => setNoteToDelete(null)}
      />
    </div>
  );
}
