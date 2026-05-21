export const PIPELINE_STAGES = [
  "Applied",
  "Shortlisted",
  "Interview",
  "Rejected",
  "Hired",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export function isPipelineStage(value: string): value is PipelineStage {
  return (PIPELINE_STAGES as readonly string[]).includes(value);
}

// Tailwind classes for stage badges/indicators, keyed by stage.
export const STAGE_STYLES: Record<PipelineStage, string> = {
  Applied: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
  Shortlisted: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Interview: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  Rejected: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  Hired: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

// Color used in charts, keyed by stage.
export const STAGE_CHART_COLORS: Record<PipelineStage, string> = {
  Applied: "#64748b",
  Shortlisted: "#3b82f6",
  Interview: "#8b5cf6",
  Rejected: "#f43f5e",
  Hired: "#10b981",
};
