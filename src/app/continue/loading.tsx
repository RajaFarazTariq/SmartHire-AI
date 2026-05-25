import { Loader2 } from "lucide-react";

import { Brand } from "@/components/brand";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/20">
      <Brand />
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Signing you in…
      </div>
    </div>
  );
}
