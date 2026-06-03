"use server";

import { clerkClient } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import { requireDbUser } from "@/lib/auth";
import { validateName, splitName } from "@/lib/validators/name";

export async function saveNameAction(
  raw: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireDbUser();

  const check = validateName(raw);
  if (!check.ok) return { ok: false, error: check.error };

  // Clerk is the source of truth that getOrCreateDbUser re-syncs from on every
  // request, so the Clerk update MUST succeed — otherwise the name-gate would
  // immediately re-trigger. Treat a Clerk failure as a hard error.
  try {
    const { firstName, lastName } = splitName(check.value);
    const client = await clerkClient();
    await client.users.updateUser(user.id, { firstName, lastName });
  } catch (err) {
    console.error("saveNameAction: Clerk update failed:", err);
    return { ok: false, error: "Couldn't save your name. Please try again." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { fullName: check.value },
  });

  return { ok: true };
}
