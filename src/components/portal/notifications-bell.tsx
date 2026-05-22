"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Inbox } from "lucide-react";

import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/activity-meta";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  getMyNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "@/app/portal/notifications/actions";

export function NotificationsBell({
  initialCount = 0,
}: {
  initialCount?: number;
}) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [count, setCount] = useState(initialCount);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const refresh = useCallback(async () => {
    try {
      const [list, c] = await Promise.all([
        getMyNotifications(8),
        getUnreadCount(),
      ]);
      setItems(list);
      setCount(c);
    } catch {
      /* transient — next poll retries */
    }
  }, []);

  // Poll for near-real-time updates while the portal is open.
  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  function handleClick(n: NotificationItem) {
    if (!n.read) {
      startTransition(async () => {
        await markNotificationRead(n.id);
        refresh();
      });
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  function handleMarkAll() {
    startTransition(async () => {
      await markAllNotificationsRead();
      refresh();
    });
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
          {count > 0 && (
            <span className="absolute right-1.5 top-1.5 flex min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold leading-4 text-white">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2.5">
          <p className="text-sm font-semibold">Notifications</p>
          {count > 0 && (
            <button
              onClick={handleMarkAll}
              className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <CheckCheck className="size-3.5" /> Mark all read
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-3 py-8 text-center text-muted-foreground">
              <Inbox className="size-6" />
              <p className="text-sm">You're all caught up</p>
            </div>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={cn(
                  "flex w-full gap-2.5 border-b px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-accent",
                  !n.read && "bg-primary/5",
                )}
              >
                <span
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    n.read ? "bg-transparent" : "bg-primary",
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {n.title}
                  </span>
                  {n.body && (
                    <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
                      {n.body}
                    </span>
                  )}
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">
                    {timeAgo(n.createdAt)}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>

        <Link
          href="/portal/notifications"
          onClick={() => setOpen(false)}
          className="block border-t px-3 py-2.5 text-center text-sm font-medium text-primary transition-colors hover:bg-accent"
        >
          View all notifications
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
