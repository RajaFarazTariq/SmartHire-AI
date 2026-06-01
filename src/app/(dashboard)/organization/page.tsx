import Link from "next/link";
import { clerkClient } from "@clerk/nextjs/server";
import {
  UserPlus,
  ArrowRight,
  Users,
  Briefcase,
  FileText,
  ShieldCheck,
  Building2,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/org";
import { isAdmin, roleLabel } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";
import { CARD_HOVER, CARD_HOVER_BASE } from "@/lib/card-accents";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MembersManager } from "./members-manager";
import {
  getOrgMembersDetailed,
  getOrgPendingInvitations,
} from "./member-actions";

export const dynamic = "force-dynamic";

export default async function OrganizationPage() {
  const { user, orgId, role } = await requireWorkspace();
  const admin = isAdmin(role);

  // Org details from Clerk (name, logo, member count).
  let orgName = "Your organization";
  let orgImageUrl: string | null = null;
  let memberCount = 0;
  try {
    const client = await clerkClient();
    const org = await client.organizations.getOrganization({
      organizationId: orgId,
    });
    orgName = org.name;
    orgImageUrl = org.imageUrl ?? null;
    memberCount = org.membersCount ?? 0;
  } catch (err) {
    console.error("Failed to load org:", err);
  }

  // Counts + members data — all org-scoped.
  const [jobsCount, candidatesCount, pendingRequests, members, invitations] =
    await Promise.all([
      prisma.job.count({ where: { orgId } }),
      prisma.candidate.count({ where: { orgId } }),
      prisma.organizationRequest.count({
        where: { orgId, status: "pending" },
      }),
      getOrgMembersDetailed(),
      getOrgPendingInvitations(),
    ]);

  const stats = [
    {
      label: "Members",
      value: memberCount,
      icon: Users,
      accent: "blue" as const,
      tile: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    {
      label: "Open jobs",
      value: jobsCount,
      icon: Briefcase,
      accent: "violet" as const,
      tile: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    },
    {
      label: "Candidates",
      value: candidatesCount,
      icon: FileText,
      accent: "emerald" as const,
      tile: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Pending requests",
      value: pendingRequests,
      icon: UserPlus,
      accent: "amber" as const,
      tile: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      adminOnly: true,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Organization"
        description="Workspace overview, members, and access controls."
      />

      {/* Hero — org identity + current user's role */}
      <Card className="mb-5 overflow-hidden bg-gradient-to-br from-card to-primary/[0.04]">
        <CardContent className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center">
          {orgImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={orgImageUrl}
              alt=""
              className="size-14 shrink-0 rounded-xl object-cover"
            />
          ) : (
            <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="size-7" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold">{orgName}</p>
            <p className="text-sm text-muted-foreground">
              Signed in as{" "}
              <span className="font-medium text-foreground">
                {user.fullName ?? user.username ?? user.email}
              </span>
            </p>
          </div>
          <Badge
            className={cn(
              "shrink-0 gap-1.5 border-0 px-3 py-1 text-xs font-medium",
              admin
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground",
            )}
          >
            <ShieldCheck className="size-3.5" /> {roleLabel(role)}
          </Badge>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => {
          if (s.adminOnly && !admin) return null;
          const Icon = s.icon;
          return (
            <Card
              key={s.label}
              className={cn(
                "gap-0 py-4",
                CARD_HOVER_BASE,
                CARD_HOVER[s.accent],
              )}
            >
              <CardContent className="flex items-center justify-between gap-2 px-4">
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="mt-0.5 text-2xl font-bold tabular-nums">
                    {s.value}
                  </p>
                </div>
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-lg",
                    s.tile,
                  )}
                >
                  <Icon className="size-5" />
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Admin: Join requests entry */}
      {admin && (
        <Link href="/organization/requests" className="mb-5 block">
          <Card
            className={cn(
              "group gap-0 transition-all duration-200",
              CARD_HOVER_BASE,
              CARD_HOVER.primary,
            )}
          >
            <CardContent className="flex items-center gap-3 px-5 py-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <UserPlus className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-medium">
                  Join requests
                  {pendingRequests > 0 && (
                    <Badge className="border-0 bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      {pendingRequests} pending
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

      {/* Members manager — sidebar tabs + advanced members table */}
      <MembersManager
        members={members}
        invitations={invitations}
        currentUserId={user.id}
        isAdmin={admin}
      />
    </div>
  );
}
