"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";

import { cancelMyRequestAction } from "../actions";

export function CancelRequestButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  function cancel() {
    startTransition(async () => {
      const res = await cancelMyRequestAction(id);
      if (res.ok) {
        toast.success("Request cancelled");
        router.refresh();
      } else {
        toast.error(res.error ?? "Failed");
      }
    });
  }
  return (
    <button
      onClick={cancel}
      disabled={pending}
      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-rose-500"
      aria-label="Cancel request"
      title="Cancel request"
    >
      <X className="size-3.5" />
    </button>
  );
}
