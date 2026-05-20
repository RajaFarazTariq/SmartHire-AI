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

  return prisma.user.upsert({
    where: { id: clerkUser.id },
    update: { email: primaryEmail },
    create: { id: clerkUser.id, email: primaryEmail },
  });
}

export async function requireDbUser() {
  const user = await getOrCreateDbUser();
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user;
}
