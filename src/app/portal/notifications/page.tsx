import { getMyNotifications } from "./actions";
import { PortalHeader } from "@/components/portal/portal-header";
import { NotificationsList } from "@/components/portal/notifications-list";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const notifications = await getMyNotifications(50);

  return (
    <div className="mx-auto max-w-2xl">
      <PortalHeader
        title="Notifications"
        description="Status changes and updates about your applications."
      />
      <NotificationsList initial={notifications} />
    </div>
  );
}
