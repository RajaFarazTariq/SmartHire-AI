import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getJobForCandidate } from "../../actions";
import { getCandidateContext } from "@/lib/candidate";
import { ApplyForm } from "@/components/portal/apply-form";

export const dynamic = "force-dynamic";

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getJobForCandidate(id);
  if (!data) notFound();
  if (data.applied) redirect(`/portal/applications/${data.applicationId}`);

  const { profile } = await getCandidateContext();

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/portal/jobs/${id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to job
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Apply</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data.job.title}
          {data.job.company ? ` · ${data.job.company}` : ""}
        </p>
      </div>

      <ApplyForm
        jobId={id}
        defaults={{
          linkedinUrl: profile?.linkedinUrl ?? "",
          githubUrl: profile?.githubUrl ?? "",
          portfolioUrl: profile?.portfolioUrl ?? "",
        }}
        profileResume={
          profile?.resumeUrl
            ? {
                name: profile.resumeName ?? "Your saved resume",
                type: profile.resumeType ?? "",
              }
            : null
        }
      />
    </div>
  );
}
