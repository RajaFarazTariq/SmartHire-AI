"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, StickyNote } from "lucide-react";
import { toast } from "sonner";

import { addNoteAction, deleteNoteAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type NoteItem = {
  id: string;
  body: string;
  createdAt: Date | string;
  author: string;
};

function timeAgo(date: Date | string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(date).toLocaleDateString();
}

export function NotesPanel({
  candidateId,
  notes,
}: {
  candidateId: string;
  notes: NoteItem[];
}) {
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function add() {
    if (!body.trim() || pending) return;
    startTransition(async () => {
      const res = await addNoteAction(candidateId, body);
      if (res.ok) {
        setBody("");
        router.refresh();
      } else {
        toast.error(res.error ?? "Failed to add note");
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const res = await deleteNoteAction(id);
      if (res.ok) {
        router.refresh();
      } else {
        toast.error(res.error ?? "Failed to delete note");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <StickyNote className="size-4 text-muted-foreground" />
          Notes
          {notes.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({notes.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add a note about this candidate…"
            rows={3}
            maxLength={2000}
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={add} disabled={pending || !body.trim()}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Add note
            </Button>
          </div>
        </div>

        {notes.length > 0 && (
          <ul className="space-y-3">
            {notes.map((n) => (
              <li
                key={n.id}
                className="group rounded-lg border bg-muted/30 p-3"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium">{n.author}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(n.createdAt)}
                    </span>
                    <button
                      onClick={() => remove(n.id)}
                      disabled={pending}
                      className="text-muted-foreground opacity-0 transition hover:text-destructive group-hover:opacity-100"
                      aria-label="Delete note"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {n.body}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
