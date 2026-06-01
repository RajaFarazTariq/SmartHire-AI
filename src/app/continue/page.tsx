import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { getOrCreateDbUser } from "@/lib/auth";
import { markAsCandidate, CANDIDATE_ACCOUNT_TYPE } from "@/lib/candidate";
import { getActiveOrgId, hasOrgMembership } from "@/lib/access";
import { hasPendingJoinRequest } from "@/app/onboarding/actions";

export const dynamic = "force-dynamic";

// Post-authentication router. Every sign-in / sign-up lands here, and we send
// the user to the right home based on their role. The role chooser sets a
// short-lived `shai_role` cookie that survives Clerk's multi-step sign-up flow.
//
// Resolution is wrapped defensively: if the Clerk session is momentarily
// unavailable (e.g. token handshake during clock skew), we fall back to
// sign-in instead of throwing and showing a blank error page.
export default async function ContinuePage() {
  let user: Awaited<ReturnType<typeof getOrCreateDbUser>> = null;
  let intent: string | undefined;

  try {
    user = await getOrCreateDbUser();
    const cookieStore = await cookies();
    intent = cookieStore.get("shai_role")?.value;
  } catch (err) {
    console.error("/continue: failed to resolve session:", err);
  }

  if (!user) redirect("/sign-in");

  // Org membership is the source of truth (independent of accountType / stale
  // session). An active org → straight to the recruiter app.
  if (await getActiveOrgId()) redirect("/dashboard");

  // Belongs to an org but none active in this session → send them to activate it
  // (NOT the candidate portal). This is the case that caused recruiter misroutes.
  if (await hasOrgMembership(user.id)) redirect("/onboarding");

  // A request to join an org is awaiting an admin's decision → show the
  // waiting screen instead of bouncing them to candidate routing.
  if (await hasPendingJoinRequest(user.id)) redirect("/onboarding/pending");

  // No organization at all → candidate side. Honour the role-chooser cookie.
  if (intent === "candidate" && user.accountType !== CANDIDATE_ACCOUNT_TYPE) {
    try {
      await markAsCandidate(user.id);
    } catch (err) {
      console.error("/continue: markAsCandidate failed:", err);
    }
  }
  if (intent === "candidate" || user.accountType === CANDIDATE_ACCOUNT_TYPE) {
    redirect("/portal");
  }

  // Brand-new recruiter who hasn't created an org yet.
  redirect("/onboarding");
}

