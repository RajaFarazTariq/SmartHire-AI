import { redirect } from "next/navigation";
import { OrganizationList } from "@clerk/nextjs";

import { Brand } from "@/components/brand";
import { requireDbUser } from "@/lib/auth";
import { CANDIDATE_ACCOUNT_TYPE } from "@/lib/candidate";

export default async function OnboardingPage() {
  // Candidates have no organization and must never see org creation — send them
  // to their portal instead.
  const user = await requireDbUser();
  if (user.accountType === CANDIDATE_ACCOUNT_TYPE) redirect("/portal");

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
