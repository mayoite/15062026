export interface HelpSection {
  id: string;
  title: string;
  summary: string;
  keywords: string[];
  /** Links to a dedicated feature marketing page when set */
  featureSlug?: string;
}

export const PLANNER_HELP_SECTIONS: HelpSection[] = [
  {
    id: "getting-started",
    title: "Getting started",
    summary: "Open the planner, pick a template, and place your first desk.",
    keywords: ["start", "template", "new", "blank"],
  },
  {
    id: "canvas-basics",
    title: "Canvas basics",
    summary: "Pan, zoom, select, and switch between 2D, 3D, and split view.",
    keywords: ["pan", "zoom", "2d", "3d", "split", "ctrl+tab"],
    featureSlug: "3d-view",
  },
  {
    id: "catalog-and-blocks",
    title: "Catalog and blocks",
    summary: "Drag furniture from the library; symbols are mm-accurate vectors.",
    keywords: ["catalog", "desk", "bench", "drag", "library"],
    featureSlug: "catalog",
  },
  {
    id: "walls-and-rooms",
    title: "Walls and rooms",
    summary: "Draw walls, define rooms, and add door and window openings.",
    keywords: ["wall", "room", "door", "window"],
  },
  {
    id: "select-and-edit",
    title: "Select and edit",
    summary: "Select blocks, rotate them, and adjust width or seating in the inspector.",
    keywords: ["select", "rotate", "inspector", "properties", "resize"],
    featureSlug: "catalog",
  },
  {
    id: "infrastructure-icons",
    title: "Infrastructure icons",
    summary: "Place APs, displays, badge readers, and outlets for visual planning only.",
    keywords: ["ap", "wifi", "display", "outlet", "badge"],
  },
  {
    id: "layers-and-visibility",
    title: "Layers and visibility",
    summary: "Toggle furniture, walls, and infrastructure layers independently.",
    keywords: ["layer", "hide", "show", "visibility", "toggle"],
  },
  {
    id: "measurements",
    title: "Measurements and area",
    summary: "Add dimension lines and read total area from the status bar.",
    keywords: ["measure", "dimension", "area", "mm"],
    featureSlug: "measure",
  },
  {
    id: "ai-assistant",
    title: "AI assistant",
    summary: "Chat, auto-furnish, and layout wizard with ghost preview before apply.",
    keywords: ["ai", "furnish", "wizard", "chat"],
    featureSlug: "ai-assist",
  },
  {
    id: "export-and-share",
    title: "Export and PDF",
    summary: "Branded PDF export with optional BOQ table.",
    keywords: ["export", "pdf", "boq", "print"],
    featureSlug: "export",
  },
  {
    id: "keyboard-shortcuts",
    title: "Keyboard shortcuts",
    summary: "Ctrl+Tab cycles view modes; Escape closes panels.",
    keywords: ["shortcut", "keyboard", "ctrl"],
  },
  {
    id: "saving-and-autosave",
    title: "Saving and autosave",
    summary: "Sessions autosave to your browser; members keep named save slots in their account.",
    keywords: ["autosave", "save", "restore", "slot", "reload"],
  },
  {
    id: "guest-vs-member",
    title: "Guest vs member",
    summary: "Guest explores the canvas; members save, export, and publish.",
    keywords: ["guest", "login", "save", "member"],
  },
  {
    id: "faq",
    title: "FAQ",
    summary: "Common questions about accuracy, browsers, and save behaviour.",
    keywords: ["faq", "browser", "save", "offline"],
  },
];
