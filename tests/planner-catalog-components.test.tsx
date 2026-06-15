import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as catalogBlockBridge from "@/features/planner/tldraw/shapes/shapeUtils/catalogBlockBridge";
import { CatalogBlockPreview } from "@/features/planner/catalog/CatalogBlockPreview";
import { CatalogDropGhost } from "@/features/planner/catalog/CatalogDropGhost";
import { CatalogPanel } from "@/features/planner/catalog/CatalogPanel";
import { RoomPresetsPanel } from "@/features/planner/catalog/RoomPresetsPanel";
import { usePlannerCatalogStore } from "@/features/planner/catalog/catalogStore";
import type { CatalogItem } from "@/features/planner/catalog/catalogTypes";
import { PLANNER_CATALOG_ITEMS } from "@/features/planner/catalog/workspaceCatalog";
import { ROOM_PRESETS } from "@/features/planner/catalog/roomPresets";
import { CATALOG_DRAG_MIME } from "@/features/planner/catalog/shapeTypeRegistry";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const roomItem =
  PLANNER_CATALOG_ITEMS.find((item) => item.id === "room-meeting-8") ??
  PLANNER_CATALOG_ITEMS[0];

const fallbackItem: CatalogItem = {
  id: "fallback-preview",
  name: "Fallback preview item",
  category: "infrastructure",
  shapeType: "unknown-shape-type",
  widthMm: 20,
  heightMm: 10,
  depthMm: 10,
  description: "No block preview",
  tags: ["fallback"],
};

describe("planner/catalog components", () => {
  beforeEach(() => {
    localStorage.clear();
    usePlannerCatalogStore.setState({ query: "", purposeFilter: null, recentIds: [] });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("renders catalog block previews for known and fallback items", () => {
    const known = render(<CatalogBlockPreview item={roomItem} />);
    expect(known.container.querySelector("svg")).toBeTruthy();

    vi.spyOn(catalogBlockBridge, "resolveCatalogItemBlock2D").mockReturnValueOnce(null);
    const fallback = render(<CatalogBlockPreview item={fallbackItem} />);
    expect(fallback.container.querySelector(".rounded-sm.border")).toBeTruthy();
    vi.restoreAllMocks();

    const wideItem: CatalogItem = { ...roomItem, widthMm: 600, heightMm: 80 };
    const tallItem: CatalogItem = { ...roomItem, id: "tall-preview", widthMm: 80, heightMm: 600 };
    expect(render(<CatalogBlockPreview item={wideItem} />).container.querySelector("svg")).toBeTruthy();
    expect(render(<CatalogBlockPreview item={tallItem} />).container.querySelector("svg")).toBeTruthy();
  });

  it("renders drop ghost with scaled preview", () => {
    const { container } = render(
      <CatalogDropGhost item={roomItem} x={120} y={80} width={72} height={48} valid />,
    );
    const ghost = container.querySelector(".pw-drop-ghost") as HTMLElement;
    expect(ghost).toBeTruthy();
    expect(ghost.style.left).toBe("120px");
    expect(ghost.style.top).toBe("80px");
    expect(ghost.dataset.valid).toBe("true");
    expect(within(container).getByText(roomItem.shortName ?? roomItem.name)).toBeTruthy();
  });

  it("renders room presets and forwards apply callbacks", () => {
    const onApply = vi.fn();
    render(<RoomPresetsPanel unitSystem="mm" onApply={onApply} />);

    fireEvent.click(screen.getAllByRole("button", { name: new RegExp(ROOM_PRESETS[0].name) })[0]);
    expect(onApply).toHaveBeenCalledWith(ROOM_PRESETS[0]);
  });

  it(
    "renders catalog panel search, tabs, and item actions",
    () => {
      const onItemClick = vi.fn();
      render(<CatalogPanel embedded onItemClick={onItemClick} />);

      expect(screen.getByRole("searchbox", { name: "Search catalog elements" })).toBeTruthy();
      expect(screen.getByText(/Oando symbols/)).toBeTruthy();

      fireEvent.change(screen.getByRole("searchbox"), { target: { value: "meeting" } });
      expect(screen.getAllByText(/Meeting/i).length).toBeGreaterThan(0);

      fireEvent.change(screen.getByRole("searchbox"), { target: { value: "" } });
      fireEvent.click(screen.getByRole("tab", { name: "Meeting" }));
      fireEvent.click(screen.getByRole("tab", { name: "All" }));

      const addButtons = screen.getAllByRole("button", { name: /Add .+ to canvas/i });
      fireEvent.click(addButtons[0]);
      expect(onItemClick).toHaveBeenCalled();
      expect(usePlannerCatalogStore.getState().recentIds.length).toBeGreaterThan(0);
    },
    15000,
  );

  it("starts catalog drag with serialized payload", () => {
    render(<CatalogPanel />);
    const draggable = document.querySelector("[draggable='true']") as HTMLElement;
    expect(draggable).toBeTruthy();

    const setData = vi.fn();
    const setDragImage = vi.fn();
    fireEvent.dragStart(draggable, {
      dataTransfer: {
        effectAllowed: "",
        types: [],
        setData,
        setDragImage,
        getData: () => "",
      },
    });

    expect(setData).toHaveBeenCalledWith(CATALOG_DRAG_MIME, expect.stringContaining('"id"'));
  });

  it("renders embedded catalog panel without standalone title", () => {
    render(<CatalogPanel embedded />);
    expect(screen.queryByRole("heading", { name: "Element library" })).toBeNull();
    expect(screen.getByRole("searchbox")).toBeTruthy();
  });

  it("shows empty state when no items match the active filters", () => {
    usePlannerCatalogStore.setState({
      items: [],
      query: "",
    });
    render(<CatalogPanel embedded />);
    expect(screen.getByText("No items in this category yet.")).toBeTruthy();
  });

  it("shows search empty state when no results match", () => {
    render(<CatalogPanel embedded />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "zzzz-no-match-xyz" } });
    expect(screen.getByText(/No elements found/)).toBeTruthy();
  });

  it("shows catalog thumb image fallback after load error", () => {
    const imageItem: CatalogItem = {
      ...roomItem,
      id: "image-card-item",
      name: "Image Card Item",
      imageUrl: "https://example.com/catalog.png",
      purposeTab: "meeting",
      subCategory: "medium",
    };
    usePlannerCatalogStore.setState({
      items: [imageItem],
      query: "",
    });

    render(<CatalogPanel embedded />);
    fireEvent.click(screen.getByRole("tab", { name: "Meeting" }));
    const image = document.querySelector(".pw-catalog-card-thumb-img") as HTMLImageElement;
    expect(image).toBeTruthy();
    fireEvent.error(image);
    expect(document.querySelector(".pw-catalog-card-thumb-fallback")).toBeTruthy();
  });
});