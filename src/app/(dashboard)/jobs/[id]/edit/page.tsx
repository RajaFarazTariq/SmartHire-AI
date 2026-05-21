import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getJob, updateJobAction } from "../../actions";
import { JobForm } from "../../job-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await getJob(id);

  if (!job) {
    notFound();
  }

  const action = updateJobAction.bind(null, job.id);

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/jobs/${job.id}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to job
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Edit job</CardTitle>
          <CardDescription>Update the role details and skills.</CardDescription>
        </CardHeader>
        <CardContent>
          <JobForm
            action={action}
            submitLabel="Save changes"
            defaults={{
              title: job.title,
              company: job.company ?? "",
              description: job.description,
              requiredSkills: job.requiredSkills.join(", "),
              preferredSkills: job.preferredSkills.join(", "),
              minExperience:
                job.minExperience != null ? String(job.minExperience) : "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
