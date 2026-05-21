"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import {
  PIPELINE_STAGES,
  STAGE_STYLES,
  STAGE_CHART_COLORS,
  isPipelineStage,
  type PipelineStage,
} from "@/lib/pipeline";
import { updateCandidateStageAction } from "./actions";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export function StageSelect({
  candidateId,
  stage,
}: {
  candidateId: string;
  stage: string;
}) {
  const [current, setCurrent] = useState<PipelineStage>(
    isPipelineStage(stage) ? stage : "Applied",
  );
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function change(next: PipelineStage) {
    if (next === current || pending) return;
    const prev = current;
    setCurrent(next);
    startTransition(async () => {
      const res = await updateCandidateStageAction(candidateId, next);
      if (res.ok) {
        toast.success(`Moved to ${next}`);
        router.refresh();
      } else {
        setCurrent(prev);
        toast.error(res.error ?? "Failed to update stage");
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          disabled={pending}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-opacity disabled:opacity-60",
            STAGE_STYLES[current],
          )}
        >
          {pending ? <Loader2 className="size-3 animate-spin" /> : null}
          {current}
          <ChevronDown className="size-3.5 opacity-70" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {PIPELINE_STAGES.map((s) => (
          <DropdownMenuItem key={s} onSelect={() => change(s)}>
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: STAGE_CHART_COLORS[s] }}
            />
            {s}
            {s === current && <Check className="ml-auto size-3.5" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
