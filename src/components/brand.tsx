import Link from "next/link";
import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

export function Brand({
  href = "/",
  className,
  showText = true,
}: {
  href?: string;
  className?: string;
  showText?: boolean;
}) {
  return (
    <Link href={href} className={cn("flex items-center gap-2", className)}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <Sparkles className="size-4" />
      </span>
      {showText && (
        <span className="text-base font-semibold tracking-tight">
          SmartHire<span className="text-primary"> AI</span>
        </span>
      )}
    </Link>
  );
}
