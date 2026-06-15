/**
 * Unified planner catalog - curated seed items + CSV-generated workstations.
 */

import {
  CATALOG_CATEGORIES,
  type CatalogCategory,
  type CatalogItem,
} from "./catalogTypes";

import { GENERATED_CATALOG_ITEMS } from "./generatedCatalogItems";

/** Hand-curated rooms, zones, infrastructure - not from CSV ingest. */
export const CURATED_CATALOG_ITEMS: CatalogItem[] = [
  {
    id: "room-meeting-4",
    name: "Meeting Room (4p)",
    category: "rooms",
    shapeType: "planner-room",
    widthMm: 250,
    heightMm: 200,
    depthMm: 0,
    description: "Small meeting room for 4",
    tags: ["room", "meeting", "small"],
  },
  {
    id: "room-meeting-8",
    name: "Meeting Room (8p)",
    category: "rooms",
    shapeType: "planner-room",
    widthMm: 350,
    heightMm: 280,
    depthMm: 0,
    description: "Medium meeting room for 8",
    tags: ["room", "meeting", "medium"],
  },
  {
    id: "room-conference-12",
    name: "Conference (12p)",
    category: "rooms",
    shapeType: "planner-conference",
    widthMm: 450,
    heightMm: 300,
    depthMm: 0,
    description: "Large conference room for 12",
    tags: ["conference", "large", "presentation"],
  },
  {
    id: "room-conference-20",
    name: "Boardroom (20p)",
    category: "rooms",
    shapeType: "planner-conference",
    widthMm: 600,
    heightMm: 400,
    depthMm: 0,
    description: "Executive boardroom for 20",
    tags: ["conference", "boardroom", "executive"],
  },
  {
    id: "booth-phone-1",
    name: "Phone Booth",
    category: "rooms",
    shapeType: "planner-phone-booth",
    widthMm: 120,
    heightMm: 120,
    depthMm: 0,
    description: "Single-person phone booth",
    tags: ["booth", "phone", "private"],
  },
  {
    id: "booth-focus-1",
    name: "Focus Pod",
    category: "rooms",
    shapeType: "planner-phone-booth",
    widthMm: 150,
    heightMm: 150,
    depthMm: 0,
    description: "Single-person focus pod",
    tags: ["pod", "focus", "quiet"],
  },
  {
    id: "zone-collab",
    name: "Collaboration Zone",
    category: "zones",
    shapeType: "planner-zone",
    widthMm: 500,
    heightMm: 400,
    depthMm: 0,
    description: "Open collaboration area",
    tags: ["zone", "collaboration", "open"],
  },
  {
    id: "zone-focus",
    name: "Focus Zone",
    category: "zones",
    shapeType: "planner-zone",
    widthMm: 400,
    heightMm: 300,
    depthMm: 0,
    description: "Quiet focused work area",
    tags: ["zone", "focus", "quiet"],
  },
  {
    id: "infra-ap",
    name: "Access Point",
    category: "infrastructure",
    shapeType: "planner-desk",
    widthMm: 30,
    heightMm: 30,
    depthMm: 30,
    description: "Wi-Fi access point (plan symbol)",
    tags: ["ap", "wifi", "network"],
  },
  {
    id: "infra-display",
    name: "Wall Display",
    category: "infrastructure",
    shapeType: "planner-desk",
    widthMm: 120,
    heightMm: 8,
    depthMm: 8,
    description: "Meeting room display",
    tags: ["display", "av", "screen"],
  },
  {
    id: "infra-outlet",
    name: "Power Outlet",
    category: "infrastructure",
    shapeType: "planner-desk",
    widthMm: 12,
    heightMm: 8,
    depthMm: 8,
    description: "Floor or wall outlet",
    tags: ["outlet", "power", "electrical"],
  },
];

export const PLANNER_CATALOG_ITEMS: CatalogItem[] = dedupeMerged([
  ...CURATED_CATALOG_ITEMS,
  ...GENERATED_CATALOG_ITEMS,
]);

export { CATALOG_CATEGORIES };

export function getPlannerCatalogByCategory(category: CatalogCategory): CatalogItem[] {
  return PLANNER_CATALOG_ITEMS.filter((item) => item.category === category);
}

export function searchPlannerCatalog(query: string): CatalogItem[] {
  if (!query.trim()) return PLANNER_CATALOG_ITEMS;
  const lower = query.toLowerCase();
  return PLANNER_CATALOG_ITEMS.filter(
    (item) =>
      item.name.toLowerCase().includes(lower) ||
      item.description.toLowerCase().includes(lower) ||
      item.tags.some((tag) => tag.includes(lower)),
  );
}

function dedupeMerged(items: CatalogItem[]): CatalogItem[] {
  const byId = new Map<string, CatalogItem>();
  for (const item of items) {
    byId.set(item.id, item);
  }
  return [...byId.values()];
}
