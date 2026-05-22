import {
  LayoutDashboard,
  Briefcase,
  Users,
  UploadCloud,
  History,
  Building2,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Icon tile (inactive). */
  tile: string;
  /** Icon tile (active) — vivid solid so the icon pops on the soft row. */
  activeTile: string;
  /** Vertical accent divider colour. */
  accent: string;
  /** Row hover state — soft tinted border + glow in the item's colour. */
  hover: string;
  /** Row active state — soft gradient + colored border + glow + text. */
  active: string;
};

export const dashboardNav: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    tile: "bg-purple-500/15 text-purple-500",
    activeTile: "bg-purple-500 text-white",
    accent: "bg-purple-500/50",
    hover:
      "hover:border-purple-500/40 hover:bg-purple-500/10 hover:shadow-sm hover:shadow-purple-500/15",
    active:
      "border-purple-500/40 bg-gradient-to-r from-purple-500/15 to-purple-500/5 text-purple-700 shadow-sm shadow-purple-500/20 dark:text-purple-200",
  },
  {
    title: "Jobs",
    href: "/jobs",
    icon: Briefcase,
    tile: "bg-blue-500/15 text-blue-500",
    activeTile: "bg-blue-500 text-white",
    accent: "bg-blue-500/50",
    hover:
      "hover:border-blue-500/40 hover:bg-blue-500/10 hover:shadow-sm hover:shadow-blue-500/15",
    active:
      "border-blue-500/40 bg-gradient-to-r from-blue-500/15 to-blue-500/5 text-blue-700 shadow-sm shadow-blue-500/20 dark:text-blue-200",
  },
  {
    title: "Candidates",
    href: "/candidates",
    icon: Users,
    tile: "bg-emerald-500/15 text-emerald-500",
    activeTile: "bg-emerald-500 text-white",
    accent: "bg-emerald-500/50",
    hover:
      "hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:shadow-sm hover:shadow-emerald-500/15",
    active:
      "border-emerald-500/40 bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 text-emerald-700 shadow-sm shadow-emerald-500/20 dark:text-emerald-200",
  },
  {
    title: "Upload",
    href: "/upload",
    icon: UploadCloud,
    tile: "bg-violet-500/15 text-violet-500",
    activeTile: "bg-violet-500 text-white",
    accent: "bg-violet-500/50",
    hover:
      "hover:border-violet-500/40 hover:bg-violet-500/10 hover:shadow-sm hover:shadow-violet-500/15",
    active:
      "border-violet-500/40 bg-gradient-to-r from-violet-500/15 to-violet-500/5 text-violet-700 shadow-sm shadow-violet-500/20 dark:text-violet-200",
  },
  {
    title: "Activity",
    href: "/activity",
    icon: History,
    tile: "bg-amber-500/15 text-amber-500",
    activeTile: "bg-amber-500 text-white",
    accent: "bg-amber-500/50",
    hover:
      "hover:border-amber-500/40 hover:bg-amber-500/10 hover:shadow-sm hover:shadow-amber-500/15",
    active:
      "border-amber-500/40 bg-gradient-to-r from-amber-500/15 to-amber-500/5 text-amber-700 shadow-sm shadow-amber-500/20 dark:text-amber-200",
  },
  {
    title: "Organization",
    href: "/organization",
    icon: Building2,
    tile: "bg-indigo-500/15 text-indigo-500",
    activeTile: "bg-indigo-500 text-white",
    accent: "bg-indigo-500/50",
    hover:
      "hover:border-indigo-500/40 hover:bg-indigo-500/10 hover:shadow-sm hover:shadow-indigo-500/15",
    active:
      "border-indigo-500/40 bg-gradient-to-r from-indigo-500/15 to-indigo-500/5 text-indigo-700 shadow-sm shadow-indigo-500/20 dark:text-indigo-200",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    tile: "bg-cyan-500/15 text-cyan-500",
    activeTile: "bg-cyan-500 text-white",
    accent: "bg-cyan-500/50",
    hover:
      "hover:border-cyan-500/40 hover:bg-cyan-500/10 hover:shadow-sm hover:shadow-cyan-500/15",
    active:
      "border-cyan-500/40 bg-gradient-to-r from-cyan-500/15 to-cyan-500/5 text-cyan-700 shadow-sm shadow-cyan-500/20 dark:text-cyan-200",
  },
];
