import Link from "next/link";
import { ClipboardList, Search } from "lucide-react";

import { getMyApplications } from "./actions";
import { PortalHeader } from "@/components/portal/portal-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApplicationsList } from "@/components/portal/applications-list";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const applications = await getMyApplications();

  return (
    <div>
      <PortalHeader
        title="My applications"
        description="Track the status of every role you've applied to."
      />

      {applications.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ClipboardList className="size-6" />
          </span>
          <div>
            <p className="font-medium">No applications yet</p>
            <p className="text-sm text-muted-foreground">
              Browse open roles and submit your first application.
            </p>
          </div>
          <Button asChild>
            <Link href="/portal/jobs">
              <Search className="size-4" /> Browse jobs
            </Link>
          </Button>
        </Card>
      ) : (
        <ApplicationsList applications={applications} />
      )}
    </div>
  );
}
