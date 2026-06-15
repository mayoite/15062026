import type { FurnitureItem, Room, Wall, DoorItem, WindowItem } from "@/features/oando-planner/data/plannerStore";
import { furnitureCatalog } from "@/features/oando-planner/data/catalogData";

export interface BOQItem {
  name: string;
  sku: string;
  category: string;
  quantity: number;
  widthMm: number;
  depthMm: number;
  heightMm: number;
  unitPriceInr: number;
  lineTotal: number;
  /** Legacy cm-based dimensions for backward compat */
  widthCm: number;
  heightCm: number;
  instances: FurnitureItem[];
}

export interface BOQCategory {
  category: string;
  items: BOQItem[];
  totalItems: number;
  categoryTotal: number;
}

export interface BOQData {
  categories: BOQCategory[];
  totalFurnitureItems: number;
  totalUniqueItems: number;
  grandTotal: number;
  doors: number;
  windows: number;
  walls: number;
  rooms: number;
}

export function generateBOQ(
  furniture: FurnitureItem[],
  doors: DoorItem[],
  windows: WindowItem[],
  walls: Wall[],
  rooms: Room[]
): BOQData {
  const grouped: Map<string, { catalogId: string; name: string; category: string; items: FurnitureItem[] }> = new Map();

  for (const item of furniture) {
    const key = item.catalogId || `${item.name}__${Math.round(item.width)}__${Math.round(item.height)}`;

    if (!grouped.has(key)) {
      const catalogEntry = furnitureCatalog.find((c) => c.id === item.catalogId);
      const category = catalogEntry?.category || "misc";
      grouped.set(key, { catalogId: item.catalogId, name: item.name, category, items: [] });
    }
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    grouped.get(key)!.items.push(item);
  }

  const categoryMap: Map<string, BOQCategory> = new Map();

  for (const [, group] of grouped) {
    const { catalogId, name, category, items } = group;
    const catalogEntry = furnitureCatalog.find((c) => c.id === catalogId);

    const widthMm = catalogEntry?.widthMm ?? Math.round(items[0].width * 10);
    const depthMm = catalogEntry?.depthMm ?? Math.round(items[0].height * 10);
    const heightMm = catalogEntry?.heightMm ?? 750;
    const sku = catalogEntry?.sku ?? "";
    const unitPriceInr = catalogEntry?.priceInr ?? 0;
    const quantity = items.length;

    const boqItem: BOQItem = {
      name,
      sku,
      category,
      quantity,
      widthMm,
      depthMm,
      heightMm,
      unitPriceInr,
      lineTotal: unitPriceInr * quantity,
      widthCm: Math.round(widthMm / 10),
      heightCm: Math.round(depthMm / 10),
      instances: items,
    };

    if (!categoryMap.has(category)) {
      categoryMap.set(category, { category, items: [], totalItems: 0, categoryTotal: 0 });
    }
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const cat = categoryMap.get(category)!;
    cat.items.push(boqItem);
    cat.totalItems += quantity;
    cat.categoryTotal += boqItem.lineTotal;
  }

  const categories = Array.from(categoryMap.values()).sort((a, b) =>
    a.category.localeCompare(b.category)
  );

  for (const cat of categories) {
    cat.items.sort((a, b) => a.name.localeCompare(b.name));
  }

  const grandTotal = categories.reduce((sum, cat) => sum + cat.categoryTotal, 0);

  return {
    categories,
    totalFurnitureItems: furniture.length,
    totalUniqueItems: grouped.size,
    grandTotal,
    doors: doors.length,
    windows: windows.length,
    walls: walls.length,
    rooms: rooms.length,
  };
}
