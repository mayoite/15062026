import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CURATED_CATALOG_ITEMS } from "@/features/planner/catalog/workspaceCatalog";
import { usePlannerWorkspaceStore } from "@/features/planner/store/workspaceStore";
import { usePlannerStore } from "@/features/planner/store/plannerStore";
import { usePlannerCatalogStore } from "@/features/planner/catalog/catalogStore";
import { resetFabricRuntimeState } from "./planner-fabric-mockRuntime";

vi.mock("fabric", () => ({
  Canvas: class MockCanvas {
    on() {}
    off() {}
    dispose() {}
    add() {}
    remove() {}
    setDimensions() {}
    requestRenderAll() {}
    getObjects() { return []; }
    clear() {}
    calcOffset() {}
  }
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("@/components/ui/Logo", () => ({
  OneAndOnlyLogo: () => <span data-testid="logo" />,
}));

import { PlannerWorkspace } from "@/features/planner/editor/PlannerWorkspace";

describe("PlannerWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetFabricRuntimeState();
    usePlannerWorkspaceStore.setState({
      plannerStep: "draw",
      layerVisible: {
        walls: true,
        rooms: true,
        zones: true,
        furniture: true,
        measurements: true,
      },
    });
    usePlannerStore.setState({ activeTool: "select" });
    usePlannerCatalogStore.setState({ recentPlacements: [] });
  });

  it("mounts the Fabric workspace shell and handles tool keyboard shortcuts", async () => {
    render(<PlannerWorkspace guestMode />);
    
    // Wait for the canvas region to be rendered
    const canvasWrap = await screen.findByRole("application");
    expect(canvasWrap).toBeInTheDocument();

    fireEvent.keyDown(document.body, { key: "w" });
    await waitFor(() => {
      expect(usePlannerStore.getState().activeTool).toBe("wall");
    });
  });

  it("opens templates and export modals from the top bar", async () => {
    render(<PlannerWorkspace guestMode />);
    fireEvent.click(screen.getByRole("button", { name: "Templates" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const exportBtn = await screen.findByRole("button", { name: "Export" });
    fireEvent.click(exportBtn);
    expect(screen.getByRole("dialog", { name: "Export your plan" })).toBeInTheDocument();
  });

  it("handles catalog drop on the canvas surface", async () => {
    render(<PlannerWorkspace guestMode />);
    const surface = await waitFor(() => document.querySelector(".canvas-wrap") as HTMLElement);
    const item = CURATED_CATALOG_ITEMS[0]!;

    fireEvent.drop(surface, {
      clientX: 200,
      clientY: 200,
      dataTransfer: {
        types: ["application/planner-catalog-item"],
        getData: (mime: string) => mime === "application/planner-catalog-item" ? JSON.stringify(item) : "",
      },
    });

    await waitFor(() => {
      expect(usePlannerCatalogStore.getState().recentPlacements).toContain(item.id);
    });
  });

  it("shows blank canvas guidance and starter actions on an empty canvas", async () => {
    render(<PlannerWorkspace guestMode />);

    const region = await screen.findByRole("region", { name: "Empty canvas guidance" });
    expect(region).toBeInTheDocument();
    
    fireEvent.click(screen.getByRole("button", { name: "Draw walls" }));
    expect(usePlannerStore.getState().activeTool).toBe("wall");

    fireEvent.click(screen.getByRole("button", { name: "Use template" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
