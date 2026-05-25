import { redirect } from "next/navigation";
import { OrganizationList } from "@clerk/nextjs";

import { Brand } from "@/components/brand";
import { requireDbUser } from "@/lib/auth";
import { CANDIDATE_ACCOUNT_TYPE } from "@/lib/candidate";
import { getActiveOrgId, hasOrgMembership } from "@/lib/access";

export default async function OnboardingPage() {
  const user = await requireDbUser();

  // Already have an active org → straight to the recruiter app.
  if (await getActiveOrgId()) redirect("/dashboard");

  // Recruiters who belong to an org (just not active here) must stay and pick it.
  // Only TRUE candidates — no org membership at all — go to the portal.
  if (!(await hasOrgMembership(user.id))) {
    if (user.accountType === CANDIDATE_ACCOUNT_TYPE) redirect("/portal");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-muted/30 p-6">
      <Brand />
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Select your organization</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          SmartHire is organized by team. Choose an organization to continue, or
          create a new one to start posting jobs and screening candidates with
          your colleagues.
        </p>
      </div>
      <OrganizationList
        hidePersonal
        afterCreateOrganizationUrl="/dashboard"
        afterSelectOrganizationUrl="/dashboard"
      />
    </div>
  );
}
