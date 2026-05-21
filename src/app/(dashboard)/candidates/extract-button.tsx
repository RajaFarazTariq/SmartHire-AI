"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { extractCandidateAction } from "./actions";

export function ExtractButton({
  candidateId,
  status,
}: {
  candidateId: string;
  status: string;
}) {
  const [running, setRunning] = useState(false);
  const router = useRouter();

  async function run() {
    setRunning(true);
    try {
      const res = await extractCandidateAction(candidateId);
      if (res.ok) {
        toast.success("Extraction complete");
        router.refresh();
      } else {
        toast.error(res.error ?? "Extraction failed");
      }
    } catch {
      toast.error("Extraction failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <Button
      variant={status === "ready" ? "outline" : "default"}
      size="sm"
      onClick={run}
      disabled={running}
    >
      {running ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Sparkles className="size-4" />
      )}
      {running
        ? "Extracting…"
        : status === "ready"
          ? "Re-run extraction"
          : "Run AI extraction"}
    </Button>
  );
}
