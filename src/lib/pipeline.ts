export const PIPELINE_STAGES = [
  "Applied",
  "Under Review",
  "Shortlisted",
  "Interview Scheduled",
  "Technical Assessment",
  "Final Review",
  "Hired",
  "Rejected",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

// Ordered progression a candidate moves through. "Rejected" sits off this track
// (a candidate can be rejected from any stage), so it's excluded here and the
// timeline UI renders it as a terminal off-track state.
export const TRACK_STAGES: PipelineStage[] = [
  "Applied",
  "Under Review",
  "Shortlisted",
  "Interview Scheduled",
  "Technical Assessment",
  "Final Review",
  "Hired",
];

export function isPipelineStage(value: string): value is PipelineStage {
  return (PIPELINE_STAGES as readonly string[]).includes(value);
}

export function isTerminalStage(stage: PipelineStage): boolean {
  return stage === "Hired" || stage === "Rejected";
}

/** Position of a stage on the progression track (-1 for off-track / unknown). */
export function trackIndex(stage: string): number {
  return TRACK_STAGES.indexOf(stage as PipelineStage);
}

// Tailwind classes for stage badges/indicators, keyed by stage.
export const STAGE_STYLES: Record<PipelineStage, string> = {
  Applied: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
  "Under Review": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  Shortlisted: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "Interview Scheduled": "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  "Technical Assessment": "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  "Final Review": "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  Hired: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Rejected: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

// Color used in charts and timeline dots, keyed by stage.
export const STAGE_CHART_COLORS: Record<PipelineStage, string> = {
  Applied: "#64748b",
  "Under Review": "#f59e0b",
  Shortlisted: "#3b82f6",
  "Interview Scheduled": "#8b5cf6",
  "Technical Assessment": "#6366f1",
  "Final Review": "#06b6d4",
  Hired: "#10b981",
  Rejected: "#f43f5e",
};

// Candidate-facing copy explaining what each stage means.
export const STAGE_DESCRIPTIONS: Record<PipelineStage, string> = {
  Applied: "Your application has been received.",
  "Under Review": "The hiring team is reviewing your application.",
  Shortlisted: "You've been shortlisted for this role.",
  "Interview Scheduled": "An interview has been scheduled with you.",
  "Technical Assessment": "You're in the technical assessment stage.",
  "Final Review": "Your application is in final review.",
  Hired: "Congratulations — you've been hired!",
  Rejected: "This application was not selected to move forward.",
};
