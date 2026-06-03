import { redirect } from "next/navigation";

import { getOrCreateDbUser } from "@/lib/auth";
import { isValidName } from "@/lib/validators/name";
import { NameForm } from "./name-form";

export const dynamic = "force-dynamic";

// One-time name-gate shown when a signed-in account has a missing or invalid
// display name (Clerk's hosted sign-up can't validate it inline). Reached from
// /continue; sends the user back through /continue once a valid name is saved.
export default async function WelcomePage() {
  const user = await getOrCreateDbUser();
  if (!user) redirect("/sign-in");
  if (isValidName(user.fullName)) redirect("/continue");

  const suggested =
    user.fullName && user.fullName.trim().length > 0 ? user.fullName : "";

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">
        <h1 className="text-xl font-bold tracking-tight">
          What&apos;s your name?
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          We use your real name on your profile and applications so recruiters
          know who you are. Please enter it to continue.
        </p>
        <div className="mt-6">
          <NameForm initial={suggested} />
        </div>
      </div>
    </div>
  );
}
