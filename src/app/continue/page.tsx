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
// Every Clerk/DB call below is wrapped defensively. A transient failure (token
// handshake during clock skew, rate limit, network blip) must NOT crash the
// sign-in page — instead we fall back to the most sensible destination.
export default async function ContinuePage() {
  let user: Awaited<ReturnType<typeof getOrCreateDbUser>> = null;
  let intent: string | undefined;

  try {
    user = await getOrCreateDbUser();
  } catch (err) {
    console.error("/continue: getOrCreateDbUser failed:", err);
  }
  try {
    const cookieStore = await cookies();
    intent = cookieStore.get("shai_role")?.value;
  } catch (err) {
    console.error("/continue: cookies() failed:", err);
  }

  if (!user) redirect("/sign-in");

  // Org membership is the source of truth (independent of accountType / stale
  // session). An active org → straight to the recruiter app.
  let activeOrgId: string | null = null;
  try {
    activeOrgId = await getActiveOrgId();
  } catch (err) {
    console.error("/continue: getActiveOrgId failed:", err);
  }
  if (activeOrgId) redirect("/dashboard");

  // Belongs to an org but none active in this session → send them to activate it
  // (NOT the candidate portal). This is the case that caused recruiter misroutes.
  let memberOfAnyOrg = false;
  try {
    memberOfAnyOrg = await hasOrgMembership(user.id);
  } catch (err) {
    console.error("/continue: hasOrgMembership failed:", err);
  }
  if (memberOfAnyOrg) redirect("/onboarding");

  // A request to join an org is awaiting an admin's decision → show the
  // waiting screen instead of bouncing them to candidate routing.
  let hasPending = false;
  try {
    hasPending = await hasPendingJoinRequest(user.id);
  } catch (err) {
    console.error("/continue: hasPendingJoinRequest failed:", err);
  }
  if (hasPending) redirect("/onboarding/pending");

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
