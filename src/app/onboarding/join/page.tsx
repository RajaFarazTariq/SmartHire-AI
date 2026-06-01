import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Brand } from "@/components/brand";
import { requireDbUser } from "@/lib/auth";
import { getActiveOrgId } from "@/lib/access";
import { hasPendingJoinRequest } from "../actions";
import { JoinOrgForm } from "./join-form";

export const dynamic = "force-dynamic";

export default async function JoinOrganizationPage() {
  const user = await requireDbUser();
  if (await getActiveOrgId()) redirect("/dashboard");
  if (await hasPendingJoinRequest(user.id)) redirect("/onboarding/pending");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/30 p-6">
      <Brand />
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Join an organization</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search for your team. We'll send a request to the organization's admin
          for approval — you'll be notified once they respond.
        </p>
      </div>

      <JoinOrgForm />

      <Link
        href="/onboarding"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back
      </Link>
    </div>
  );
}
