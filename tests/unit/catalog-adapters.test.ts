import { describe, expect, it } from "vitest";

import { isMissingTableError, normalizeProducts, toCompatProduct } from "@/lib/catalog/adapters";
import type { Product } from "@/lib/catalog/types";

function sampleProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "prod-1",
    category_id: "seating",
    series: "mesh",
    name: "Mesh Chair",
    slug: "mesh-chair",
    description: "Ergonomic mesh chair",
    images: ["/images/chair.jpg"],
    flagship_image: "/images/chair-flagship.jpg",
    "3d_model": "/models/chair.glb",
    specs: {
      dimensions: "600 x 600 mm",
      materials: ["Mesh", "Aluminium"],
      features: ["Lumbar support", "Adjustable arms"],
      sustainability_score: 8,
    },
    series_id: "seating-mesh",
    series_name: "Mesh",
    created_at: "2024-01-01",
    metadata: { ai_alt_text: "Mesh task chair" },
    ...overrides,
  };
}

describe("catalog adapters", () => {
  it("detects missing Supabase table errors", () => {
    expect(isMissingTableError("", "products")).toBe(false);
    expect(isMissingTableError("schema cache: public.products not found", "products")).toBe(true);
    expect(isMissingTableError("Could not find the table catalog_products", "catalog_products")).toBe(true);
    expect(isMissingTableError("relation products does not exist", "products")).toBe(true);
    expect(isMissingTableError("network timeout", "products")).toBe(false);
  });

  it("normalizes product asset paths", () => {
    const normalized = normalizeProducts([
      sampleProduct({
        images: ["/images/chair.jpg"],
        flagship_image: "/images/flagship.jpg",
        "3d_model": "/models/model.glb",
      }),
    ]);

    expect(normalized[0].images[0]).toBe("/images/chair.jpg");
    expect(normalized[0].flagship_image).toBe("/images/flagship.jpg");
    expect(normalized[0]["3d_model"]).toBe("/models/model.glb");
    expect(normalizeProducts(null as unknown as Product[])).toEqual([]);
  });

  it("maps products to compat shape with specs and alt text fallbacks", () => {
    const compat = toCompatProduct(sampleProduct());
    expect(compat.id).toBe("prod-1");
    expect(compat.detailedInfo.dimensions).toBe("600 x 600 mm");
    expect(compat.detailedInfo.materials).toEqual(["Mesh", "Aluminium"]);
    expect(compat.detailedInfo.features).toEqual(["Lumbar support", "Adjustable arms"]);
    expect(compat.metadata.sustainabilityScore).toBe(8);
    expect(compat.altText).toBe("Mesh task chair");
    expect(compat.threeDModelUrl).toBe("/models/chair.glb");

    const sparse = toCompatProduct(
      sampleProduct({
        description: undefined,
        alt_text: undefined,
        metadata: undefined,
        specs: { dimensions: "", materials: [], features: [] },
      }),
    );
    expect(sparse.description).toBe("");
    expect(sparse.altText).toBe("Mesh Chair product image");
    expect(sparse.detailedInfo.overview).toBe("");
  });

  it("handles non-object specs payloads", () => {
    const compat = toCompatProduct(
      sampleProduct({
        specs: ["invalid"] as unknown as Product["specs"],
      }),
    );
    expect(compat.detailedInfo.dimensions).toBe("");
    expect(compat.detailedInfo.materials).toEqual([]);
    expect(compat.detailedInfo.features).toEqual([]);
  });
});