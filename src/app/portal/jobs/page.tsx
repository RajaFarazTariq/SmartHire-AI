import { listOpenJobs, getAppliedJobIds } from "./actions";
import { PortalHeader } from "@/components/portal/portal-header";
import { JobsBrowser } from "@/components/portal/jobs-browser";

export const dynamic = "force-dynamic";

export default async function PortalJobsPage() {
  const [jobs, appliedIds] = await Promise.all([
    listOpenJobs(),
    getAppliedJobIds(),
  ]);

  return (
    <div>
      <PortalHeader
        title="Find your next role"
        description="Browse open positions and apply in minutes."
      />
      <JobsBrowser jobs={jobs} appliedIds={appliedIds} />
    </div>
  );
}
