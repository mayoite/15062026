import type { CatalogItem } from "@/features/planner/shared/catalog/types";
import type { MeshFamily } from "@/features/planner/shared/mesh-contract";
import type { PlacedItem, RoomConfig } from "@/features/oando-planner/r3f/usePlannerR3FStore";

type GuestSeed = {
  room: RoomConfig;
  items: Array<Omit<PlacedItem, "id">>;
};

const FALLBACK_MESH: MeshFamily = "desk-rect";

export function buildPlannerGuestSeed(catalog: CatalogItem[]): GuestSeed {
  const room: RoomConfig = {
    widthMm: 9000,
    depthMm: 7000,
    wallHeightMm: 3000,
  };

  const seededCatalog = catalog.filter((item) => item.meshType).slice(0, 4);
  const slots: Array<[number, number]> = [
    [2.2, 2.2],
    [4.5, 2.2],
    [6.8, 2.2],
    [4.5, 4.8],
  ];

  const items = seededCatalog.map((item, index) => {
    const [x, z] = slots[index] ?? [2 + index * 1.2, 2 + index * 0.8];
    return {
      catalogId: item.id,
      name: item.name,
      category: item.category,
      meshType: item.meshType ?? FALLBACK_MESH,
      widthMm: item.dimensions.widthMm,
      depthMm: item.dimensions.depthMm,
      heightMm: item.dimensions.heightMm,
      position: [x, item.dimensions.heightMm / 2000, z] as [number, number, number],
      rotation: index === 3 ? Math.PI / 2 : 0,
      color: item.color,
    };
  });

  return { room, items };
}
