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
  Settings,
  Shapes,
  Users,
  Library,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export type AdminNavGroup = {
  title: string;
  items: AdminNavItem[];
};

const DASHBOARD: AdminNavItem = {
  href: "/admin",
  label: "Dashboard",
  description: "Admin hub and quick links",
  icon: LayoutDashboard,
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    title: "Overview",
    items: [DASHBOARD],
  },
  {
    title: "Planner",
    items: [
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
        href: "/admin/analytics",
        label: "Analytics",
        description: "Planner usage and export metrics",
        icon: BarChart3,
      },
    ],
  },
  {
    title: "Catalog",
    items: [
      {
        href: "/admin/catalog",
        label: "Standard catalog",
        description: "Standard planner products — full CRUD",
        icon: Package,
      },
      {
        href: "/admin/planner-catalog",
        label: "Planner catalog",
        description: "Configurator parametric products — full CRUD",
        icon: Shapes,
      },
      {
        href: "/admin/buddy-catalog",
        label: "Buddy catalog",
        description: "Buddy alias of configurator catalog",
        icon: Users,
      },
      {
        href: "/admin/workspace-catalog",
        label: "Workspace library",
        description: "Static element library (read-only browse)",
        icon: Library,
      },
    ],
  },
  {
    title: "Platform",
    items: [
      {
        href: "/admin/settings",
        label: "Settings",
        description: "Canvas bounds, flags, env reference",
        icon: Settings,
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
      {
        href: "/admin/customer-queries",
        label: "Customer queries",
        description: "Inbound contact form queue and follow-ups",
        icon: Boxes,
      },
    ],
  },
];

export const ADMIN_NAV_ITEMS: AdminNavItem[] = ADMIN_NAV_GROUPS.flatMap((group) => group.items);

export const ADMIN_HUB_SECTIONS: { title: string; items: AdminNavItem[] }[] = [
  {
    title: "Planner operations",
    items: ADMIN_NAV_GROUPS.find((g) => g.title === "Planner")!.items,
  },
  {
    title: "Catalog & library",
    items: ADMIN_NAV_GROUPS.find((g) => g.title === "Catalog")!.items,
  },
  {
    title: "Platform & ops",
    items: [
      ...ADMIN_NAV_GROUPS.find((g) => g.title === "Platform")!.items,
      {
        href: "/admin/customer-queries",
        label: "Customer queries",
        description: "Inbound contact form queue and follow-ups",
        icon: Boxes,
      },
    ],
  },
];

/** @deprecated Use ADMIN_HUB_SECTIONS */
export const ADMIN_HUB_CARDS = ADMIN_HUB_SECTIONS.flatMap((section) => section.items);
