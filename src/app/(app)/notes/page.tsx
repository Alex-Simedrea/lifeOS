"use client";

import { NotesContent } from "@/components/notes/notes-content";

export default function NotesPage() {
  return (
    <div className="-mx-4 -my-8 -ml-6 sm:-mx-6 lg:-mx-12 h-[calc(100vh-2rem)]">
      <NotesContent />
    </div>
  );
}

