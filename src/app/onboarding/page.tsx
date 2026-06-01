import Link from "next/link";
import { redirect } from "next/navigation";
import { OrganizationList } from "@clerk/nextjs";
import { Search, ArrowRight } from "lucide-react";

import { Brand } from "@/components/brand";
import { requireDbUser } from "@/lib/auth";
import { CANDIDATE_ACCOUNT_TYPE } from "@/lib/candidate";
import { getActiveOrgId, hasOrgMembership } from "@/lib/access";
import { hasPendingJoinRequest } from "./actions";

export default async function OnboardingPage() {
  const user = await requireDbUser();

  // Already have an active org → straight to the recruiter app.
  if (await getActiveOrgId()) redirect("/dashboard");

  // A request to join is pending — show the waiting screen instead.
  if (await hasPendingJoinRequest(user.id)) redirect("/onboarding/pending");

  // Recruiters who belong to an org (just not active here) must stay and pick it.
  // Only TRUE candidates — no org membership at all — go to the portal.
  if (!(await hasOrgMembership(user.id))) {
    if (user.accountType === CANDIDATE_ACCOUNT_TYPE) redirect("/portal");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/30 p-6">
      <Brand />
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Select your organization</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          SmartHire is organized by team. Create a new organization, or request
          to join an existing one.
        </p>
      </div>

      <OrganizationList
        hidePersonal
        afterCreateOrganizationUrl="/dashboard"
        afterSelectOrganizationUrl="/dashboard"
      />

      <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
        <span className="h-px w-12 bg-border" />
        OR
        <span className="h-px w-12 bg-border" />
      </div>

      <Link
        href="/onboarding/join"
        className="group flex w-full max-w-sm items-center gap-3 rounded-xl border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm hover:shadow-primary/15"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Search className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">
            Join an existing organization
          </span>
          <span className="block text-xs text-muted-foreground">
            Search for your team and send a request to its admin.
          </span>
        </span>
        <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
