import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Clock,
  Briefcase,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

import { getJobForCandidate } from "../actions";
import { timeAgo } from "@/lib/activity-meta";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getJobForCandidate(id);
  if (!data) notFound();

  const { job, applied, applicationId } = data;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/portal/jobs"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All jobs
      </Link>

      <Card className="overflow-hidden">
        <CardHeader className="gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <CardTitle className="text-2xl">{job.title}</CardTitle>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Building2 className="size-4" /> {job.company ?? "Confidential"}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="size-4" /> Posted {timeAgo(job.createdAt)}
                </span>
                {job.minExperience != null && (
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="size-4" /> {job.minExperience}+ years
                  </span>
                )}
              </p>
            </div>

            {applied ? (
              <Button asChild variant="secondary" className="shrink-0">
                <Link href={`/portal/applications/${applicationId}`}>
                  <CheckCircle2 className="size-4 text-emerald-500" /> Track
                  application
                </Link>
              </Button>
            ) : (
              <Button asChild className="shrink-0">
                <Link href={`/portal/jobs/${job.id}/apply`}>
                  Apply now <ArrowRight className="size-4" />
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {job.requiredSkills.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold">Required skills</h2>
              <div className="flex flex-wrap gap-1.5">
                {job.requiredSkills.map((s) => (
                  <Badge key={s} variant="secondary" className="font-normal">
                    {s}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {job.preferredSkills.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold">Nice to have</h2>
              <div className="flex flex-wrap gap-1.5">
                {job.preferredSkills.map((s) => (
                  <Badge key={s} variant="outline" className="font-normal">
                    {s}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-2 text-sm font-semibold">About the role</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {job.description}
            </p>
          </section>

          {!applied && (
            <div className="border-t pt-5">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href={`/portal/jobs/${job.id}/apply`}>
                  Apply for this role <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
