"use client";

import Link from "next/link";
import { Fragment, useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { FileText, Plus } from "lucide-react";

import { api } from "../../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardCard } from "../dashboard-card";
import { initialEditorState } from "@/components/notes/use-note-drafts";
import { Separator } from "@/components/ui/separator";

export function NotesCard({ className }: { className?: string }) {
  const notes = useQuery(api.notes.list, {});
  const createNote = useMutation(api.notes.create);

  const [noteTitle, setNoteTitle] = useState("");
  const [isCreatingNote, setIsCreatingNote] = useState(false);

  const recentNotes = useMemo(() => (notes ?? []).slice(0, 3), [notes]);

  const handleAddNote = async (event: FormEvent) => {
    event.preventDefault();
    if (isCreatingNote) return;
    setIsCreatingNote(true);
    try {
      const title = noteTitle.trim() || "Untitled Note";
      await createNote({
        title,
        content: JSON.stringify(initialEditorState),
        tags: [],
      });
      setNoteTitle("");
    } finally {
      setIsCreatingNote(false);
    }
  };

  return (
    <DashboardCard
      title="Notes"
      description="Recent captures"
      href="/notes"
      icon={FileText}
      tone="bg-gradient-to-br from-slate-50/80 via-background to-background dark:from-slate-950/40 dark:via-background dark:to-background"
      iconBg="bg-slate-200/70 dark:bg-slate-500/20"
      iconTone="text-slate-700 dark:text-slate-200"
      className={className}
    >
      {notes === undefined ? (
        <p className="text-sm text-muted-foreground">Loading notes...</p>
      ) : recentNotes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No notes yet. Capture your first idea.
        </p>
      ) : (
        <div className="space-y-3">
          {recentNotes.map((note, index, array) => (
            <Fragment key={note._id}>
              <Link
                href={`/notes?note=${note._id}`}
                className="block"
              >
                <p className="text-sm font-medium">{note.title}</p>
                <p className="text-xs text-muted-foreground">
                  Updated{" "}
                  {formatDistanceToNow(new Date(note.updatedAt), {
                    addSuffix: true,
                  })}
                </p>
              </Link>
              {index !== array.length - 1 && <Separator />}
            </Fragment>
          ))}
        </div>
      )}
    </DashboardCard>
  );
}
