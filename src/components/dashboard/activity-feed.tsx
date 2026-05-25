import type { ActivityLog } from "@prisma/client";

import { cn } from "@/lib/utils";
import { activityIcon, timeAgo } from "@/lib/activity-meta";

const TYPE_TILE: Record<string, string> = {
  "job.created": "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  "job.updated": "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  "job.deleted": "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  "candidate.uploaded": "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  "candidate.stage_changed": "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  "candidates.scored": "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
};

export function ActivityFeed({ items }: { items: ActivityLog[] }) {
  if (items.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No activity yet. Create a job or upload resumes to get started.
      </p>
    );
  }

  return (
    <ol className="relative">
      {items.map((a, i) => {
        const Icon = activityIcon(a.type);
        const last = i === items.length - 1;
        return (
          <li key={a.id} className="relative flex gap-3 pb-5 last:pb-0">
            {!last && (
              <span className="absolute left-4 top-9 h-[calc(100%-1.25rem)] w-px -translate-x-1/2 bg-border" />
            )}
            <span
              className={cn(
                "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full",
                TYPE_TILE[a.type] ?? "bg-muted text-muted-foreground",
              )}
            >
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <p className="text-sm leading-snug">{a.message}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {timeAgo(a.createdAt)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
