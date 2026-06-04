"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CalendarClock,
  Video,
  Users,
  ChevronRight,
  MessageSquare,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  INTERVIEW_STATUS_STYLES,
  INTERVIEW_STATUSES,
  INTERVIEW_TYPES,
  meetingProvider,
} from "@/lib/interview";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FilterBar,
  applyFilters,
  type FilterField,
  type FilterRule,
} from "@/components/ui/filter-bar";

export type InterviewItem = {
  id: string;
  candidate: { id: string; fullName: string | null; filename: string };
  type: string;
  scheduledAt: string | Date;
  durationMins: number;
  status: string;
  job: { title: string };
  interviewerIds: string[];
  feedback: { id: string }[];
  meetingLink: string | null;
};

function fmt(d: Date | string) {
  return new Date(d).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function InterviewsList({
  interviews,
  members,
}: {
  interviews: InterviewItem[];
  members: { id: string; name: string }[];
}) {
  const memberMap = useMemo(
    () => new Map(members.map((m) => [m.id, m.name])),
    [members],
  );
  const [filters, setFilters] = useState<FilterRule[]>([]);

  const filterFields = useMemo<FilterField<InterviewItem>[]>(() => {
    const jobs = Array.from(
      new Set(interviews.map((i) => i.job.title)),
    ).sort();
    return [
      { key: "candidate", label: "Candidate", control: { kind: "text" }, accessor: (i) => i.candidate.fullName ?? i.candidate.filename },
      { key: "job", label: "Job", control: { kind: "select", options: jobs }, accessor: (i) => i.job.title },
      { key: "type", label: "Type", control: { kind: "select", options: [...INTERVIEW_TYPES] }, accessor: (i) => i.type },
      { key: "status", label: "Status", control: { kind: "select", options: [...INTERVIEW_STATUSES] }, accessor: (i) => i.status },
      { key: "date", label: "Date", control: { kind: "date" }, accessor: (i) => new Date(i.scheduledAt) },
    ];
  }, [interviews]);

  const filtered = useMemo(
    () => applyFilters(interviews, filters, filterFields),
    [interviews, filters, filterFields],
  );

  const now = Date.now();
  const isUpcoming = (i: InterviewItem) =>
    new Date(i.scheduledAt).getTime() >= now && i.status === "Scheduled";
  const upcoming = filtered
    .filter(isUpcoming)
    .sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );
  const past = filtered
    .filter((i) => !isUpcoming(i))
    .sort(
      (a, b) =>
        new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
    );

  function Row({ iv }: { iv: InterviewItem }) {
    return (
      <Link href={`/candidates/${iv.candidate.id}`} className="block">
        <Card className="group gap-0 transition-all duration-200 hover:-translate-y-0.5 hover:border-pink-500/40 hover:shadow-md hover:shadow-pink-500/15">
          <CardContent className="flex items-center gap-4 px-5 py-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-pink-500/10 text-pink-500">
              <CalendarClock className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium transition-colors group-hover:text-primary">
                {iv.candidate.fullName ?? iv.candidate.filename}
                <span className="font-normal text-muted-foreground"> · {iv.type}</span>
              </p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                <span>
                  {fmt(iv.scheduledAt)} · {iv.durationMins}m
                </span>
                <span className="truncate">{iv.job.title}</span>
                {iv.interviewerIds.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Users className="size-3.5" />
                    {iv.interviewerIds
                      .map((id) => memberMap.get(id) ?? "Member")
                      .join(", ")}
                  </span>
                )}
                {iv.feedback.length > 0 && (
                  <span className="flex items-center gap-1">
                    <MessageSquare className="size-3.5" /> {iv.feedback.length}
                  </span>
                )}
              </p>
            </div>
            {iv.meetingLink && (
              <span className="hidden shrink-0 items-center gap-1 text-xs text-pink-500 sm:flex">
                <Video className="size-3.5" /> {meetingProvider(iv.meetingLink)}
              </span>
            )}
            <Badge
              className={cn(
                "shrink-0 border-0",
                INTERVIEW_STATUS_STYLES[iv.status] ?? "",
              )}
            >
              {iv.status}
            </Badge>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {filtered.length} interview{filtered.length === 1 ? "" : "s"}
        </p>
        <FilterBar fields={filterFields} rules={filters} onChange={setFilters} />
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
          Upcoming ({upcoming.length})
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No upcoming interviews.
          </p>
        ) : (
          <div className="space-y-2.5">
            {upcoming.map((iv) => (
              <Row key={iv.id} iv={iv} />
            ))}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
            Past &amp; closed ({past.length})
          </h2>
          <div className="space-y-2.5">
            {past.map((iv) => (
              <Row key={iv.id} iv={iv} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
