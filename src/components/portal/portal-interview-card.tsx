"use client";

import { useEffect, useState } from "react";
import {
  CalendarClock,
  MapPin,
  Video,
  Copy,
  Check,
  AlarmClock,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { INTERVIEW_STATUS_STYLES, meetingProvider } from "@/lib/interview";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type PortalInterview = {
  id: string;
  type: string;
  status: string;
  scheduledAt: string | Date;
  durationMins: number;
  meetingLink: string | null;
  location: string | null;
};

function fmtFull(d: Date) {
  return d.toLocaleString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Countdown / live-window label. Returns null once the interview is well past. */
function relativeLabel(now: Date, start: Date, end: Date): string | null {
  const ms = start.getTime() - now.getTime();
  if (now >= start && now <= end) return "Happening now";
  if (now > end) {
    // Within an hour of finishing, still useful to show
    const since = now.getTime() - end.getTime();
    if (since < 60 * 60_000) return "Just finished";
    return null;
  }
  const mins = Math.round(ms / 60_000);
  if (mins < 60) return `Starts in ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `Starts in ${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.round(hours / 24);
  return `Starts in ${days} day${days === 1 ? "" : "s"}`;
}

export function PortalInterviewCard({ interview }: { interview: PortalInterview }) {
  const start = new Date(interview.scheduledAt);
  const end = new Date(start.getTime() + interview.durationMins * 60_000);
  // 10-minute join window before the start, plus the duration itself.
  const joinOpen = new Date(start.getTime() - 10 * 60_000);

  const [now, setNow] = useState<Date | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const isLive = !!now && now >= joinOpen && now <= end;
  const upcoming = interview.status === "Scheduled";
  const relative = now ? relativeLabel(now, start, end) : null;
  const provider = interview.meetingLink ? meetingProvider(interview.meetingLink) : null;

  async function copyLink() {
    if (!interview.meetingLink) return;
    try {
      await navigator.clipboard.writeText(interview.meetingLink);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy");
    }
  }

  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-colors",
        isLive && upcoming && "border-emerald-500/50 bg-emerald-500/5",
      )}
    >
      <div className="flex flex-wrap items-start gap-3">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            isLive && upcoming
              ? "bg-emerald-500/15 text-emerald-600"
              : "bg-primary/10 text-primary",
          )}
        >
          <CalendarClock className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{interview.type}</p>
            <Badge
              className={cn(
                "shrink-0 border-0",
                INTERVIEW_STATUS_STYLES[interview.status] ?? "",
              )}
            >
              {interview.status}
            </Badge>
            {relative && upcoming && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                  isLive
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <AlarmClock className="size-3" /> {relative}
              </span>
            )}
          </div>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span>
              {fmtFull(start)} · {interview.durationMins} min
            </span>
            {interview.location && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" /> {interview.location}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Meeting link block */}
      {interview.meetingLink ? (
        <div className="mt-3 rounded-md border bg-background p-2.5">
          <div className="flex items-center gap-2">
            <Video className="size-4 shrink-0 text-muted-foreground" />
            <a
              href={interview.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="min-w-0 flex-1 truncate text-xs text-primary hover:underline"
              title={interview.meetingLink}
            >
              {provider ? `${provider} · ${interview.meetingLink}` : interview.meetingLink}
            </a>
            <button
              onClick={copyLink}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Copy meeting link"
              title="Copy link"
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            </button>
          </div>
          {upcoming && (
            <div className="mt-2">
              <Button
                asChild
                size="sm"
                className={cn(
                  "w-full",
                  isLive
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "",
                )}
                disabled={!isLive && !!now}
                variant={isLive ? "default" : "outline"}
              >
                <a
                  href={interview.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-disabled={!isLive && !!now}
                  onClick={(e) => {
                    if (now && !isLive) {
                      e.preventDefault();
                      toast.info("The join button opens 10 minutes before start");
                    }
                  }}
                >
                  <Video className="size-4" />
                  {isLive ? "Join meeting now" : "Join meeting"}
                </a>
              </Button>
            </div>
          )}
        </div>
      ) : (
        upcoming && (
          <p className="mt-3 rounded-md border border-dashed bg-muted/40 p-2.5 text-xs text-muted-foreground">
            The recruiter hasn&apos;t shared a meeting link yet. You&apos;ll be
            notified as soon as it&apos;s added.
          </p>
        )
      )}
    </div>
  );
}
