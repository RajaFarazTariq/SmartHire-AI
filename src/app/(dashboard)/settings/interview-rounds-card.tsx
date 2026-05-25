"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CalendarClock, Lock } from "lucide-react";

import { cn } from "@/lib/utils";
import { REQUIRED_ROUNDS, OPTIONAL_ROUNDS } from "@/lib/interview";
import { updateEnabledRoundsAction } from "../interviews/actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function InterviewRoundsCard({ enabled: initial }: { enabled: string[] }) {
  const [enabled, setEnabled] = useState<string[]>(initial);
  const [, startTransition] = useTransition();

  function toggle(round: string) {
    const prev = enabled;
    const next = enabled.includes(round)
      ? enabled.filter((r) => r !== round)
      : [...enabled, round];
    setEnabled(next);
    startTransition(async () => {
      const res = await updateEnabledRoundsAction(next);
      if (!res.ok) {
        setEnabled(prev);
        toast.error(res.error ?? "Failed to update");
      } else {
        toast.success("Interview rounds updated");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="size-4 text-muted-foreground" />
          Interview rounds
        </CardTitle>
        <CardDescription>
          Choose which optional rounds your team can schedule. Phone Screen and
          Technical are always available.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {REQUIRED_ROUNDS.map((r) => (
          <div
            key={r}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <span className="text-sm font-medium">{r}</span>
            <Badge variant="secondary" className="gap-1 font-normal">
              <Lock className="size-3" /> Required
            </Badge>
          </div>
        ))}
        {OPTIONAL_ROUNDS.map((r) => {
          const on = enabled.includes(r);
          return (
            <button
              key={r}
              type="button"
              onClick={() => toggle(r)}
              className="flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-accent"
            >
              <span className="text-sm font-medium">{r}</span>
              <span
                className={cn(
                  "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                  on ? "bg-primary" : "bg-muted-foreground/30",
                )}
                role="switch"
                aria-checked={on}
              >
                <span
                  className={cn(
                    "absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-all",
                    on ? "left-[18px]" : "left-0.5",
                  )}
                />
              </span>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
