import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Boxes,
  ClipboardList,
  Compass,
  FileText,
  Flag,
  FolderKanban,
  LayoutDashboard,
  Library,
  Map,
  Package,
  Palette,
  Settings,
  Shapes,
  Users,
  UserCircle,
} from "lucide-react";

export type WorkspaceAccess = "member" | "admin";

export type WorkspaceHubItem = {
  href: string;
  label: string;
  description: string;
  access: WorkspaceAccess;
  icon: LucideIcon;
};

export type WorkspaceHubSection = {
  title: string;
  summary: string;
  items: WorkspaceHubItem[];
};

export const WORKSPACE_HUB_SECTIONS: WorkspaceHubSection[] = [
  {
    title: "Planner & workspace",
    summary: "Layout, catalog furniture, 3D review, and export.",
    items: [
      {
        href: "/planner",
        label: "Planner home",
        description: "Marketing landing, templates, and entry to the canvas.",
        access: "member",
        icon: Compass,
      },
      {
        href: "/planner/canvas",
        label: "Open canvas",
        description: "Jump straight into the signed-in planner workspace.",
        access: "member",
        icon: LayoutDashboard,
      },
      {
        href: "/portal",
        label: "Member portal",
        description: "Review shared plans and member project context.",
        access: "member",
        icon: UserCircle,
      },
    ],
  },
  {
    title: "CRM",
    summary: "Clients, projects, and quotes for your team.",
    items: [
      {
        href: "/crm/clients",
        label: "Clients",
        description: "Client records and contact context.",
        access: "member",
        icon: Users,
      },
      {
        href: "/crm/projects",
        label: "Projects",
        description: "Active deals and delivery pipelines.",
        access: "member",
        icon: FolderKanban,
      },
      {
        href: "/crm/quotes",
        label: "Quotes",
        description: "Quote drafts and follow-up status.",
        access: "member",
        icon: FileText,
      },
    ],
  },
  {
    title: "Admin console",
    summary: "Catalog, plans, flags, themes, and operations — admin role required.",
    items: [
      {
        href: "/admin",
        label: "Admin home",
        description: "Platform control and quick links.",
        access: "admin",
        icon: LayoutDashboard,
      },
      {
        href: "/admin/plans",
        label: "Plans",
        description: "Review saved planner documents.",
        access: "admin",
        icon: ClipboardList,
      },
      {
        href: "/admin/features",
        label: "Toolbar & features",
        description: "Planner toolbar and capability toggles.",
        access: "admin",
        icon: Flag,
      },
      {
        href: "/admin/analytics",
        label: "Analytics",
        description: "Planner usage and export metrics.",
        access: "admin",
        icon: BarChart3,
      },
      {
        href: "/admin/catalog",
        label: "Standard catalog",
        description: "Planner-managed products — dimensions and visibility.",
        access: "admin",
        icon: Package,
      },
      {
        href: "/admin/planner-catalog",
        label: "Planner catalog",
        description: "Configurator parametric products.",
        access: "admin",
        icon: Shapes,
      },
      {
        href: "/admin/buddy-catalog",
        label: "Buddy catalog",
        description: "Buddy alias of the configurator catalog.",
        access: "admin",
        icon: Users,
      },
      {
        href: "/admin/workspace-catalog",
        label: "Workspace library",
        description: "Static element library (read-only browse).",
        access: "admin",
        icon: Library,
      },
      {
        href: "/admin/customer-queries",
        label: "Customer queries",
        description: "Inbound contact form inbox and follow-ups.",
        access: "admin",
        icon: Boxes,
      },
      {
        href: "/admin/settings",
        label: "Settings",
        description: "Canvas bounds, feature flags, env reference.",
        access: "admin",
        icon: Settings,
      },
      {
        href: "/admin/themes",
        label: "Themes",
        description: "Block theme tokens and publish pipeline.",
        access: "admin",
        icon: Palette,
      },
      {
        href: "/admin/inventory",
        label: "Route inventory",
        description: "App routes, APIs, and layer map.",
        access: "admin",
        icon: Map,
      },
    ],
  },
];

export function canAccessWorkspaceItem(access: WorkspaceAccess, isAdmin: boolean): boolean {
  if (access === "admin") return isAdmin;
  return true;
}
