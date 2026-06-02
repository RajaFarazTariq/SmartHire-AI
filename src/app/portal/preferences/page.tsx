import Link from "next/link";
import { ArrowLeft, Bell } from "lucide-react";

import { PortalHeader } from "@/components/portal/portal-header";
import { PreferencesForm } from "@/components/portal/preferences-form";
import { getMyPreferences } from "./actions";

export const dynamic = "force-dynamic";

export default async function PreferencesPage() {
  const prefs = await getMyPreferences();

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/portal/profile"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to profile
      </Link>
      <PortalHeader
        title="Notification preferences"
        description="Choose what you want to hear about and how."
      >
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          <Bell className="size-3.5" /> Email
        </span>
      </PortalHeader>
      <PreferencesForm initial={prefs} />
    </div>
  );
}
