"use client";

import { useEffect, useRef, useState, useTransition, useCallback } from "react";
import { Loader2, Trash2, StickyNote, AtSign } from "lucide-react";
import { toast } from "sonner";

import { timeAgo } from "@/lib/activity-meta";
import {
  addNoteAction,
  deleteNoteAction,
  listCandidateNotes,
  type NoteListItem,
} from "./actions";
import type { OrgMember } from "../interviews/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Highlights "@Name" tokens that match a known teammate. */
function renderBody(body: string, memberNames: string[]) {
  if (memberNames.length === 0) return body;
  const pattern = new RegExp(
    `(@(?:${memberNames.map(escapeRegExp).join("|")}))`,
    "g",
  );
  return body.split(pattern).map((part, i) =>
    part.startsWith("@") && memberNames.includes(part.slice(1)) ? (
      <span key={i} className="font-medium text-primary">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export function NotesPanel({
  candidateId,
  notes: initialNotes,
  orgMembers,
}: {
  candidateId: string;
  notes: NoteListItem[];
  orgMembers: OrgMember[];
}) {
  const [notes, setNotes] = useState<NoteListItem[]>(initialNotes);
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const taRef = useRef<HTMLTextAreaElement>(null);

  const [suggestOpen, setSuggestOpen] = useState(false);
  const [query, setQuery] = useState("");
  const memberNames = orgMembers.map((m) => m.name);

  const refresh = useCallback(async () => {
    try {
      setNotes(await listCandidateNotes(candidateId));
    } catch {
      /* transient — next poll retries */
    }
  }, [candidateId]);

  // Near-real-time: poll so teammates' notes appear without a manual refresh.
  useEffect(() => {
    const id = setInterval(refresh, 15_000);
    return () => clearInterval(id);
  }, [refresh]);

  const suggestions = suggestOpen
    ? orgMembers
        .filter((m) => m.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 6)
    : [];

  function onChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    setBody(value);
    const caret = e.target.selectionStart ?? value.length;
    const match = /@([\w]*)$/.exec(value.slice(0, caret));
    if (match) {
      setQuery(match[1]);
      setSuggestOpen(true);
    } else {
      setSuggestOpen(false);
    }
  }

  function pickMention(name: string) {
    const ta = taRef.current;
    const caret = ta?.selectionStart ?? body.length;
    const before = body.slice(0, caret).replace(/@([\w]*)$/, `@${name} `);
    const next = before + body.slice(caret);
    setBody(next);
    setSuggestOpen(false);
    requestAnimationFrame(() => {
      ta?.focus();
      const pos = before.length;
      ta?.setSelectionRange(pos, pos);
    });
  }

  function add() {
    if (!body.trim() || pending) return;
    const mentionIds = orgMembers
      .filter((m) => body.includes(`@${m.name}`))
      .map((m) => m.id);
    startTransition(async () => {
      const res = await addNoteAction(candidateId, body, mentionIds);
      if (res.ok) {
        setBody("");
        setSuggestOpen(false);
        refresh();
      } else {
        toast.error(res.error ?? "Failed to add note");
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const res = await deleteNoteAction(id);
      if (res.ok) refresh();
      else toast.error(res.error ?? "Failed to delete note");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <StickyNote className="size-4 text-muted-foreground" />
          Team notes
          {notes.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({notes.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="relative">
            <Textarea
              ref={taRef}
              value={body}
              onChange={onChange}
              placeholder="Add a note… type @ to mention a teammate"
              rows={3}
              maxLength={2000}
            />
            {suggestOpen && suggestions.length > 0 && (
              <div className="absolute z-20 mt-1 w-56 overflow-hidden rounded-lg border bg-popover shadow-lg">
                {suggestions.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => pickMention(m.name)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                  >
                    <AtSign className="size-3.5 text-muted-foreground" />
                    <span className="truncate">{m.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <AtSign className="size-3" /> mention teammates to notify them
            </span>
            <Button size="sm" onClick={add} disabled={pending || !body.trim()}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Add note
            </Button>
          </div>
        </div>

        {notes.length > 0 && (
          <ul className="space-y-3">
            {notes.map((n) => (
              <li key={n.id} className="group rounded-lg border bg-muted/30 p-3">
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
                  {renderBody(n.body, memberNames)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
