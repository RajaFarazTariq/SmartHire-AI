// Per-accent hover treatments for informational (non-clickable) dashboard cards:
// a soft border in the card's accent colour + a matching coloured shadow.
// Kept as full static class strings so Tailwind's scanner emits them.
export type CardAccent =
  | "primary"
  | "blue"
  | "violet"
  | "emerald"
  | "amber"
  | "teal"
  | "cyan"
  | "indigo"
  | "rose";

export const CARD_HOVER: Record<CardAccent, string> = {
  primary: "hover:border-primary/50 hover:shadow-md hover:shadow-primary/20",
  blue: "hover:border-blue-500/50 hover:shadow-md hover:shadow-blue-500/20",
  violet: "hover:border-violet-500/50 hover:shadow-md hover:shadow-violet-500/20",
  emerald:
    "hover:border-emerald-500/50 hover:shadow-md hover:shadow-emerald-500/20",
  amber: "hover:border-amber-500/50 hover:shadow-md hover:shadow-amber-500/20",
  teal: "hover:border-teal-500/50 hover:shadow-md hover:shadow-teal-500/20",
  cyan: "hover:border-cyan-500/50 hover:shadow-md hover:shadow-cyan-500/20",
  indigo: "hover:border-indigo-500/50 hover:shadow-md hover:shadow-indigo-500/20",
  rose: "hover:border-rose-500/50 hover:shadow-md hover:shadow-rose-500/20",
};

// Shared timing + subtle lift for every interactive-feeling card.
export const CARD_HOVER_BASE =
  "transition-all duration-200 hover:-translate-y-0.5";
