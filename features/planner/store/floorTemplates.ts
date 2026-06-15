import type { Wall, Room, DoorItem, WindowItem, FurnitureItem } from "./plannerStore";
import { v4 as uuid } from "uuid";

export interface FloorTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  size: string;
  walls: Omit<Wall, "id">[];
  rooms: Omit<Room, "id">[];
  doors: Omit<DoorItem, "id">[];
  windows: Omit<WindowItem, "id">[];
  furniture: Omit<FurnitureItem, "id" | "zIndex">[];
}

function w(sx: number, sy: number, ex: number, ey: number, thickness = 8): Omit<Wall, "id"> {
  return { start: { x: sx, y: sy }, end: { x: ex, y: ey }, thickness, color: "var(--border-soft)" };
}

function r(points: [number, number][], name: string, color: string): Omit<Room, "id"> {
  return { points: points.map(([x, y]) => ({ x, y })), name, color };
}

function d(x: number, y: number, rotation: number, width = 40): Omit<DoorItem, "id"> {
  return { x, y, width, rotation, swing: "left", openAngle: 90 };
}

function wi(x: number, y: number, rotation: number, width = 50): Omit<WindowItem, "id"> {
  return { x, y, width, rotation, style: "single" };
}

function f(
  catalogId: string, name: string, x: number, y: number,
  width: number, height: number, rotation: number, color: string, shape: string
): Omit<FurnitureItem, "id" | "zIndex"> {
  return { catalogId, name, x, y, width, height, rotation, color, shape };
}

