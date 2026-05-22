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

  return (
    <ClerkProvider
      appearance={{
        ...clerkAppearance,
        baseTheme: isDark ? dark : undefined,
      }}
    >
      {children}
    </ClerkProvider>
  );
}
