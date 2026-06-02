"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { setSubscriptionWithToken } from "@/app/unsubscribe/actions";

export function UnsubscribeForm({ token }: { token: string }) {
  const [subscribed, setSubscribed] = useState(false);
  const [pending, startTransition] = useTransition();

  function resubscribe() {
    startTransition(async () => {
      const res = await setSubscriptionWithToken(token, true);
      if (res.ok) {
        setSubscribed(true);
        toast.success("You're resubscribed");
      } else {
        toast.error(res.error ?? "Could not update");
      }
    });
  }

  return (
    <div className="mt-6">
      {subscribed ? (
        <p className="text-sm text-emerald-700">
          You&apos;re back on the list. We&apos;ll email you about your
          applications again.
        </p>
      ) : (
        <Button variant="outline" onClick={resubscribe} disabled={pending}>
          {pending ? "Working…" : "Resubscribe me"}
        </Button>
      )}
    </div>
  );
}
