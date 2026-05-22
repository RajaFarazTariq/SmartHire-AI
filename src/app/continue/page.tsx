import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";

import { getOrCreateDbUser } from "@/lib/auth";
import { markAsCandidate, CANDIDATE_ACCOUNT_TYPE } from "@/lib/candidate";

export const dynamic = "force-dynamic";

// Post-authentication router. Every sign-in / sign-up lands here, and we send
// the user to the right home based on their role. The role chooser sets a
// short-lived `shai_role` cookie that survives Clerk's multi-step sign-up flow.
export default async function ContinuePage() {
  const user = await getOrCreateDbUser();
  if (!user) redirect("/sign-in");

  const cookieStore = await cookies();
  const intent = cookieStore.get("shai_role")?.value;

  let accountType = user.accountType;
  if (intent === "candidate" && accountType !== CANDIDATE_ACCOUNT_TYPE) {
    await markAsCandidate(user.id);
    accountType = CANDIDATE_ACCOUNT_TYPE;
  }
  // NB: cookies can't be modified in a Server Component (only Server Actions /
  // Route Handlers). The `shai_role` cookie is harmless and self-expires via its
  // 1-hour Max-Age, and the re-tag above is idempotent, so we just let it lapse.

  if (accountType === CANDIDATE_ACCOUNT_TYPE) redirect("/portal");

  const { orgId } = await auth();
  if (orgId) redirect("/dashboard");
  redirect("/onboarding");
}
