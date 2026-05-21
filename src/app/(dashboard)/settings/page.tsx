import { Mail, User, AtSign, Building2 } from "lucide-react";

import { requireDbUser } from "@/lib/auth";
import { PageHeader } from "@/components/dashboard/page-header";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function SettingsPage() {
  const user = await requireDbUser();

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
          <div className="flex items-center justify-between rounded-lg border border-dashed p-4">
            <div>
              <p className="text-sm font-medium">Multi-team organizations</p>
              <p className="text-sm text-muted-foreground">
                Invite recruiters and managers to a shared workspace.
              </p>
            </div>
            <Badge variant="secondary">Coming soon</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