export const floorTemplates: FloorTemplate[] = [
  {
    id: "blank",
    name: "Blank Canvas",
    description: "Start with an empty canvas",
    icon: "≡ƒôä",
    size: "",
    walls: [],
    rooms: [],
    doors: [],
    windows: [],
    furniture: [],
  },
  {
    id: "single-room",
    name: "Single Room",
    description: "One rectangular room, no furniture",
    icon: "Γ¼£",
    size: "~15m┬▓",
    walls: [
      w(200, 200, 500, 200),
      w(500, 200, 500, 500),
      w(500, 500, 200, 500),
      w(200, 500, 200, 200),
    ],
    rooms: [
      r([[200, 200], [500, 200], [500, 500], [200, 500]], "Room", "var(--surface-glass)"),
    ],
    doors: [d(350, 500, 0)],
    windows: [wi(350, 200, 0)],
    furniture: [],
  },
  {
    id: "open-plan",
    name: "Open Plan Office",
    description: "20 workstations in bench layout with breakout area",
    icon: "≡ƒÅó",
    size: "~120m┬▓",
    walls: [
      w(50, 50, 1100, 50),
      w(1100, 50, 1100, 700),
      w(1100, 700, 50, 700),
      w(50, 700, 50, 50),
      w(800, 450, 1100, 450),
    ],
    rooms: [
      r([[50, 50], [1100, 50], [1100, 450], [800, 450], [800, 700], [50, 700]], "Open Office", "var(--surface-glass)"),
      r([[800, 450], [1100, 450], [1100, 700], [800, 700]], "Breakout", "var(--surface-glass)"),
    ],
    doors: [d(800, 575, 90)],
    windows: [wi(300, 50, 0), wi(600, 50, 0), wi(900, 50, 0), wi(50, 375, 90), wi(1100, 250, 90)],
    furniture: [
      f("ws-bench-4", "Bench A", 325, 200, 480, 70, 0, "var(--border-soft)", "workstation-bench"),
      f("ws-bench-4", "Bench B", 325, 340, 480, 70, 0, "var(--border-soft)", "workstation-bench"),
      f("ws-bench-4", "Bench C", 325, 480, 480, 70, 0, "var(--border-soft)", "workstation-bench"),
      f("ws-bench-2", "Bench D", 325, 620, 240, 70, 0, "var(--border-soft)", "workstation-bench"),
      f("task-chair", "Chair", 150, 175, 22, 22, 0, "var(--border-soft)", "task-chair"),
      f("task-chair", "Chair", 270, 175, 22, 22, 0, "var(--border-soft)", "task-chair"),
      f("task-chair", "Chair", 390, 175, 22, 22, 0, "var(--border-soft)", "task-chair"),
      f("task-chair", "Chair", 510, 175, 22, 22, 0, "var(--border-soft)", "task-chair"),
      f("task-chair", "Chair", 150, 235, 22, 22, 180, "var(--border-soft)", "task-chair"),
      f("task-chair", "Chair", 270, 235, 22, 22, 180, "var(--border-soft)", "task-chair"),
      f("task-chair", "Chair", 390, 235, 22, 22, 180, "var(--border-soft)", "task-chair"),
      f("task-chair", "Chair", 510, 235, 22, 22, 180, "var(--border-soft)", "task-chair"),
      f("filing-2", "Pedestal", 80, 200, 20, 24, 0, "var(--border-soft)", "pedestal"),
      f("filing-2", "Pedestal", 80, 340, 20, 24, 0, "var(--border-soft)", "pedestal"),
      f("sofa-2", "Breakout Sofa", 950, 550, 140, 70, 0, "var(--border-soft)", "sofa-2seat"),
      f("cafeteria-round", "Coffee Table", 950, 630, 60, 60, 0, "var(--border-soft)", "cafeteria-table"),
      f("planter-rect", "Planter", 80, 100, 60, 20, 0, "var(--border-soft)", "planter"),
      f("planter-rect", "Planter", 80, 640, 60, 20, 0, "var(--border-soft)", "planter"),
    ],
  },
  {
    id: "executive-suite",
    name: "Executive Suite",
    description: "Executive desk with meeting area and lounge corner",
    icon: "≡ƒæö",
    size: "~45m┬▓",
    walls: [
      w(100, 100, 700, 100),
      w(700, 100, 700, 600),
      w(700, 600, 100, 600),
      w(100, 600, 100, 100),
      w(450, 350, 700, 350),
    ],
    rooms: [
      r([[100, 100], [700, 100], [700, 350], [450, 350], [450, 600], [100, 600]], "Executive Office", "var(--surface-glass)"),
      r([[450, 350], [700, 350], [700, 600], [450, 600]], "Meeting Corner", "var(--surface-glass)"),
    ],
    doors: [d(275, 600, 0), d(450, 475, 90)],
    windows: [wi(250, 100, 0), wi(500, 100, 0), wi(700, 250, 90), wi(700, 475, 90)],
    furniture: [
      f("exec-desk", "Executive Desk", 275, 250, 180, 80, 0, "var(--border-soft)", "workstation-linear"),
      f("executive-chair", "Executive Chair", 275, 310, 28, 28, 0, "var(--text-body)", "executive-chair"),
      f("visitor-chair", "Visitor 1", 200, 170, 20, 20, 180, "var(--border-soft)", "visitor-chair"),
      f("visitor-chair", "Visitor 2", 350, 170, 20, 20, 180, "var(--border-soft)", "visitor-chair"),
      f("credenza", "Credenza", 275, 130, 120, 20, 0, "var(--border-soft)", "credenza"),
      f("bookshelf-low", "Bookshelf", 150, 400, 80, 16, 0, "var(--border-soft)", "bookshelf"),
      f("meeting-4", "Meeting Table", 575, 475, 120, 80, 0, "var(--border-soft)", "meeting-table-4"),
      f("lounge-chair", "Lounge Chair", 150, 520, 70, 70, 0, "var(--border-soft)", "lounge-chair"),
      f("ottoman", "Ottoman", 240, 520, 50, 50, 0, "var(--border-soft)", "ottoman"),
      f("planter-round", "Plant", 130, 130, 30, 30, 0, "var(--border-soft)", "planter"),
      f("desk-lamp", "Desk Lamp", 200, 230, 12, 12, 0, "var(--color-warning)", "desk-lamp"),
    ],
  },
  {
    id: "conference",
    name: "Conference Room",
    description: "12-seat conference table with AV setup",
    icon: "≡ƒôè",
    size: "~40m┬▓",
    walls: [
      w(100, 100, 700, 100),
      w(700, 100, 700, 550),
      w(700, 550, 100, 550),
      w(100, 550, 100, 100),
    ],
    rooms: [
      r([[100, 100], [700, 100], [700, 550], [100, 550]], "Conference Room", "var(--surface-glass)"),
    ],
    doors: [d(200, 550, 0, 50)],
    windows: [wi(250, 100, 0), wi(450, 100, 0), wi(650, 100, 0)],
    furniture: [
      f("conference-10", "Conference Table", 400, 325, 300, 120, 0, "var(--border-soft)", "conference-table-10"),
      f("whiteboard", "Whiteboard", 400, 130, 120, 6, 0, "var(--surface-panel)", "whiteboard"),
      f("credenza", "Credenza", 400, 515, 120, 20, 0, "var(--border-soft)", "credenza"),
      f("planter-round", "Plant", 130, 130, 30, 30, 0, "var(--border-soft)", "planter"),
      f("planter-round", "Plant", 670, 130, 30, 30, 0, "var(--border-soft)", "planter"),
    ],
  },
  {
    id: "reception",
    name: "Reception Area",
    description: "Reception desk with waiting area and planting",
    icon: "≡ƒÅ¢∩╕Å",
    size: "~35m┬▓",
    walls: [
      w(100, 100, 700, 100),
      w(700, 100, 700, 550),
      w(700, 550, 100, 550),
      w(100, 550, 100, 100),
    ],
    rooms: [
      r([[100, 100], [700, 100], [700, 550], [100, 550]], "Reception", "var(--surface-glass)"),
    ],
    doors: [d(400, 550, 0, 60)],
    windows: [wi(200, 100, 0), wi(400, 100, 0), wi(600, 100, 0)],
    furniture: [
      f("reception-desk", "Reception Desk", 400, 200, 200, 80, 0, "var(--border-soft)", "reception-desk"),
      f("executive-chair", "Receptionist", 400, 260, 28, 28, 0, "var(--text-body)", "executive-chair"),
      f("sofa-3", "Waiting Sofa", 250, 430, 200, 80, 0, "var(--border-soft)", "sofa-3seat"),
      f("cafeteria-round", "Coffee Table", 250, 360, 60, 60, 0, "var(--border-soft)", "cafeteria-table"),
      f("lounge-chair", "Lounge 1", 550, 400, 70, 70, 0, "var(--border-soft)", "lounge-chair"),
      f("lounge-chair", "Lounge 2", 550, 490, 70, 70, 0, "var(--border-soft)", "lounge-chair"),
      f("planter-rect", "Planter 1", 150, 130, 60, 20, 0, "var(--border-soft)", "planter"),
      f("planter-rect", "Planter 2", 600, 130, 60, 20, 0, "var(--border-soft)", "planter"),
      f("coat-stand", "Coat Stand", 650, 500, 16, 16, 0, "var(--border-soft)", "coat-stand"),
    ],
  },
  {
    id: "cafeteria",
    name: "Cafeteria",
    description: "Cafeteria tables with serving counter area",
    icon: "≡ƒì╜∩╕Å",
    size: "~60m┬▓",
    walls: [
      w(50, 50, 900, 50),
      w(900, 50, 900, 600),
      w(900, 600, 50, 600),
      w(50, 600, 50, 50),
      w(650, 50, 650, 350),
    ],
    rooms: [
      r([[50, 50], [650, 50], [650, 350], [650, 600], [50, 600]], "Dining Area", "var(--surface-glass)"),
      r([[650, 50], [900, 50], [900, 350], [650, 350]], "Servery", "var(--surface-glass)"),
      r([[650, 350], [900, 350], [900, 600], [650, 600]], "Kitchen", "var(--surface-glass)"),
    ],
    doors: [d(650, 200, 90), d(650, 475, 90)],
    windows: [wi(200, 50, 0), wi(450, 50, 0), wi(50, 325, 90)],
    furniture: [
      f("cafeteria-round", "Table 1", 175, 175, 80, 80, 0, "var(--border-soft)", "cafeteria-table"),
      f("cafeteria-round", "Table 2", 350, 175, 80, 80, 0, "var(--border-soft)", "cafeteria-table"),
      f("cafeteria-round", "Table 3", 525, 175, 80, 80, 0, "var(--border-soft)", "cafeteria-table"),
      f("cafeteria-round", "Table 4", 175, 375, 80, 80, 0, "var(--border-soft)", "cafeteria-table"),
      f("cafeteria-round", "Table 5", 350, 375, 80, 80, 0, "var(--border-soft)", "cafeteria-table"),
      f("cafeteria-round", "Table 6", 525, 375, 80, 80, 0, "var(--border-soft)", "cafeteria-table"),
      f("cafeteria-rect", "Counter", 775, 150, 120, 50, 0, "var(--border-soft)", "dining-table-rect"),
      f("sofa-2", "Bench", 300, 530, 140, 50, 0, "var(--border-soft)", "sofa-2seat"),
      f("planter-rect", "Planter", 100, 100, 60, 20, 0, "var(--border-soft)", "planter"),
      f("waste-bin", "Bin", 600, 550, 12, 12, 0, "var(--border-soft)", "stool"),
    ],
  },
  {
    id: "private-office",
    name: "Private Office",
    description: "Manager desk with visitor chairs and bookshelf",
    icon: "≡ƒÜ¬",
    size: "~20m┬▓",
    walls: [
      w(200, 200, 550, 200),
      w(550, 200, 550, 500),
      w(550, 500, 200, 500),
      w(200, 500, 200, 200),
    ],
    rooms: [
      r([[200, 200], [550, 200], [550, 500], [200, 500]], "Private Office", "var(--surface-glass)"),
    ],
    doors: [d(375, 500, 0)],
    windows: [wi(375, 200, 0)],
    furniture: [
      f("ws-linear-140", "Desk", 375, 300, 140, 70, 0, "var(--border-soft)", "workstation-linear"),
      f("executive-chair", "Chair", 375, 350, 28, 28, 0, "var(--text-body)", "executive-chair"),
      f("visitor-chair", "Visitor 1", 325, 240, 20, 20, 180, "var(--border-soft)", "visitor-chair"),
      f("visitor-chair", "Visitor 2", 425, 240, 20, 20, 180, "var(--border-soft)", "visitor-chair"),
      f("bookshelf-low", "Bookshelf", 275, 225, 80, 16, 0, "var(--border-soft)", "bookshelf"),
      f("pedestal-2", "Pedestal", 460, 320, 20, 24, 0, "var(--border-soft)", "pedestal"),
      f("filing-2", "Filing", 230, 450, 20, 30, 0, "var(--border-soft)", "filing-cabinet"),
      f("planter-round", "Plant", 230, 225, 20, 20, 0, "var(--border-soft)", "planter"),
    ],
  },
];

export function instantiateTemplate(template: FloorTemplate) {
  return {
    walls: template.walls.map((w) => ({ ...w, id: uuid() })),
    rooms: template.rooms.map((r) => ({ ...r, id: uuid() })),
    doors: template.doors.map((d) => ({ ...d, id: uuid() })),
    windows: template.windows.map((w) => ({ ...w, id: uuid() })),
    furniture: template.furniture.map((f, i) => ({ ...f, id: uuid(), zIndex: i })),
  };
}
