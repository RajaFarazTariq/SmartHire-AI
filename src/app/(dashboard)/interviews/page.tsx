import Link from "next/link";
import { ChevronRight, CalendarX, CalendarPlus } from "lucide-react";

import {
  getOrgInterviews,
  getOrgMembers,
  getCandidatesAwaitingScheduling,
} from "./actions";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { InterviewsList } from "./interviews-list";

export const dynamic = "force-dynamic";

export default async function InterviewsPage() {
  const [interviews, members, awaiting] = await Promise.all([
    getOrgInterviews(),
    getOrgMembers(),
    getCandidatesAwaitingScheduling(),
  ]);

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

          <InterviewsList interviews={interviews} members={members} />
        </div>
      )}
    </div>
  );
}
