"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireDbUser } from "@/lib/auth";

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: Date;
};

export async function getMyNotifications(limit = 20): Promise<NotificationItem[]> {
  const user = await requireDbUser();
  return prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getUnreadCount(): Promise<number> {
  const user = await requireDbUser();
  return prisma.notification.count({
    where: { userId: user.id, read: false },
  });
}

export async function markNotificationRead(
  id: string,
): Promise<{ ok: boolean }> {
  const user = await requireDbUser();
  await prisma.notification.updateMany({
    where: { id, userId: user.id },
    data: { read: true },
  });
  revalidatePath("/portal/notifications");
  return { ok: true };
}

export async function markAllNotificationsRead(): Promise<{ ok: boolean }> {
  const user = await requireDbUser();
  await prisma.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  });
  revalidatePath("/portal/notifications");
  return { ok: true };
}
