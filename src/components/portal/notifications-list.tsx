"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCheck,
  Inbox,
  Bell,
  GitBranch,
  FileCheck2,
  CalendarClock,
  AtSign,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/activity-meta";
import { Button } from "@/components/ui/button";
import {
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "@/app/portal/notifications/actions";

function iconFor(type: string) {
  if (type === "application.status") return GitBranch;
  if (type === "application.submitted") return FileCheck2;
  if (type === "interview.scheduled") return CalendarClock;
  if (type === "note.mention") return AtSign;
  return Bell;
}

export function NotificationsList({ initial }: { initial: NotificationItem[] }) {
  const [items, setItems] = useState(initial);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const hasUnread = items.some((n) => !n.read);

  function open(n: NotificationItem) {
    if (!n.read) {
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
      );
      startTransition(() => {
        markNotificationRead(n.id);
      });
    }
    if (n.link) router.push(n.link);
  }

  function markAll() {
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    startTransition(() => {
      markAllNotificationsRead();
    });
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Inbox className="size-6" />
        </span>
        <div>
          <p className="font-medium">No notifications yet</p>
          <p className="text-sm text-muted-foreground">
            Updates about your applications will show up here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {hasUnread && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={markAll}>
            <CheckCheck className="size-4" /> Mark all read
          </Button>
        </div>
      )}
      <div className="overflow-hidden rounded-xl border">
        {items.map((n) => {
          const Icon = iconFor(n.type);
          return (
            <button
              key={n.id}
              onClick={() => open(n)}
              className={cn(
                "flex w-full gap-3 border-b px-4 py-3.5 text-left transition-colors last:border-b-0 hover:bg-accent",
                !n.read && "bg-primary/5",
              )}
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg",
                  n.read
                    ? "bg-muted text-muted-foreground"
                    : "bg-primary/10 text-primary",
                )}
              >
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{n.title}</p>
                {n.body && (
                  <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                )}
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {timeAgo(n.createdAt)}
                </p>
              </div>
              {!n.read && (
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
