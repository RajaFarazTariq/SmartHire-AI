import type { Appearance } from "@clerk/types";

// Global theme applied to all Clerk components (UserButton, etc.)
export const clerkAppearance: Appearance = {
  variables: {
    colorPrimary: "#2563eb",
    borderRadius: "0.65rem",
    fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
  },
};

// Used on the dedicated sign-in / sign-up pages so the Clerk card blends
// into our split-screen layout (no extra border/shadow).
export const authPageAppearance: Appearance = {
  variables: clerkAppearance.variables,
  elements: {
    rootBox: "w-full",
    cardBox: "w-full shadow-none border-0",
    card: "shadow-none border-0 bg-transparent p-0",
    header: "text-left",
    headerTitle: "text-2xl font-bold tracking-tight",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButton:
      "border-input hover:bg-accent text-sm normal-case",
    formButtonPrimary:
      "bg-primary text-primary-foreground hover:bg-primary/90 text-sm normal-case shadow-sm",
    formFieldInput:
      "border-input focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  },
};
