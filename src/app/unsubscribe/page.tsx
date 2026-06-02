import { prisma } from "@/lib/prisma";
import { UnsubscribeForm } from "@/components/unsubscribe-form";

export const dynamic = "force-dynamic";

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  const pref = token
    ? await prisma.notificationPreference.findUnique({
        where: { unsubscribeToken: token },
        select: { emailEnabled: true },
      })
    : null;

  // Best to act on the token immediately on landing so one-click clients
  // (Gmail / Outlook) get an unsubscribe even without JS. Only flip when
  // currently subscribed so refreshes don't re-toggle.
  if (token && pref?.emailEnabled) {
    await prisma.notificationPreference.update({
      where: { unsubscribeToken: token },
      data: { emailEnabled: false },
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
          SmartHire-AI
        </p>
        <h1 className="mt-2 text-xl font-semibold text-slate-900">
          {token && pref
            ? "You're unsubscribed"
            : "Manage email preferences"}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {token && pref
            ? "We won't send you any more notification emails. You can change your mind anytime."
            : "Open this page from the link in one of our emails to manage your subscription."}
        </p>
        {token && pref && <UnsubscribeForm token={token} />}
      </div>
    </main>
  );
}
