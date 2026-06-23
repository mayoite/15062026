import { resolveCatalogPlacementFootprintMm } from "@/features/planner/catalog/catalogBlockBridge";

import type { PlannerPrimaryPurpose } from "@/features/planner/onboarding/projectSetup";

import type {
  CatalogItem,
  CatalogPurposeTab,
  CatalogSubCategoryDef,
  CatalogSubCategoryId,
} from "./catalogTypes";

/** Map onboarding purpose filter to the default catalog purpose tab. */
export function mapPurposeFilterToCatalogTab(
  purpose: PlannerPrimaryPurpose | null,
): CatalogPurposeTab {
  switch (purpose) {
    case "meeting-rooms":
      return "meeting";
    case "executive-cabin":
      return "cabins";
    case "mixed":
      return "workstations";
    default:
      return "workstations";
  }
}

export const CATALOG_SUB_CATEGORIES: Record<CatalogPurposeTab, CatalogSubCategoryDef[]> = {
  workstations: [
    { id: "linear", label: "Linear" },
    { id: "l-shaped", label: "L-shaped" },
    { id: "cluster", label: "Cluster" },
    { id: "height-adjustable", label: "Height-Adjustable" },
  ],
  seating: [
    { id: "task-chair", label: "Task Chair" },
    { id: "lounge", label: "Lounge" },
    { id: "stool", label: "Stool" },
    { id: "bench", label: "Bench" },
  ],
  meeting: [
    { id: "phone-booth", label: "Phone Booth" },
    { id: "small", label: "Small (4–6p)" },
    { id: "medium", label: "Medium (8–10p)" },
    { id: "conference", label: "Conference" },
  ],
  storage: [
    { id: "pedestal", label: "Pedestal" },
    { id: "locker", label: "Locker" },
    { id: "cabinet", label: "Cabinet" },
    { id: "wardrobe", label: "Wardrobe" },
  ],
  cabins: [
    { id: "executive", label: "Executive" },
    { id: "manager", label: "Manager" },
    { id: "boardroom", label: "Boardroom" },
  ],
  accessories: [
    { id: "screens", label: "Screens" },
    { id: "cpu", label: "CPU" },
    { id: "keyboard", label: "Keyboard" },
    { id: "power", label: "Power & AV" },
  ],
};

const SHORT_NAME_MAX = 30;

function slugPart(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 12);
}

export function deriveCatalogSku(item: CatalogItem): string {
  const seatTag = item.tags.find((tag) => /^\d+-seater$/.test(tag));
  if (seatTag) {
    const lengthMatch = item.name.match(/\((\d{3,4})mm\)/i);
    const length = lengthMatch?.[1] ?? "";
    return slugPart(`${seatTag}-${length || item.shapeType}`);
  }
  const compact = item.id.split("-").slice(-2).join("-");
  return slugPart(compact || item.id).slice(0, 14);
}

export function deriveCatalogShortName(item: CatalogItem): string {
  const afterDash = item.name.includes(" — ") ? item.name.split(" — ").pop() ?? item.name : item.name;
  const cleaned = afterDash.replace(/\s*\(\d+[^)]*\)\s*/g, " ").trim();
  if (cleaned.length <= SHORT_NAME_MAX) return cleaned;
  return `${cleaned.slice(0, SHORT_NAME_MAX - 1).trimEnd()}…`;
}

export function deriveCatalogMaterial(item: CatalogItem): string {
  const fromName = item.name.split(" — ")[0]?.trim();
  if (fromName && /laminate|particle|crca|steel|veneer|melamine/i.test(fromName)) {
    return fromName.length > 48 ? `${fromName.slice(0, 47)}…` : fromName;
  }
  if (/laminate|particle|crca|steel/i.test(item.description)) {
    return item.description;
  }
  return "Office-grade laminate";
}

export function deriveCatalogUrl(item: CatalogItem): string {
  const query = encodeURIComponent(deriveCatalogShortName(item));
  return `/products?q=${query}`;
}

export function formatCatalogSeatFootprint(item: CatalogItem): string {
  const widthMm = item.widthMm * 10;
  const depthMm = item.heightMm * 10;
  const widthM = widthMm / 1000;
  const depthM = depthMm / 1000;
  const fmt = (value: number) => (value >= 1 ? value.toFixed(1) : value.toFixed(2)).replace(/\.0$/, "");
  return `${fmt(widthM)}m × ${fmt(depthM)}m`;
}

