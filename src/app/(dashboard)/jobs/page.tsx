import Link from "next/link";
import { Plus } from "lucide-react";

import { getUserJobs } from "./actions";
import { JobsList } from "./jobs-list";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";

export default async function JobsPage() {
  const jobs = await getUserJobs();

  return (
    <div>
      <PageHeader title="Jobs" description="Roles you're hiring for.">
        <Button asChild>
          <Link href="/jobs/new">
            <Plus className="size-4" /> New job
          </Link>
        </Button>
      </PageHeader>
      <JobsList jobs={jobs} />
    </div>
  );
}
