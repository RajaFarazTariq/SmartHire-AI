import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

export async function getOrCreateDbUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const primaryEmail = clerkUser.emailAddresses.find(
    (e) => e.id === clerkUser.primaryEmailAddressId,
  )?.emailAddress;

  if (!primaryEmail) {
    throw new Error("Clerk user has no primary email address");
  }

  const fullName =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

  return prisma.user.upsert({
    where: { id: clerkUser.id },
    update: { email: primaryEmail, username: clerkUser.username, fullName },
    create: {
      id: clerkUser.id,
      email: primaryEmail,
      username: clerkUser.username,
      fullName,
    },
  });
}

export async function requireDbUser() {
  const user = await getOrCreateDbUser();
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user;
}