export function formatCatalogDimensionsLabel(item: CatalogItem): string {
  const { widthMm, depthMm } = resolveCatalogPlacementFootprintMm(item);
  return `${Math.round(widthMm).toLocaleString("en-IN")} mm × ${Math.round(depthMm).toLocaleString("en-IN")} mm`;
}

function tagBlob(item: CatalogItem): string {
  return `${item.name} ${item.description} ${item.tags.join(" ")}`.toLowerCase();
}

export function resolveCatalogPurposeTab(item: CatalogItem): CatalogPurposeTab {
  if (item.purposeTab) return item.purposeTab;

  const blob = tagBlob(item);

  if (item.category === "storage") return "storage";
  if (item.category === "desks") return "workstations";

  if (item.category === "rooms") {
    if (blob.includes("cabin") || blob.includes("executive") || blob.includes("boardroom")) {
      return "cabins";
    }
    return "meeting";
  }

  if (item.category === "equipment") {
    if (blob.includes("accessory") || blob.includes("screen") || blob.includes("keyboard") || blob.includes("cpu")) {
      return "accessories";
    }
    if (blob.includes("chair") || blob.includes("seat") || blob.includes("stool") || blob.includes("lounge")) {
      return "seating";
    }
    return "accessories";
  }

  if (item.category === "zones") return "meeting";
  return "accessories";
}

export function resolveCatalogSubCategory(item: CatalogItem, purpose: CatalogPurposeTab): CatalogSubCategoryId {
  if (item.subCategory) return item.subCategory;

  const blob = tagBlob(item);

  if (purpose === "workstations") {
    if (blob.includes("l-shape") || blob.includes("l shape")) return "l-shaped";
    if (blob.includes("adjustable") || blob.includes("height")) return "height-adjustable";
    if ((item.seatCount ?? 0) > 1 || blob.includes("sharing") || item.shapeType === "planner-bench") {
      return "cluster";
    }
    return "linear";
  }

  if (purpose === "seating") {
    if (blob.includes("stool")) return "stool";
    if (blob.includes("lounge") || blob.includes("sofa")) return "lounge";
    if (blob.includes("bench")) return "bench";
    return "task-chair";
  }

  if (purpose === "meeting") {
    if (blob.includes("phone") || blob.includes("booth") || blob.includes("pod")) return "phone-booth";
    if (blob.includes("conference") || blob.includes("boardroom") || (item.seatCount ?? 0) >= 12) {
      return "conference";
    }
    if (blob.includes("small") || item.name.includes("(4")) return "small";
    return "medium";
  }

  if (purpose === "storage") {
    if (blob.includes("pedestal")) return "pedestal";
    if (blob.includes("locker")) return "locker";
    if (blob.includes("wardrobe")) return "wardrobe";
    return "cabinet";
  }

  if (purpose === "cabins") {
    if (blob.includes("boardroom")) return "boardroom";
    if (blob.includes("executive")) return "executive";
    return "manager";
  }

  if (blob.includes("keyboard")) return "keyboard";
  if (blob.includes("cpu")) return "cpu";
  if (blob.includes("screen") || blob.includes("display")) return "screens";
  return "power";
}

export function enrichCatalogItem(item: CatalogItem): CatalogItem {
  const purposeTab = resolveCatalogPurposeTab(item);
  return {
    ...item,
    sku: item.sku ?? deriveCatalogSku(item),
    shortName: item.shortName ?? deriveCatalogShortName(item),
    material: item.material ?? deriveCatalogMaterial(item),
    catalogUrl: item.catalogUrl ?? deriveCatalogUrl(item),
    purposeTab,
    subCategory: resolveCatalogSubCategory(item, purposeTab),
  };
}

export function enrichCatalogItems(items: CatalogItem[]): CatalogItem[] {
  return items.map(enrichCatalogItem);
}

export function itemMatchesCatalogSearch(item: CatalogItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const enriched = enrichCatalogItem(item);
  return (
    item.name.toLowerCase().includes(q) ||
    item.description.toLowerCase().includes(q) ||
    item.tags.some((tag) => tag.toLowerCase().includes(q)) ||
    (enriched.sku ?? "").toLowerCase().includes(q) ||
    (enriched.shortName ?? "").toLowerCase().includes(q) ||
    (enriched.material ?? "").toLowerCase().includes(q)
  );
}
