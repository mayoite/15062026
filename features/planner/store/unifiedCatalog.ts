export type FurnitureCategory =
  | "workstation"
  | "seating"
  | "table"
  | "storage"
  | "softSeating"
  | "accessory"
  | "partition"
  | "custom";

export interface UnifiedCatalogItem {
  id: string;
  slug: string;
  name: string;
  category: string;
  normalizedCategory: FurnitureCategory;
  series: string;
  widthMm: number;
  depthMm: number;
  heightMm: number;
  color: string;
  flagshipImage: string;
  images: string[];
  dimensions: string;
  description: string;
  price?: number;
  active: boolean;
  source: "database" | "local" | "managed";
}

const BUILTIN_CATALOG: UnifiedCatalogItem[] = [
  { id: "ws-linear-120", slug: "linear-desk-1200", name: "Linear Desk 1200", category: "Workstations", normalizedCategory: "workstation", series: "Linear", widthMm: 1200, depthMm: 600, heightMm: 750, color: "var(--border-soft)", flagshipImage: "", images: [], dimensions: "1200 x 600 mm", description: "Standard linear desk 1200mm wide", active: true, source: "local" },
  { id: "ws-linear-140", slug: "linear-desk-1400", name: "Linear Desk 1400", category: "Workstations", normalizedCategory: "workstation", series: "Linear", widthMm: 1400, depthMm: 700, heightMm: 750, color: "var(--border-soft)", flagshipImage: "", images: [], dimensions: "1400 x 700 mm", description: "Standard linear desk 1400mm wide", active: true, source: "local" },
  { id: "ws-linear-160", slug: "linear-desk-1600", name: "Linear Desk 1600", category: "Workstations", normalizedCategory: "workstation", series: "Linear", widthMm: 1600, depthMm: 800, heightMm: 750, color: "var(--border-soft)", flagshipImage: "", images: [], dimensions: "1600 x 800 mm", description: "Standard linear desk 1600mm wide", active: true, source: "local" },
  { id: "ws-l-shape", slug: "l-shaped-workstation", name: "L-Shaped Workstation", category: "Workstations", normalizedCategory: "workstation", series: "L-Shape", widthMm: 1600, depthMm: 1400, heightMm: 750, color: "var(--border-soft)", flagshipImage: "", images: [], dimensions: "1600 x 1400 mm", description: "L-shaped corner workstation", active: true, source: "local" },
  { id: "ws-cluster-4", slug: "4-person-cluster", name: "4-Person Cluster", category: "Workstations", normalizedCategory: "workstation", series: "Cluster", widthMm: 2400, depthMm: 1400, heightMm: 750, color: "var(--border-soft)", flagshipImage: "", images: [], dimensions: "2400 x 1400 mm", description: "Four-person workstation cluster", active: true, source: "local" },
  { id: "ws-bench-2", slug: "bench-desk-2p", name: "Bench Desk (2-Person)", category: "Workstations", normalizedCategory: "workstation", series: "Bench", widthMm: 2400, depthMm: 700, heightMm: 750, color: "var(--border-soft)", flagshipImage: "", images: [], dimensions: "2400 x 700 mm", description: "Two-person bench desk", active: true, source: "local" },
  { id: "standing-desk", slug: "standing-desk", name: "Standing Desk", category: "Workstations", normalizedCategory: "workstation", series: "Adjustable", widthMm: 1400, depthMm: 700, heightMm: 1200, color: "var(--border-soft)", flagshipImage: "", images: [], dimensions: "1400 x 700 mm", description: "Height-adjustable standing desk", active: true, source: "local" },
  { id: "exec-desk", slug: "executive-desk", name: "Executive Desk", category: "Workstations", normalizedCategory: "workstation", series: "Executive", widthMm: 1800, depthMm: 800, heightMm: 750, color: "var(--border-soft)", flagshipImage: "", images: [], dimensions: "1800 x 800 mm", description: "Premium executive desk", active: true, source: "local" },
  { id: "reception-desk", slug: "reception-desk", name: "Reception Desk", category: "Workstations", normalizedCategory: "workstation", series: "Reception", widthMm: 2000, depthMm: 800, heightMm: 1100, color: "var(--border-soft)", flagshipImage: "", images: [], dimensions: "2000 x 800 mm", description: "L-shaped reception counter", active: true, source: "local" },

  { id: "task-chair", slug: "task-chair", name: "Task Chair", category: "Seating", normalizedCategory: "seating", series: "Task", widthMm: 500, depthMm: 500, heightMm: 900, color: "var(--border-soft)", flagshipImage: "", images: [], dimensions: "500 x 500 mm", description: "Ergonomic task chair", active: true, source: "local" },
  { id: "executive-chair", slug: "executive-chair", name: "Executive Chair", category: "Seating", normalizedCategory: "seating", series: "Executive", widthMm: 600, depthMm: 600, heightMm: 1200, color: "var(--text-body)", flagshipImage: "", images: [], dimensions: "600 x 600 mm", description: "High-back executive chair", active: true, source: "local" },
  { id: "visitor-chair", slug: "visitor-chair", name: "Visitor Chair", category: "Seating", normalizedCategory: "seating", series: "Visitor", widthMm: 500, depthMm: 500, heightMm: 850, color: "var(--border-soft)", flagshipImage: "", images: [], dimensions: "500 x 500 mm", description: "Guest visitor chair", active: true, source: "local" },
  { id: "bar-stool", slug: "bar-stool", name: "Bar Stool", category: "Seating", normalizedCategory: "seating", series: "Stool", widthMm: 400, depthMm: 400, heightMm: 750, color: "var(--border-soft)", flagshipImage: "", images: [], dimensions: "400 x 400 mm", description: "Counter-height bar stool", active: true, source: "local" },

  { id: "meeting-4", slug: "meeting-table-4", name: "Meeting Table (4-Seat)", category: "Tables", normalizedCategory: "table", series: "Meeting", widthMm: 1200, depthMm: 800, heightMm: 750, color: "var(--border-soft)", flagshipImage: "", images: [], dimensions: "1200 x 800 mm", description: "4-seat meeting table", active: true, source: "local" },
  { id: "meeting-6", slug: "meeting-table-6", name: "Meeting Table (6-Seat)", category: "Tables", normalizedCategory: "table", series: "Meeting", widthMm: 1800, depthMm: 900, heightMm: 750, color: "var(--border-soft)", flagshipImage: "", images: [], dimensions: "1800 x 900 mm", description: "6-seat meeting table", active: true, source: "local" },
  { id: "conference-10", slug: "conference-table-10", name: "Conference Table (10-Seat)", category: "Tables", normalizedCategory: "table", series: "Conference", widthMm: 3000, depthMm: 1200, heightMm: 750, color: "var(--border-soft)", flagshipImage: "", images: [], dimensions: "3000 x 1200 mm", description: "10-seat boardroom table", active: true, source: "local" },
  { id: "cafeteria-round", slug: "cafeteria-table-round", name: "Cafeteria Table (Round)", category: "Tables", normalizedCategory: "table", series: "Cafeteria", widthMm: 800, depthMm: 800, heightMm: 750, color: "var(--border-soft)", flagshipImage: "", images: [], dimensions: "800 x 800 mm", description: "Round cafeteria table", active: true, source: "local" },

  { id: "pedestal-2", slug: "pedestal-2-drawer", name: "2-Drawer Pedestal", category: "Storage", normalizedCategory: "storage", series: "Pedestal", widthMm: 400, depthMm: 500, heightMm: 600, color: "var(--border-soft)", flagshipImage: "", images: [], dimensions: "400 x 500 mm", description: "Under-desk mobile pedestal", active: true, source: "local" },
  { id: "filing-4", slug: "filing-cabinet-4", name: "Filing Cabinet (4-Drawer)", category: "Storage", normalizedCategory: "storage", series: "Filing", widthMm: 500, depthMm: 600, heightMm: 1300, color: "var(--border-soft)", flagshipImage: "", images: [], dimensions: "500 x 600 mm", description: "4-drawer vertical filing cabinet", active: true, source: "local" },
  { id: "bookshelf-tall", slug: "bookshelf-tall", name: "Tall Bookshelf", category: "Storage", normalizedCategory: "storage", series: "Shelving", widthMm: 800, depthMm: 400, heightMm: 1800, color: "var(--border-soft)", flagshipImage: "", images: [], dimensions: "800 x 400 mm", description: "Open tall bookshelf unit", active: true, source: "local" },
  { id: "locker-bank-4", slug: "locker-bank-4", name: "Locker Bank (4-wide)", category: "Storage", normalizedCategory: "storage", series: "Locker", widthMm: 1200, depthMm: 500, heightMm: 1800, color: "var(--border-soft)", flagshipImage: "", images: [], dimensions: "1200 x 500 mm", description: "4-wide locker unit", active: true, source: "local" },
  { id: "credenza", slug: "credenza", name: "Credenza", category: "Storage", normalizedCategory: "storage", series: "Credenza", widthMm: 1200, depthMm: 500, heightMm: 750, color: "var(--border-soft)", flagshipImage: "", images: [], dimensions: "1200 x 500 mm", description: "Low storage credenza", active: true, source: "local" },

  { id: "sofa-2", slug: "sofa-2-seat", name: "2-Seat Sofa", category: "Soft Seating", normalizedCategory: "softSeating", series: "Sofa", widthMm: 1400, depthMm: 700, heightMm: 800, color: "var(--border-soft)", flagshipImage: "", images: [], dimensions: "1400 x 700 mm", description: "Two-seater lounge sofa", active: true, source: "local" },
  { id: "sofa-3", slug: "sofa-3-seat", name: "3-Seat Sofa", category: "Soft Seating", normalizedCategory: "softSeating", series: "Sofa", widthMm: 2000, depthMm: 800, heightMm: 800, color: "var(--border-soft)", flagshipImage: "", images: [], dimensions: "2000 x 800 mm", description: "Three-seater lounge sofa", active: true, source: "local" },
  { id: "lounge-chair", slug: "lounge-chair", name: "Lounge Chair", category: "Soft Seating", normalizedCategory: "softSeating", series: "Lounge", widthMm: 700, depthMm: 700, heightMm: 800, color: "var(--border-soft)", flagshipImage: "", images: [], dimensions: "700 x 700 mm", description: "Upholstered lounge chair", active: true, source: "local" },
  { id: "ottoman", slug: "ottoman", name: "Ottoman", category: "Soft Seating", normalizedCategory: "softSeating", series: "Ottoman", widthMm: 500, depthMm: 500, heightMm: 450, color: "var(--border-soft)", flagshipImage: "", images: [], dimensions: "500 x 500 mm", description: "Upholstered ottoman", active: true, source: "local" },

  { id: "screen-120", slug: "screen-divider-1200", name: "Screen Divider 1200", category: "Accessories", normalizedCategory: "partition", series: "Screen", widthMm: 1200, depthMm: 40, heightMm: 1400, color: "var(--border-soft)", flagshipImage: "", images: [], dimensions: "1200 x 40 mm", description: "Freestanding privacy screen", active: true, source: "local" },
  { id: "whiteboard", slug: "whiteboard", name: "Whiteboard", category: "Accessories", normalizedCategory: "accessory", series: "Presentation", widthMm: 1200, depthMm: 60, heightMm: 900, color: "var(--surface-panel)", flagshipImage: "", images: [], dimensions: "1200 x 60 mm", description: "Wall-mounted whiteboard", active: true, source: "local" },
  { id: "planter-rect", slug: "planter-box", name: "Planter Box", category: "Accessories", normalizedCategory: "accessory", series: "Plants", widthMm: 600, depthMm: 200, heightMm: 800, color: "var(--border-soft)", flagshipImage: "", images: [], dimensions: "600 x 200 mm", description: "Rectangular planter box", active: true, source: "local" },
  { id: "phone-booth", slug: "phone-booth", name: "Phone Booth", category: "Accessories", normalizedCategory: "accessory", series: "Pods", widthMm: 1000, depthMm: 1000, heightMm: 2200, color: "var(--border-soft)", flagshipImage: "", images: [], dimensions: "1000 x 1000 mm", description: "Single-person phone booth pod", active: true, source: "local" },
];

