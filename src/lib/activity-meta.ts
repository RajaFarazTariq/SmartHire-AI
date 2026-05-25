import {
  Briefcase,
  Pencil,
  Trash2,
  UploadCloud,
  GitBranch,
  Sparkles,
  CalendarClock,
  Activity,
  type LucideIcon,
} from "lucide-react";

export const ACTIVITY_TYPES = [
  { value: "job.created", label: "Job created" },
  { value: "job.updated", label: "Job updated" },
  { value: "job.deleted", label: "Job deleted" },
  { value: "candidate.uploaded", label: "Resume uploaded" },
  { value: "candidate.stage_changed", label: "Stage changed" },
  { value: "candidates.scored", label: "Candidates scored" },
  { value: "interview.scheduled", label: "Interview scheduled" },
] as const;

export function activityIcon(type: string): LucideIcon {
  switch (type) {
    case "job.created":
      return Briefcase;
    case "job.updated":
      return Pencil;
    case "job.deleted":
      return Trash2;
    case "candidate.uploaded":
      return UploadCloud;
    case "candidate.stage_changed":
      return GitBranch;
    case "candidates.scored":
      return Sparkles;
    case "interview.scheduled":
      return CalendarClock;
    default:
      return Activity;
  }
}

export function activityLabel(type: string): string {
  return ACTIVITY_TYPES.find((t) => t.value === type)?.label ?? type;
}

export function timeAgo(date: Date | string): string {
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
