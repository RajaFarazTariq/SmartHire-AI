import {
  LayoutDashboard,
  Briefcase,
  Users,
  UploadCloud,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export const dashboardNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Jobs", href: "/jobs", icon: Briefcase },
  { title: "Candidates", href: "/candidates", icon: Users },
  { title: "Upload", href: "/upload", icon: UploadCloud },
  { title: "Settings", href: "/settings", icon: Settings },
];
