import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BufferGeometry, Matrix4, Mesh, MeshBasicMaterial } from "three";
import type { GLTF } from "three-stdlib";

import type { CatalogItem } from "@/features/planner/shared/catalog/types";

const { useLoader, preload } = vi.hoisted(() => ({
  useLoader: vi.fn(),
  preload: vi.fn(),
}));

vi.mock("@react-three/fiber", () => ({
  useLoader: (...args: unknown[]) => useLoader(...args),
}));

vi.mock("@react-three/drei", () => ({
  useGLTF: { preload },
}));

import { useAssetLoader } from "@/features/planner/hooks/useAssetLoader";

vi.mock("three/examples/jsm/loaders/GLTFLoader.js", () => ({
  GLTFLoader: class GLTFLoader {},
}));

function createCatalogItem(overrides: Partial<CatalogItem> = {}): CatalogItem {
  return {
    id: "desk-1",
    name: "Desk",
    category: "Workstations",
    dimensions: { widthMm: 1600, depthMm: 800, heightMm: 750 },
    modelUrl: "https://cdn.example.com/desk.glb",
    thumbnail: "https://cdn.example.com/desk.png",
    color: "#336699",
    ...overrides,
  };
}

function createGltfWithMesh(name = "mesh-a"): GLTF {
  const geometry = new BufferGeometry();
  const material = new MeshBasicMaterial();
  const mesh = new Mesh(geometry, material);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = false;
  mesh.updateMatrixWorld = vi.fn();

  return {
    scene: {
      updateMatrixWorld: vi.fn(),
      matrixWorld: new Matrix4(),
      traverse: (visitor: (node: unknown) => void) => {
        visitor(mesh);
      },
    },
  } as unknown as GLTF;
}

