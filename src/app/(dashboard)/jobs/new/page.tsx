import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createJobAction } from "../actions";
import { JobForm } from "../job-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default function NewJobPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/jobs"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to jobs
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Create a job</CardTitle>
          <CardDescription>
            Describe the role and the skills you&apos;re screening for.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <JobForm action={createJobAction} submitLabel="Create job" />
        </CardContent>
      </Card>
    </div>
  );
}
