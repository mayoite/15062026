/**
 * Layout templates for the canvas editor (one-click apply).
 * Each template defines shape placements relative to room bounds.
 */

export interface TemplateShape {
  type: string;
  label: string;
  x: number; // relative (0-1) to room width
  y: number; // relative (0-1) to room height
  widthMm: number;
  heightMm: number;
  seatCount?: number;
  zoneType?: string;
  props?: Record<string, unknown>;
}

export interface LayoutTemplate {
  id: string;
  name: string;
  description: string;
  category: "open-plan" | "private" | "conference" | "mixed" | "collaborative";
  shapes: TemplateShape[];
  recommendedRoomSize: { minWidth: number; minHeight: number };
  totalSeats: number;
}

export interface TemplateCanvasPlacement {
  id: string;
  label: string;
  type: string;
  width: number;
  height: number;
  left: number;
  top: number;
}

export function buildTemplateCanvasPlacements(template: LayoutTemplate): TemplateCanvasPlacement[] {
  return template.shapes.map((shape, index) => {
    const width = shape.widthMm;
    const height = shape.heightMm;
    const left = shape.x * template.recommendedRoomSize.minWidth + width / 2;
    const top = shape.y * template.recommendedRoomSize.minHeight + height / 2;

    return {
      id: `template-${template.id}-${index}`,
      label: shape.label,
      type: shape.type,
      width,
      height,
      left,
      top,
    };
  });
}

