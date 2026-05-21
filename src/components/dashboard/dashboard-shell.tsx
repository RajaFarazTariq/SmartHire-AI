"use client";

import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { Menu } from "lucide-react";

import { Brand } from "@/components/brand";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function DashboardShell({
  email,
  username,
  fullName,
  children,
}: {
  email: string;
  username: string | null;
  fullName: string | null;
  children: React.ReactNode;
}) {
  const displayName = fullName ?? username ?? email.split("@")[0];
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="bg-sidebar fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r lg:flex">
        <div className="flex h-16 items-center border-b px-6">
          <Brand href="/dashboard" />
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <SidebarNav />
        </div>
        <div className="border-t p-4">
          <p className="truncate text-sm font-medium">{displayName}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </div>
      </aside>

      {/* Main column */}
      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="bg-background/80 sticky top-0 z-20 flex h-16 items-center gap-3 border-b px-4 backdrop-blur-md sm:px-6">
          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="size-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="flex h-16 items-center border-b px-6">
                <Brand href="/dashboard" />
              </div>
              <div className="py-4">
                <SidebarNav onNavigate={() => setMobileOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <div className="lg:hidden">
            <Brand href="/dashboard" showText={false} />
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <ThemeToggle />
            <UserButton
              appearance={{ elements: { avatarBox: "size-9" } }}
              afterSignOutUrl="/"
            />
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
