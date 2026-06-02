"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";

import { clerkAppearance } from "@/lib/clerk-appearance";

export function ClerkThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // `dynamic` opts Clerk's tree out of SSR. Required while running on the
  // development Clerk instance against a production-style domain: the
  // dev-mode banner Clerk injects at runtime adds React components that
  // were not present in the server-rendered HTML, causing hook-count
  // mismatches (React error #310) during hydration — most visibly on the
  // recruiter dashboard which mounts <OrganizationSwitcher>, <UserButton>,
  // and the notifications bell. With `dynamic`, children render only on
  // the client so there's no SSR/CSR divergence.
  return (
    <ClerkProvider
      dynamic
      appearance={{
        ...clerkAppearance,
        baseTheme: isDark ? dark : undefined,
      }}
    >
      {children}
    </ClerkProvider>
  );
}
