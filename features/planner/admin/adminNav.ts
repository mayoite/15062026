import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Boxes,
  ClipboardList,
  Flag,
  LayoutDashboard,
  Map,
  Package,
  Palette,
  Shapes,
  Users,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    href: "/admin",
    label: "Dashboard",
    description: "Admin hub and quick links",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/plans",
    label: "Plans",
    description: "Review saved planner documents",
    icon: ClipboardList,
  },
  {
    href: "/admin/features",
    label: "Toolbar & features",
    description: "Planner toolbar and capability toggles",
    icon: Flag,
  },
  {
    href: "/admin/catalog",
    label: "Catalog",
    description: "Standard planner catalog items",
    icon: Package,
  },
  {
    href: "/admin/planner-catalog",
    label: "Planner catalog",
    description: "Configurator catalog for the canvas",
    icon: Shapes,
  },
  {
    href: "/admin/buddy-catalog",
    label: "Buddy catalog",
    description: "Buddy/configurator product aliases",
    icon: Users,
  },
  {
    href: "/admin/analytics",
    label: "Analytics",
    description: "Planner usage and export metrics",
    icon: BarChart3,
  },
  {
    href: "/admin/themes",
    label: "Themes",
    description: "Block theme tokens and publish pipeline",
    icon: Palette,
  },
  {
    href: "/admin/inventory",
    label: "Route inventory",
    description: "App routes, APIs, and layer map",
    icon: Map,
  },
];

export const ADMIN_HUB_CARDS = [
  ...ADMIN_NAV_ITEMS.filter((item) => item.href !== "/admin"),
  {
    href: "/ops/customer-queries",
    label: "Customer queries",
    description: "Ops queue for inbound contact forms",
    icon: Boxes,
  },
];
