"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { dashboardNav } from "@/lib/nav";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5 px-2.5">
      {dashboardNav.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-center gap-2.5 rounded-lg border px-2 py-1.5 transition-all duration-200",
              active
                ? item.active
                : cn(
                    "border-transparent text-sidebar-foreground/80 hover:text-foreground",
                    item.hover,
                  ),
            )}
          >
            {/* Icon tile */}
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-md transition-transform group-hover:scale-105",
                active ? item.activeTile : item.tile,
              )}
            >
              <Icon className="size-4" />
            </span>

            {/* Accent divider */}
            <span className={cn("h-4 w-px shrink-0 rounded-full", item.accent)} />

            {/* Label */}
            <span className="text-sm font-medium">{item.title}</span>

            {/* Chevron — inherits the row colour (item colour when active) */}
            <ChevronRight className="ml-auto size-3.5 opacity-50 transition-transform group-hover:translate-x-0.5" />
          </Link>
        );
      })}
    </nav>
  );
}
