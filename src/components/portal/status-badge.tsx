import { cn } from "@/lib/utils";
import { STAGE_STYLES, isPipelineStage } from "@/lib/pipeline";

export function StatusBadge({
  stage,
  className,
}: {
  stage: string;
  className?: string;
}) {
  const styleKey = isPipelineStage(stage) ? stage : "Applied";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STAGE_STYLES[styleKey],
        className,
      )}
    >
      {stage}
    </span>
  );
}
