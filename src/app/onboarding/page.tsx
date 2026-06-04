import { redirect } from "next/navigation";

import { Brand } from "@/components/brand";
import { requireDbUser } from "@/lib/auth";
import { CANDIDATE_ACCOUNT_TYPE } from "@/lib/candidate";
import { getActiveOrgId, hasOrgMembership } from "@/lib/access";
import { hasPendingJoinRequest } from "./actions";
import { OrgChooser } from "./org-chooser";

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

      <OrgChooser />
    </div>
  );
}
