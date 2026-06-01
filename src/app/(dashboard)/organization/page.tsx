import Link from "next/link";
import { OrganizationProfile } from "@clerk/nextjs";
import { UserPlus, ArrowRight } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/org";
import { isAdmin } from "@/lib/rbac";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function OrganizationPage() {
  const { orgId, role } = await requireWorkspace();
  const pendingCount = isAdmin(role)
    ? await prisma.organizationRequest.count({
        where: { orgId, status: "pending" },
      })
    : 0;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Organization"
        description="Manage your organization profile, logo, members, roles, and invitations."
      />

      {isAdmin(role) && (
        <Link href="/organization/requests" className="mb-4 block">
          <Card className="group gap-0 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md hover:shadow-primary/15">
            <CardContent className="flex items-center gap-3 px-5 py-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <UserPlus className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-medium">
                  Join requests
                  {pendingCount > 0 && (
                    <Badge className="border-0 bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      {pendingCount} pending
                    </Badge>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  Review recruiters asking to join this organization.
                </p>
              </div>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </CardContent>
          </Card>
        </Link>
      )}

      <OrganizationProfile
        routing="hash"
        appearance={{
          elements: {
            rootBox: "w-full",
            cardBox: "w-full max-w-none shadow-none border border-border",
          },
        }}
      />
    </div>
  );
}
