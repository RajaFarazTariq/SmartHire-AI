"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreatePreference } from "@/lib/email/preferences";

const TypeMapSchema = z.record(z.string(), z.boolean());

export type NotificationPrefs = {
  emailEnabled: boolean;
  types: Record<string, boolean>;
  emailDeliveryConfigured: boolean;
};

export async function getMyPreferences(): Promise<NotificationPrefs> {
  const user = await requireDbUser();
  const pref = await getOrCreatePreference(user.id);
  const rawTypes =
    pref?.types && typeof pref.types === "object" && !Array.isArray(pref.types)
      ? (pref.types as Record<string, boolean>)
      : {};
  return {
    emailEnabled: pref?.emailEnabled ?? true,
    types: rawTypes,
    emailDeliveryConfigured: Boolean(process.env.RESEND_API_KEY),
  };
}

export async function updateMyPreferencesAction(input: {
  emailEnabled: boolean;
  types: Record<string, boolean>;
}): Promise<{ ok: boolean; error?: string }> {
  const user = await requireDbUser();
  const parsedTypes = TypeMapSchema.safeParse(input.types);
  if (!parsedTypes.success) {
    return { ok: false, error: "Invalid type preferences" };
  }
  await prisma.notificationPreference.upsert({
    where: { userId: user.id },
    update: {
      emailEnabled: input.emailEnabled,
      types: parsedTypes.data,
    },
    create: {
      userId: user.id,
      emailEnabled: input.emailEnabled,
      types: parsedTypes.data,
    },
  });
  revalidatePath("/portal/preferences");
  return { ok: true };
}
