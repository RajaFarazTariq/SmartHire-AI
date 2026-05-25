import Link from "next/link";
import {
  CalendarClock,
  Video,
  Users,
  ChevronRight,
  MessageSquare,
  CalendarX,
  CalendarPlus,
} from "lucide-react";

import {
  getOrgInterviews,
  getOrgMembers,
  getCandidatesAwaitingScheduling,
} from "./actions";
import { cn } from "@/lib/utils";
import { INTERVIEW_STATUS_STYLES, meetingProvider } from "@/lib/interview";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

type Interview = Awaited<ReturnType<typeof getOrgInterviews>>[number];

function fmt(d: Date | string) {
  return new Date(d).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function InterviewsPage() {
  const [interviews, members, awaiting] = await Promise.all([
    getOrgInterviews(),
    getOrgMembers(),
    getCandidatesAwaitingScheduling(),
  ]);
  const memberMap = new Map(members.map((m) => [m.id, m.name]));
  const now = Date.now();

  const isUpcoming = (i: Interview) =>
    new Date(i.scheduledAt).getTime() >= now && i.status === "Scheduled";
  const upcoming = interviews.filter(isUpcoming);
  const past = interviews
    .filter((i) => !isUpcoming(i))
    .sort(
      (a, b) =>
        new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
    );
  // upcoming ascending (soonest first)
  upcoming.sort(
    (a, b) =>
      new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );

  function Row({ iv }: { iv: Interview }) {
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
                <span className="font-normal text-muted-foreground">
                  {" "}
                  · {iv.type}
                </span>
              </p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                <span>{fmt(iv.scheduledAt)} · {iv.durationMins}m</span>
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
    <div>
      <PageHeader
        title="Interviews"
        description="Schedule, track, and review interviews across your team."
      />

      {interviews.length === 0 && awaiting.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <CalendarX className="size-6" />
          </span>
          <div>
            <p className="font-medium">No interviews yet</p>
            <p className="text-sm text-muted-foreground">
              Open a candidate and schedule their first interview.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {awaiting.length > 0 && (
            <section>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
                <CalendarPlus className="size-4" /> Awaiting scheduling (
                {awaiting.length})
              </h2>
              <div className="space-y-2.5">
                {awaiting.map((c) => (
                  <Link key={c.id} href={`/candidates/${c.id}`} className="block">
                    <Card className="group gap-0 border-amber-500/30 bg-amber-500/[0.04] transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-500/50 hover:shadow-md hover:shadow-amber-500/15">
                      <CardContent className="flex items-center gap-4 px-5 py-4">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                          <CalendarPlus className="size-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium transition-colors group-hover:text-primary">
                            {c.fullName ?? c.filename}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {c.currentTitle ?? "In “Interview Scheduled” stage"} ·
                            no interview booked yet
                          </p>
                        </div>
                        <span className="hidden shrink-0 text-xs font-medium text-amber-600 dark:text-amber-400 sm:block">
                          Schedule →
                        </span>
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

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
      )}
    </div>
  );
}
