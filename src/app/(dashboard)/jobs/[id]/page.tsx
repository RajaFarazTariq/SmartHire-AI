import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Briefcase, Calendar, GraduationCap, Download } from "lucide-react";

import { getJob, getJobScores } from "../actions";
import { JobDetailActions } from "../job-detail-actions";
import { ScoreButton } from "../score-button";
import { CandidateRanking } from "../candidate-ranking";
import { RecommendationsPanel } from "../recommendations-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await getJob(id);

  if (!job) {
    notFound();
  }

  const scores = await getJobScores(id);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/jobs"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to jobs
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Briefcase className="size-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{job.title}</h1>
            {job.company && (
              <p className="text-muted-foreground">{job.company}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="size-3.5" />
                {job.createdAt.toLocaleDateString()}
              </span>
              {job.minExperience != null && (
                <span className="flex items-center gap-1">
                  <GraduationCap className="size-3.5" />
                  {job.minExperience}+ years experience
                </span>
              )}
            </div>
          </div>
        </div>
        <JobDetailActions jobId={job.id} jobTitle={job.title} />
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto pr-1">
              <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                {job.description}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Required skills</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {job.requiredSkills.map((s) => (
              <Badge key={s}>{s}</Badge>
            ))}
          </CardContent>
        </Card>

        {job.preferredSkills.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preferred skills</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {job.preferredSkills.map((s) => (
                <Badge key={s} variant="secondary">
                  {s}
                </Badge>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <section className="mt-10">
        <RecommendationsPanel jobId={job.id} />
      </section>

      <section className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Candidate ranking</h2>
            <p className="text-sm text-muted-foreground">
              {scores.length > 0
                ? `${scores.length} candidate${scores.length === 1 ? "" : "s"} scored against this job`
                : "Score your ready candidates against this job's requirements"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {scores.length > 0 && (
              <Button asChild variant="outline" size="sm">
                <a href={`/api/jobs/${job.id}/export`}>
                  <Download className="size-4" /> Export CSV
                </a>
              </Button>
            )}
            <ScoreButton jobId={job.id} hasScores={scores.length > 0} />
          </div>
        </div>

        {scores.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No candidates scored yet.
              </p>
              <p className="text-xs text-muted-foreground">
                Click “Score candidates” to rank your uploaded resumes by fit.
              </p>
            </CardContent>
          </Card>
        ) : (
          <CandidateRanking scores={scores} />
        )}
      </section>
    </div>
  );
}
