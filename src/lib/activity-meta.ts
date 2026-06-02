import {
  Briefcase,
  Pencil,
  Trash2,
  UploadCloud,
  GitBranch,
  Sparkles,
  CalendarClock,
  Activity,
  UserPlus,
  UserCog,
  UserMinus,
  Mail,
  MailX,
  Building2,
  ShieldAlert,
  CheckCircle2,
  XCircle,
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
  { value: "org.member_added", label: "Member added" },
  { value: "org.role_changed", label: "Role changed" },
  { value: "org.member_removed", label: "Member removed" },
  { value: "org.member_invited", label: "Member invited" },
  { value: "org.invitation_revoked", label: "Invitation revoked" },
  { value: "org.request_submitted", label: "Join request submitted" },
  { value: "org.request_approved", label: "Join request approved" },
  { value: "org.request_rejected", label: "Join request rejected" },
  { value: "org.deleted", label: "Organization deleted" },
  { value: "security.escalation_attempt", label: "Privilege escalation attempt" },
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
    case "org.member_added":
      return UserPlus;
    case "org.role_changed":
      return UserCog;
    case "org.member_removed":
      return UserMinus;
    case "org.member_invited":
      return Mail;
    case "org.invitation_revoked":
      return MailX;
    case "org.request_submitted":
      return UserPlus;
    case "org.request_approved":
      return CheckCircle2;
    case "org.request_rejected":
      return XCircle;
    case "org.deleted":
      return Building2;
    case "security.escalation_attempt":
      return ShieldAlert;
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
