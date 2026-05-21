"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { scoreCandidatesAction } from "./actions";

export function ScoreButton({
  jobId,
  hasScores,
}: {
  jobId: string;
  hasScores: boolean;
}) {
  const [running, setRunning] = useState(false);
  const router = useRouter();

  async function run() {
    setRunning(true);
    try {
      const res = await scoreCandidatesAction(jobId);
      if (!res.ok) {
        toast.error(res.error ?? "Scoring failed");
      } else if (res.scored === 0) {
        toast.info("No ready candidates to score yet. Upload and extract resumes first.");
      } else {
        toast.success(`Scored ${res.scored} candidate${res.scored === 1 ? "" : "s"}`);
        router.refresh();
      }
    } catch {
      toast.error("Scoring failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <Button onClick={run} disabled={running} size="sm">
      {running ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Sparkles className="size-4" />
      )}
      {running ? "Scoring…" : hasScores ? "Re-score candidates" : "Score candidates"}
    </Button>
  );
}