export const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  {
    id: "open-plan-24",
    name: "Open Plan Office",
    description: "24-seat open plan with benches, quiet zone, and break area",
    category: "open-plan",
    recommendedRoomSize: { minWidth: 800, minHeight: 600 },
    totalSeats: 24,
    shapes: [
      // Bench rows
      { type: "planner-bench", label: "Team A", x: 0.1, y: 0.15, widthMm: 280, heightMm: 140, seatCount: 4 },
      { type: "planner-bench", label: "Team A", x: 0.1, y: 0.4, widthMm: 280, heightMm: 140, seatCount: 4 },
      { type: "planner-bench", label: "Team B", x: 0.5, y: 0.15, widthMm: 280, heightMm: 140, seatCount: 4 },
      { type: "planner-bench", label: "Team B", x: 0.5, y: 0.4, widthMm: 280, heightMm: 140, seatCount: 4 },
      // Hot desks
      { type: "planner-desk", label: "Hot Desk", x: 0.1, y: 0.7, widthMm: 120, heightMm: 60, seatCount: 1 },
      { type: "planner-desk", label: "Hot Desk", x: 0.25, y: 0.7, widthMm: 120, heightMm: 60, seatCount: 1 },
      { type: "planner-desk", label: "Hot Desk", x: 0.4, y: 0.7, widthMm: 120, heightMm: 60, seatCount: 1 },
      { type: "planner-desk", label: "Hot Desk", x: 0.55, y: 0.7, widthMm: 120, heightMm: 60, seatCount: 1 },
      // Zones
      { type: "planner-zone", label: "Collaboration", x: 0.05, y: 0.05, widthMm: 450, heightMm: 350, zoneType: "collaborative" },
      { type: "planner-zone", label: "Quiet Zone", x: 0.7, y: 0.6, widthMm: 200, heightMm: 200, zoneType: "quiet" },
    ],
  },
  {
    id: "private-offices-8",
    name: "Private Offices",
    description: "8 private offices with shared meeting room",
    category: "private",
    recommendedRoomSize: { minWidth: 700, minHeight: 500 },
    totalSeats: 10,
    shapes: [
      // Row of private offices (top)
      { type: "planner-room", label: "Office 1", x: 0.05, y: 0.05, widthMm: 150, heightMm: 150 },
      { type: "planner-room", label: "Office 2", x: 0.25, y: 0.05, widthMm: 150, heightMm: 150 },
      { type: "planner-room", label: "Office 3", x: 0.45, y: 0.05, widthMm: 150, heightMm: 150 },
      { type: "planner-room", label: "Office 4", x: 0.65, y: 0.05, widthMm: 150, heightMm: 150 },
      // Row of private offices (bottom)
      { type: "planner-room", label: "Office 5", x: 0.05, y: 0.55, widthMm: 150, heightMm: 150 },
      { type: "planner-room", label: "Office 6", x: 0.25, y: 0.55, widthMm: 150, heightMm: 150 },
      { type: "planner-room", label: "Office 7", x: 0.45, y: 0.55, widthMm: 150, heightMm: 150 },
      { type: "planner-room", label: "Office 8", x: 0.65, y: 0.55, widthMm: 150, heightMm: 150 },
      // Desks inside offices
      { type: "planner-desk", label: "Desk", x: 0.08, y: 0.1, widthMm: 120, heightMm: 60, seatCount: 1 },
      { type: "planner-desk", label: "Desk", x: 0.28, y: 0.1, widthMm: 120, heightMm: 60, seatCount: 1 },
      // Shared meeting
      { type: "planner-conference", label: "Meeting Room", x: 0.75, y: 0.3, widthMm: 200, heightMm: 150 },
    ],
  },
  {
    id: "conference-heavy",
    name: "Conference-Heavy",
    description: "Multiple meeting rooms with minimal open workspace",
    category: "conference",
    recommendedRoomSize: { minWidth: 600, minHeight: 500 },
    totalSeats: 30,
    shapes: [
      { type: "planner-conference", label: "Boardroom", x: 0.05, y: 0.05, widthMm: 400, heightMm: 250 },
      { type: "planner-conference", label: "Meeting A", x: 0.55, y: 0.05, widthMm: 250, heightMm: 180 },
      { type: "planner-conference", label: "Meeting B", x: 0.55, y: 0.45, widthMm: 250, heightMm: 180 },
      { type: "planner-phone-booth", label: "Phone Booth 1", x: 0.05, y: 0.65, widthMm: 120, heightMm: 120 },
      { type: "planner-phone-booth", label: "Phone Booth 2", x: 0.2, y: 0.65, widthMm: 120, heightMm: 120 },
      { type: "planner-bench", label: "Hot Desks", x: 0.05, y: 0.85, widthMm: 280, heightMm: 80, seatCount: 4 },
    ],
  },
  {
    id: "mixed-workspace",
    name: "Mixed Workspace",
    description: "Balanced mix of open, private, and collaborative spaces",
    category: "mixed",
    recommendedRoomSize: { minWidth: 800, minHeight: 600 },
    totalSeats: 20,
    shapes: [
      // Open area
      { type: "planner-bench", label: "Open Bench", x: 0.05, y: 0.1, widthMm: 280, heightMm: 140, seatCount: 4 },
      { type: "planner-bench", label: "Open Bench", x: 0.05, y: 0.35, widthMm: 280, heightMm: 140, seatCount: 4 },
      // Focus zone
      { type: "planner-zone", label: "Focus Zone", x: 0.45, y: 0.05, widthMm: 250, heightMm: 300, zoneType: "focus" },
      { type: "planner-desk", label: "Focus Desk", x: 0.5, y: 0.1, widthMm: 120, heightMm: 60, seatCount: 1 },
      { type: "planner-desk", label: "Focus Desk", x: 0.5, y: 0.25, widthMm: 120, heightMm: 60, seatCount: 1 },
      { type: "planner-desk", label: "Focus Desk", x: 0.5, y: 0.4, widthMm: 120, heightMm: 60, seatCount: 1 },
      // Meeting rooms
      { type: "planner-conference", label: "Meeting", x: 0.05, y: 0.65, widthMm: 200, heightMm: 150 },
      { type: "planner-phone-booth", label: "Pod", x: 0.35, y: 0.65, widthMm: 120, heightMm: 120 },
      // Social area
      { type: "planner-zone", label: "Social", x: 0.55, y: 0.6, widthMm: 300, heightMm: 250, zoneType: "social" },
    ],
  },
  {
    id: "collaborative-hub",
    name: "Collaborative Hub",
    description: "Maximum collaboration with lounge seating and whiteboard walls",
    category: "collaborative",
    recommendedRoomSize: { minWidth: 600, minHeight: 500 },
    totalSeats: 16,
    shapes: [
      // Central collaboration zone
      { type: "planner-zone", label: "Collab Hub", x: 0.15, y: 0.15, widthMm: 400, heightMm: 350, zoneType: "collaborative" },
      // Cluster desks
      { type: "planner-desk", label: "Cluster", x: 0.2, y: 0.2, widthMm: 160, heightMm: 80, seatCount: 4 },
      { type: "planner-desk", label: "Cluster", x: 0.5, y: 0.2, widthMm: 160, heightMm: 80, seatCount: 4 },
      { type: "planner-desk", label: "Cluster", x: 0.2, y: 0.5, widthMm: 160, heightMm: 80, seatCount: 4 },
      { type: "planner-desk", label: "Cluster", x: 0.5, y: 0.5, widthMm: 160, heightMm: 80, seatCount: 4 },
      // Phone booths on edges
      { type: "planner-phone-booth", label: "Booth", x: 0.8, y: 0.1, widthMm: 120, heightMm: 120 },
      { type: "planner-phone-booth", label: "Booth", x: 0.8, y: 0.35, widthMm: 120, heightMm: 120 },
      // Social corner
      { type: "planner-zone", label: "Lounge", x: 0.7, y: 0.6, widthMm: 200, heightMm: 200, zoneType: "social" },
    ],
  },
];

/**
 * Get template by ID.
 */
export function getTemplate(id: string): LayoutTemplate | undefined {
  return LAYOUT_TEMPLATES.find((t) => t.id === id);
}

/**
 * Get templates by category.
 */
export function getTemplatesByCategory(category: LayoutTemplate["category"]): LayoutTemplate[] {
  return LAYOUT_TEMPLATES.filter((t) => t.category === category);
}
