import { Mail, User, AtSign, Building2 } from "lucide-react";

import { requireWorkspace } from "@/lib/org";
import { roleLabel } from "@/lib/rbac";
import { getEnabledRounds } from "../interviews/actions";
import { PageHeader } from "@/components/dashboard/page-header";
import { ThemeToggle } from "@/components/theme-toggle";
import { InterviewRoundsCard } from "./interview-rounds-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function SettingsPage() {
  const { user, role } = await requireWorkspace();
  const enabledRounds = await getEnabledRounds();

  const fields = [
    { icon: User, label: "Full name", value: user.fullName },
    { icon: AtSign, label: "Username", value: user.username },
    { icon: Mail, label: "Email", value: user.email },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your profile, appearance, and workspace."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>
            Synced from your account. Edit it from the avatar menu → Manage
            account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.label} className="flex items-start gap-3">
                <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {f.label}
                  </p>
                  <p className="text-sm">
                    {f.value ?? <span className="text-muted-foreground">—</span>}
                  </p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
          <CardDescription>Switch between light and dark theme.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className="text-sm">Theme</span>
          <ThemeToggle />
        </CardContent>
      </Card>

      <InterviewRoundsCard enabled={enabledRounds} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="size-4 text-muted-foreground" />
            Organization
          </CardTitle>
          <CardDescription>
            Team workspaces and role-based access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="text-sm font-medium">Your role</p>
              <p className="text-sm text-muted-foreground">
                Manage members and switch organizations from the switcher in the
                top bar.
              </p>
            </div>
            <Badge variant="secondary">{roleLabel(role)}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
