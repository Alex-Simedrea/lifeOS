import { useState, useEffect } from "react";
import { SerializedEditorState } from "lexical";
import type { Id } from "../../../convex/_generated/dataModel";

export interface NoteDraft {
  title: string;
  content: SerializedEditorState;
  tags: Id<"tags">[];
  isDirty: boolean;
  updatedAt?: number;
}

export const initialEditorState: SerializedEditorState = {
  root: {
    children: [
      {
        children: [],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
      },
    ],
    direction: "ltr",
    format: "",
    indent: 0,
    type: "root",
    version: 1,
  },
} as unknown as SerializedEditorState;

export function parseContent(
  value: string | null | undefined
): SerializedEditorState {
  if (!value) return initialEditorState;
  try {
    return JSON.parse(value) as SerializedEditorState;
  } catch {
    return initialEditorState;
  }
}

interface Note {
  _id: Id<"notes">;
  title: string;
  content: string;
  tags: Id<"tags">[];
  updatedAt: number;
}

export function useNoteDrafts(notes: Note[] | undefined) {
  const [drafts, setDrafts] = useState<Record<string, NoteDraft>>({});

  useEffect(() => {
    if (!notes) return;
    setDrafts((prev) => {
      let didChange = false;
      const next = { ...prev };
      for (const note of notes) {
        const key = note._id;
        const existing = next[key];
        if (!existing) {
          next[key] = {
            title: note.title,
            content: parseContent(note.content),
            tags: note.tags ?? [],
            isDirty: false,
            updatedAt: note.updatedAt,
          };
          didChange = true;
          continue;
        }
        if (!existing.isDirty && existing.updatedAt !== note.updatedAt) {
          next[key] = {
            title: note.title,
            content: parseContent(note.content),
            tags: note.tags ?? [],
            isDirty: false,
            updatedAt: note.updatedAt,
          };
          didChange = true;
        }
      }
      return didChange ? next : prev;
    });
  }, [notes]);

  return { drafts, setDrafts, initialEditorState };
}

