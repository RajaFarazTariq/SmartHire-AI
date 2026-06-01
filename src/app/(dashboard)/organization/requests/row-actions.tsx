"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { approveRequestAction, rejectRequestAction } from "./actions";

export function RequestRowActions({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function approve() {
    startTransition(async () => {
      const res = await approveRequestAction(id);
      if (res.ok) {
        toast.success("Request approved");
        router.refresh();
      } else toast.error(res.error ?? "Failed");
    });
  }

  function reject() {
    startTransition(async () => {
      const res = await rejectRequestAction(id);
      if (res.ok) {
        toast.success("Request declined");
        router.refresh();
      } else toast.error(res.error ?? "Failed");
    });
  }

  return (
    <div className="flex items-center gap-2 sm:shrink-0">
      <Button
        size="sm"
        variant="outline"
        onClick={reject}
        disabled={pending}
        className="text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
      >
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
        Decline
      </Button>
      <Button size="sm" onClick={approve} disabled={pending}>
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
        Approve
      </Button>
    </div>
  );
}
