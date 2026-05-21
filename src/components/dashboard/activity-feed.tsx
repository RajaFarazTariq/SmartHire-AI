import type { ActivityLog } from "@prisma/client";
import {
  Briefcase,
  Trash2,
  UploadCloud,
  Sparkles,
  GitBranch,
  Activity,
  Pencil,
} from "lucide-react";

function iconFor(type: string) {
  switch (type) {
    case "job.created":
      return Briefcase;
    case "job.updated":
      return Pencil;
    case "job.deleted":
      return Trash2;
    case "candidate.uploaded":
      return UploadCloud;
    case "candidates.scored":
      return Sparkles;
    case "candidate.stage_changed":
      return GitBranch;
    default:
      return Activity;
  }
}

function timeAgo(date: Date) {
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
        const Icon = iconFor(a.type);
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