describe("useAssetLoader", () => {
  it("uses provided catalog items without loading and preloads unique model urls", () => {
    const sharedModel = "https://cdn.example.com/shared.glb";
    const catalogItems = [
      createCatalogItem({ id: "desk-1", modelUrl: sharedModel }),
      createCatalogItem({ id: "desk-2", modelUrl: sharedModel }),
      createCatalogItem({ id: "chair-1", modelUrl: "https://cdn.example.com/chair.glb", thumbnail: undefined, imageUrl: "https://cdn.example.com/chair.jpg" }),
      createCatalogItem({ id: "", modelUrl: "https://cdn.example.com/ignored.glb" }),
    ];

    useLoader.mockReturnValue([createGltfWithMesh(), createGltfWithMesh("mesh-b")]);

    const { result } = renderHook(() =>
      useAssetLoader({
        catalogIds: ["desk-1", "desk-2", "desk-1", "missing-id", "", "chair-1"],
        catalogItems,
      }),
    );

    expect(result.current.isLoadingCatalog).toBe(false);
    expect(result.current.missingCatalogIds).toEqual(["missing-id"]);
    expect(result.current.catalogById.get("desk-1")).toMatchObject({
      catalogId: "desk-1",
      modelUrl: sharedModel,
      svgUrl: "https://cdn.example.com/desk.png",
      tint: "#336699",
      dimensionsMm: { width: 1600, depth: 800, height: 750 },
    });
    expect(result.current.catalogById.get("chair-1")?.svgUrl).toBe("https://cdn.example.com/chair.jpg");
    expect(preload).toHaveBeenCalledTimes(2);
    expect(result.current.assetsByCatalogId.get("desk-1")?.primitives).toHaveLength(1);
    expect(result.current.assetsByCatalogId.get("chair-1")?.primitives[0]?.key).toBe("mesh-b-0");
  });

  it("loads catalog asynchronously and reports loading state", async () => {
    let resolveCatalog: (items: CatalogItem[]) => void = () => undefined;
    const loadCatalog = vi.fn(
      () =>
        new Promise<CatalogItem[]>((resolve) => {
          resolveCatalog = resolve;
        }),
    );

    useLoader.mockReturnValue([]);

    const { result } = renderHook(
      ({ ids }: { ids: readonly string[] }) =>
        useAssetLoader({
          catalogIds: ids,
          loadCatalog,
        }),
      { initialProps: { ids: ["desk-1"] as readonly string[] } },
    );

    expect(result.current.isLoadingCatalog).toBe(true);
    expect(loadCatalog).toHaveBeenCalledTimes(1);

    resolveCatalog([createCatalogItem()]);
    await waitFor(() => expect(result.current.isLoadingCatalog).toBe(false));

    expect(result.current.catalogById.get("desk-1")?.catalogId).toBe("desk-1");
    expect(result.current.missingCatalogIds).toEqual([]);
  });

  it("falls back to an empty catalog when loading fails", async () => {
    const loadCatalog = vi.fn(async () => {
      throw new Error("network");
    });

    useLoader.mockReturnValue([]);

    const { result } = renderHook(() =>
      useAssetLoader({
        catalogIds: ["desk-1"],
        loadCatalog,
      }),
    );

    await waitFor(() => expect(result.current.isLoadingCatalog).toBe(false));

    expect(result.current.catalogById.size).toBe(0);
    expect(result.current.missingCatalogIds).toEqual(["desk-1"]);
  });

  it("skips assets without model urls and ignores mesh nodes without materials", () => {
    const geometry = new BufferGeometry();
    const meshWithoutMaterial = new Mesh(geometry, new MeshBasicMaterial());
    meshWithoutMaterial.material = null as never;
    meshWithoutMaterial.updateMatrixWorld = vi.fn();

    const gltf = {
      scene: {
        updateMatrixWorld: vi.fn(),
        matrixWorld: new Matrix4(),
        traverse: (visitor: (node: unknown) => void) => {
          visitor(meshWithoutMaterial);
          visitor({ not: "a mesh" });
        },
      },
    } as unknown as GLTF;

    useLoader.mockReturnValue([gltf]);

    const catalogItems = [
      createCatalogItem({ id: "desk-1", modelUrl: "https://cdn.example.com/desk.glb" }),
      createCatalogItem({ id: "note-1", modelUrl: null }),
    ];

    const { result } = renderHook(() =>
      useAssetLoader({
        catalogIds: ["desk-1", "note-1"],
        catalogItems,
      }),
    );

    expect(result.current.assetsByCatalogId.get("desk-1")?.primitives).toEqual([]);
    expect(result.current.assetsByCatalogId.has("note-1")).toBe(false);
  });

  it("maps image-only catalog metadata and array materials from gltf meshes", () => {
    const geometry = new BufferGeometry();
    const materialA = new MeshBasicMaterial();
    const materialB = new MeshBasicMaterial();
    const namedMesh = new Mesh(geometry, [materialA, materialB]);
    namedMesh.updateMatrixWorld = vi.fn();
    const unnamedMesh = new Mesh(geometry, materialB);
    unnamedMesh.name = "";
    unnamedMesh.updateMatrixWorld = vi.fn();

    const gltf = {
      scene: {
        updateMatrixWorld: vi.fn(),
        matrixWorld: new Matrix4(),
        traverse: (visitor: (node: unknown) => void) => {
          visitor(namedMesh);
          visitor(unnamedMesh);
        },
      },
    } as unknown as GLTF;

    useLoader.mockReturnValue([gltf]);

    const catalogItems = [
      createCatalogItem({
        id: "image-only",
        thumbnail: undefined,
        imageUrl: "https://cdn.example.com/image-only.png",
        color: undefined,
        modelUrl: "https://cdn.example.com/image-only.glb",
      }),
    ];

    const { result } = renderHook(() =>
      useAssetLoader({
        catalogIds: ["image-only"],
        catalogItems,
      }),
    );

    expect(result.current.catalogById.get("image-only")).toMatchObject({
      svgUrl: "https://cdn.example.com/image-only.png",
      tint: null,
    });
    expect(result.current.assetsByCatalogId.get("image-only")?.primitives[0]?.key).toBe("mesh-0");
    expect(result.current.assetsByCatalogId.get("image-only")?.primitives[1]?.key).toBe("mesh-1");
  });

  it("falls back to imageUrl when thumbnail is absent", () => {
    useLoader.mockReturnValue([]);
    const catalogItems = [
      createCatalogItem({
        id: "image-only-fallback",
        thumbnail: undefined,
        imageUrl: "https://cdn.example.com/fallback.png",
        color: undefined,
      }),
    ];

    const { result } = renderHook(() =>
      useAssetLoader({
        catalogIds: ["image-only-fallback"],
        catalogItems,
      }),
    );

    expect(result.current.catalogById.get("image-only-fallback")).toMatchObject({
      svgUrl: "https://cdn.example.com/fallback.png",
      tint: null,
    });
  });

  it("uses thumbnail before image url when both are present", () => {
    useLoader.mockReturnValue([]);
    const catalogItems = [
      createCatalogItem({
        id: "thumb-first",
        thumbnail: "https://cdn.example.com/thumb.png",
        imageUrl: "https://cdn.example.com/full.png",
      }),
    ];

    const { result } = renderHook(() =>
      useAssetLoader({
        catalogIds: ["thumb-first"],
        catalogItems,
      }),
    );

    expect(result.current.catalogById.get("thumb-first")?.svgUrl).toBe("https://cdn.example.com/thumb.png");
  });

  it("leaves svgUrl null when neither thumbnail nor imageUrl exist", () => {
    useLoader.mockReturnValue([]);
    const catalogItems = [
      createCatalogItem({
        id: "no-art",
        thumbnail: undefined,
        imageUrl: undefined,
        color: undefined,
      }),
    ];

    const { result } = renderHook(() =>
      useAssetLoader({
        catalogIds: ["no-art"],
        catalogItems,
      }),
    );

    expect(result.current.catalogById.get("no-art")).toMatchObject({
      svgUrl: null,
      tint: null,
    });
  });

  it("ignores rejected catalog loads after unmount", async () => {
    const loadCatalog = vi.fn(
      () =>
        new Promise<CatalogItem[]>((_, reject) => {
          setTimeout(() => reject(new Error("network")), 0);
        }),
    );

    useLoader.mockReturnValue([]);

    const { unmount } = renderHook(() =>
      useAssetLoader({
        catalogIds: ["desk-1"],
        loadCatalog,
      }),
    );

    unmount();
    await new Promise((resolve) => setTimeout(resolve, 10));
  });

  it("cancels stale catalog loads on unmount", async () => {
    let resolveCatalog: (items: CatalogItem[]) => void = () => undefined;
    const loadCatalog = vi.fn(
      () =>
        new Promise<CatalogItem[]>((resolve) => {
          resolveCatalog = resolve;
        }),
    );

    useLoader.mockReturnValue([]);

    const { unmount } = renderHook(() =>
      useAssetLoader({
        catalogIds: ["desk-1"],
        loadCatalog,
      }),
    );

    unmount();
    resolveCatalog([createCatalogItem({ id: "desk-1", name: "Late Desk" })]);
  });
});
