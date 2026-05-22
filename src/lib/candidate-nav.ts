import {
  LayoutDashboard,
  Briefcase,
  ClipboardList,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export type PortalNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Exact-match only (e.g. the home tab shouldn't stay active on sub-routes). */
  exact?: boolean;
};

export const portalNav: PortalNavItem[] = [
  { title: "Home", href: "/portal", icon: LayoutDashboard, exact: true },
  { title: "Jobs", href: "/portal/jobs", icon: Briefcase },
  { title: "Applications", href: "/portal/applications", icon: ClipboardList },
  { title: "Profile", href: "/portal/profile", icon: UserRound },
];

export function isNavActive(pathname: string, item: PortalNavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
