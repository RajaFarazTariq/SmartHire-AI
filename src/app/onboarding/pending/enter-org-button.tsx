"use client";

import { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

/**
 * Activates an approved organization in the current session and enters it.
 *
 * An admin approving a join request adds the user to the Clerk org server-side,
 * but that does NOT set the org active in the requester's existing session — so
 * they'd otherwise be stuck on the pending screen. setActive() refreshes the
 * session with the org active, then we route into the dashboard.
 */
export function EnterOrgButton({
  orgId,
  orgName,
  className,
}: {
  orgId: string;
  orgName: string;
  className?: string;
}) {
  const { setActive } = useClerk();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function enter() {
    if (!setActive) return;
    setPending(true);
    try {
      await setActive({ organization: orgId });
      router.push("/dashboard");
    } catch (err) {
      console.error("setActive failed:", err);
      toast.error(
        "Couldn't open the organization. Try signing out and back in.",
      );
      setPending(false);
    }
  }

  return (
    <Button onClick={enter} disabled={pending} className={className}>
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" /> Opening…
        </>
      ) : (
        <>
          Enter {orgName} <ArrowRight className="size-4" />
        </>
      )}
    </Button>
  );
}
