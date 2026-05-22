"use client";

import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { dashboardNav } from "@/lib/nav";

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  const pathname = usePathname();
  const section = dashboardNav.find(
    (i) => pathname === i.href || pathname.startsWith(`${i.href}/`),
  );
  const Icon = section?.icon;

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {Icon && section && (
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg",
              section.tile,
            )}
          >
            <Icon className="size-5" />
          </span>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
