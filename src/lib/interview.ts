export const INTERVIEW_TYPES = [
  "Phone Screen",
  "Technical",
  "Behavioral",
  "System Design",
  "Final",
] as const;
export type InterviewType = (typeof INTERVIEW_TYPES)[number];

// Phone Screen + Technical are always available; the rest are optional rounds an
// org can enable/disable.
export const REQUIRED_ROUNDS: InterviewType[] = ["Phone Screen", "Technical"];
export const OPTIONAL_ROUNDS: InterviewType[] = [
  "Behavioral",
  "System Design",
  "Final",
];

/** Rounds offered when scheduling = required + the org's enabled optional rounds. */
export function availableRounds(enabledOptional: string[]): InterviewType[] {
  return [
    ...REQUIRED_ROUNDS,
    ...OPTIONAL_ROUNDS.filter((r) => enabledOptional.includes(r)),
  ];
}

export const INTERVIEW_STATUSES = [
  "Scheduled",
  "Completed",
  "Cancelled",
  "No-show",
] as const;
export type InterviewStatus = (typeof INTERVIEW_STATUSES)[number];

export const RECOMMENDATIONS = [
  "Strong Yes",
  "Yes",
  "No",
  "Strong No",
] as const;
export type Recommendation = (typeof RECOMMENDATIONS)[number];

export const INTERVIEW_STATUS_STYLES: Record<string, string> = {
  Scheduled: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Cancelled: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
  "No-show": "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

export const RECOMMENDATION_STYLES: Record<string, string> = {
  "Strong Yes": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Yes: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  No: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "Strong No": "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

export type AIQuestionGroup = { category: string; questions: string[] };

export function isInterviewType(v: string): v is InterviewType {
  return (INTERVIEW_TYPES as readonly string[]).includes(v);
}
export function isInterviewStatus(v: string): v is InterviewStatus {
  return (INTERVIEW_STATUSES as readonly string[]).includes(v);
}
export function isRecommendation(v: string): v is Recommendation {
  return (RECOMMENDATIONS as readonly string[]).includes(v);
}

export type MeetingProvider = "Zoom" | "Google Meet" | "Teams" | "Custom";

/** Infers the video provider from a meeting URL, for labelling join links. */
export function meetingProvider(
  url: string | null | undefined,
): MeetingProvider | null {
  if (!url) return null;
  const u = url.toLowerCase();
  if (u.includes("zoom.us") || u.includes("zoom.com")) return "Zoom";
  if (u.includes("meet.google.com")) return "Google Meet";
  if (u.includes("teams.microsoft") || u.includes("teams.live")) return "Teams";
  return "Custom";
}
