import Link from "next/link";
import { UploadCloud } from "lucide-react";

import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/activity-meta";
import { STAGE_STYLES, isPipelineStage } from "@/lib/pipeline";
import type { RecentUpload } from "@/app/(dashboard)/dashboard/actions";

const STATUS_DOT: Record<string, string> = {
  ready: "bg-emerald-500",
  processing: "bg-amber-500",
  error: "bg-rose-500",
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function RecentUploads({ items }: { items: RecentUpload[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
        <UploadCloud className="size-6" />
        <p className="text-sm">No resumes uploaded yet.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {items.map((c) => {
        const name = c.fullName ?? c.filename;
        const stageKey = isPipelineStage(c.stage) ? c.stage : "Applied";
        return (
          <Link
            key={c.id}
            href={`/candidates/${c.id}`}
            className="group flex items-center gap-3 rounded-xl border p-3 transition-colors hover:border-primary/40 hover:bg-accent"
          >
            <span className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {initials(name)}
              <span
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-card",
                  STATUS_DOT[c.status] ?? "bg-muted-foreground",
                )}
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium transition-colors group-hover:text-primary">
                {name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {c.currentTitle ?? "Resume"} · {timeAgo(c.uploadedAt)}
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                STAGE_STYLES[stageKey],
              )}
            >
              {c.stage}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
