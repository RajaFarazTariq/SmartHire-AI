import Link from "next/link";
import { Building2, Clock, ChevronRight, ClipboardList, Search } from "lucide-react";

import { getMyApplications } from "./actions";
import { timeAgo } from "@/lib/activity-meta";
import { cn } from "@/lib/utils";
import { CARD_HOVER, CARD_HOVER_BASE } from "@/lib/card-accents";
import { PortalHeader } from "@/components/portal/portal-header";
import { StatusBadge } from "@/components/portal/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
        <div className="space-y-3">
          {applications.map((a) => (
            <Link key={a.id} href={`/portal/applications/${a.id}`} className="block">
              <Card
                className={cn("group gap-0", CARD_HOVER_BASE, CARD_HOVER.primary)}
              >
                <CardContent className="flex items-center gap-4 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold transition-colors group-hover:text-primary">
                      {a.jobTitle}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="size-3.5" />
                        {a.company ?? "Confidential"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="size-3.5" /> Applied {timeAgo(a.createdAt)}
                      </span>
                    </p>
                  </div>
                  <StatusBadge stage={a.stage} />
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
