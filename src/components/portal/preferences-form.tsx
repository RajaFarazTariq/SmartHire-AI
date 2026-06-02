"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  updateMyPreferencesAction,
  type NotificationPrefs,
} from "@/app/portal/preferences/actions";

const TYPES: { key: string; label: string; description: string }[] = [
  {
    key: "application.status",
    label: "Application status changes",
    description: "When a recruiter moves you to a new stage.",
  },
  {
    key: "application.submitted",
    label: "Application receipts",
    description: "Confirmation after you apply to a job.",
  },
  {
    key: "interview.scheduled",
    label: "Interview scheduled",
    description: "When an interview is booked for you.",
  },
  {
    key: "interview.link",
    label: "Interview link updates",
    description: "When the recruiter adds or changes a meeting link.",
  },
  {
    key: "interview.reminder",
    label: "Interview reminders",
    description: "A heads-up the day before your interview.",
  },
];

export function PreferencesForm({ initial }: { initial: NotificationPrefs }) {
  const [emailEnabled, setEmailEnabled] = useState(initial.emailEnabled);
  const [types, setTypes] = useState<Record<string, boolean>>(initial.types);
  const [pending, startTransition] = useTransition();

  function isTypeOn(key: string) {
    return types[key] !== false;
  }

  function toggleType(key: string, on: boolean) {
    setTypes((prev) => ({ ...prev, [key]: on }));
  }

  function save() {
    startTransition(async () => {
      const res = await updateMyPreferencesAction({ emailEnabled, types });
      if (res.ok) toast.success("Preferences saved");
      else toast.error(res.error ?? "Could not save");
    });
  }

  return (
    <div className="space-y-6">
      {!initial.emailDeliveryConfigured && (
        <div className="rounded-lg border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          Email delivery is not enabled on this deployment. You can set
          preferences here, but no emails will go out until the administrator
          configures email.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Email notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Send me emails</p>
              <p className="text-xs text-muted-foreground">
                Turn this off to stop all email from SmartHire-AI. In-app
                notifications will still show up here.
              </p>
            </div>
            <Switch
              checked={emailEnabled}
              onCheckedChange={setEmailEnabled}
              aria-label="Toggle email delivery"
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">What to email me about</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {TYPES.map((t) => (
            <label
              key={t.key}
              className="flex items-start justify-between gap-4"
            >
              <div>
                <p className="text-sm font-medium">{t.label}</p>
                <p className="text-xs text-muted-foreground">{t.description}</p>
              </div>
              <Switch
                checked={isTypeOn(t.key)}
                onCheckedChange={(v) => toggleType(t.key, v)}
                disabled={!emailEnabled}
                aria-label={`Toggle ${t.label}`}
              />
            </label>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Saving…
            </>
          ) : (
            "Save preferences"
          )}
        </Button>
      </div>
    </div>
  );
}
