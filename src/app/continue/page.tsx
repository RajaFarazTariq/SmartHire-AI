import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";

import { getOrCreateDbUser } from "@/lib/auth";
import { markAsCandidate, CANDIDATE_ACCOUNT_TYPE } from "@/lib/candidate";

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

  let accountType = user.accountType;
  if (intent === "candidate" && accountType !== CANDIDATE_ACCOUNT_TYPE) {
    try {
      await markAsCandidate(user.id);
    } catch (err) {
      console.error("/continue: markAsCandidate failed:", err);
    }
    accountType = CANDIDATE_ACCOUNT_TYPE;
  }

  if (accountType === CANDIDATE_ACCOUNT_TYPE) redirect("/portal");

  let orgId: string | null | undefined;
  try {
    ({ orgId } = await auth());
  } catch (err) {
    console.error("/continue: auth() failed:", err);
  }

  if (orgId) redirect("/dashboard");
  redirect("/onboarding");
}
