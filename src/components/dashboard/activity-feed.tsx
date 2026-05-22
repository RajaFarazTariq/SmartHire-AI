import type { ActivityLog } from "@prisma/client";

import { activityIcon, timeAgo } from "@/lib/activity-meta";

export function ActivityFeed({ items }: { items: ActivityLog[] }) {
  if (items.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No activity yet. Create a job or upload resumes to get started.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {items.map((a) => {
        const Icon = activityIcon(a.type);
        return (
          <li key={a.id} className="flex gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-snug">{a.message}</p>
              <p className="text-xs text-muted-foreground">
                {timeAgo(a.createdAt)}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