export function getUnifiedCatalog(): UnifiedCatalogItem[] {
  return BUILTIN_CATALOG.filter((item) => item.active);
}

export function getCatalogCategories(): string[] {
  const cats = new Set(BUILTIN_CATALOG.filter((i) => i.active).map((i) => i.category));
  const priority = ["Workstations", "Seating", "Tables", "Storage", "Soft Seating", "Accessories"];
  const sorted = priority.filter((p) => cats.has(p));
  const rest = Array.from(cats).filter((c) => !priority.includes(c)).sort();
  return [...sorted, ...rest];
}

export function getCatalogSeries(category: string): string[] {
  const series = new Set(
    BUILTIN_CATALOG.filter((i) => i.active && i.category === category).map((i) => i.series),
  );
  return Array.from(series).sort();
}

export function searchCatalog(query: string, category?: string): UnifiedCatalogItem[] {
  const q = query.toLowerCase();
  return BUILTIN_CATALOG.filter((item) => {
    if (!item.active) return false;
    if (category && item.category !== category) return false;
    return (
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.series.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    );
  });
}

export function getCatalogItemBySlug(slug: string): UnifiedCatalogItem | null {
  return BUILTIN_CATALOG.find((item) => item.slug === slug && item.active) ?? null;
}

export function mergeDatabaseProducts(
  databaseProducts: Array<{
    id?: string;
    slug?: string;
    name: string;
    category?: string;
    flagship_image?: string;
    images?: string[];
    specs?: { dimensions?: string; [k: string]: unknown };
    [k: string]: unknown;
  }>,
): UnifiedCatalogItem[] {
  const existingSlugs = new Set(BUILTIN_CATALOG.map((i) => i.slug));
  const merged: UnifiedCatalogItem[] = [...BUILTIN_CATALOG];

  for (const product of databaseProducts) {
    const slug = product.slug ?? product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (existingSlugs.has(slug)) continue;

    const dims = parseDimensionString(product.specs?.dimensions);
    merged.push({
      id: product.id ?? `db-${slug}`,
      slug,
      name: product.name,
      category: product.category ?? "Custom",
      normalizedCategory: "custom",
      series: (product as Record<string, unknown>).seriesName as string ?? "Database",
      widthMm: dims?.widthMm ?? 1000,
      depthMm: dims?.depthMm ?? 600,
      heightMm: 750,
      color: "var(--border-soft)",
      flagshipImage: product.flagship_image ?? "",
      images: product.images ?? [],
      dimensions: product.specs?.dimensions ?? "",
      description: "",
      active: true,
      source: "database",
    });
    existingSlugs.add(slug);
  }

  return merged.filter((i) => i.active);
}

function parseDimensionString(raw?: string): { widthMm: number; depthMm: number } | null {
  if (!raw) return null;
  const numbers = raw.match(/\d+(?:\.\d+)?/g);
  if (!numbers || numbers.length < 2) return null;
  const a = parseFloat(numbers[0]);
  const b = parseFloat(numbers[1]);
  if (!isFinite(a) || !isFinite(b) || a <= 0 || b <= 0) return null;
  const hasExplicitMm = /\bmm\b/i.test(raw);
  const hasExplicitCm = /\bcm\b/i.test(raw);
  const multiplier = hasExplicitCm ? 10 : hasExplicitMm ? 1 : (a < 300 && b < 300) ? 10 : 1;
  return {
    widthMm: Math.max(200, Math.round(a * multiplier)),
    depthMm: Math.max(200, Math.round(b * multiplier)),
  };
}
