import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CURATED_CATALOG_ITEMS } from "@/features/planner/catalog/workspaceCatalog";
import { usePlannerWorkspaceStore } from "@/features/planner/store/workspaceStore";
import { resetFabricRuntimeState } from "./planner-fabric-mockRuntime";

const setPlannerTool = vi.fn();
const insertObject = vi.fn();
const exportDraft = vi.fn(() => JSON.stringify({ objects: [] }));

vi.mock("@/features/planner/canvas-fabric/FabricCanvasSubToolbar", () => ({
  FabricCanvasSubToolbar: () => null,
}));

vi.mock("@/features/planner/canvas-fabric", async () => {
  const actual = await vi.importActual<Record<string, unknown>>(
    "@/features/planner/canvas-fabric",
  );
  return {
    ...actual,
    FabricCanvasWorkspace: () => <div data-testid="fabric-canvas" />,
    RoomPresetsOnOpen: () => null,
    useFloorplan: () => ({
      editRoom: vi.fn(),
      endEditRoom: vi.fn(),
      exportDraft,
      exportSvg: vi.fn(() => null),
      exportPngBlob: vi.fn(async () => null),
      importDraft: vi.fn(async () => undefined),
      insertObject,
      setLayerVisibility: vi.fn(),
      redoStates: [],
      roomEditRedoStates: [],
      roomEditStates: [],
      selections: [],
      states: ["{}"],
      gridEnabled: true,
      toggleGrid: vi.fn(),
      refitCanvas: vi.fn(),
    }),
    FloorplanProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("@/components/ui/Logo", () => ({
  OneAndOnlyLogo: () => <span data-testid="logo" />,
}));

vi.mock("@/features/planner/viewer/PlannerViewer", () => ({
  PlannerViewer: () => <div data-testid="planner-3d" />,
}));

vi.mock("@/features/planner/shared/components/SplitViewLayout", () => ({
  SplitViewLayout: ({ children2D }: { children2D: React.ReactNode }) => <div>{children2D}</div>,
}));

vi.mock("@/features/planner/hooks/usePlannerFabricAutosave", () => ({
  usePlannerFabricAutosave: () => ({
    status: "saved",
    lastSavedAt: null,
    restoreSnapshot: vi.fn(async () => undefined),
    retrySave: vi.fn(),
  }),
}));

vi.mock("@/features/planner/components/WorkspaceThemeProvider", () => ({
  useTheme: () => ({ resolvedTheme: "light" }),
}));

vi.mock("@/features/planner/store/plannerStore", () => ({
  usePlannerStore: (selector: (state: { setTool: typeof setPlannerTool }) => unknown) =>
    selector({ setTool: setPlannerTool }),
}));

vi.mock("@/features/planner/persistence/cloudPlanHydration", () => ({
  hydrateCloudPlanIntoIndexedDb: vi.fn(async () => undefined),
}));

vi.mock("@/features/planner/persistence/plannerDraft", () => ({
  LOCAL_CURRENT_DRAFT_ID: "current",
  loadPlannerDraftDocument: vi.fn(() => null),
  savePlannerDraftDocument: vi.fn(() => ({ savedAt: "2026-06-15T10:00:00.000Z" })),
  deletePlannerDraftDocument: vi.fn(() => true),
  listPlannerDraftDocuments: vi.fn(() => []),
}));

vi.mock("@/features/planner/persistence/plannerImport", () => ({
  parsePlannerDocumentImportFile: vi.fn(async () => ({ ok: false, errors: ["Invalid planner JSON"] })),
}));

vi.mock("@/features/planner/lib/compliance", () => ({
  runPlannerComplianceCheck: vi.fn(() => []),
}));

vi.mock("@/features/planner/catalog/shapeTypeRegistry", async () => {
  const actual = await vi.importActual("@/features/planner/catalog/shapeTypeRegistry");
  return {
    ...actual,
    acceptsCatalogDrag: vi.fn(() => true),
    readCatalogDragPayload: vi.fn(() => JSON.stringify(CURATED_CATALOG_ITEMS[0])),
  };
});

import { PlannerWorkspace } from "@/features/planner/editor/PlannerWorkspace";

describe("PlannerWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetFabricRuntimeState();
    usePlannerWorkspaceStore.setState({
      plannerStep: "draw",
      layerVisible: {
        underlay: true,
        walls: true,
        rooms: true,
        zones: true,
        furniture: true,
        measurements: true,
      },
      blueprint: {
        ...usePlannerWorkspaceStore.getState().blueprint,
        dataUrl: null,
        calibrating: false,
        interactionMode: "idle",
      },
    });
  });

  afterEach(() => {
    resetFabricRuntimeState();
  });

  it("mounts the Fabric workspace shell and handles tool keyboard shortcuts", async () => {
    render(<PlannerWorkspace guestMode />);
    expect(screen.getByTestId("fabric-canvas")).toBeInTheDocument();

    fireEvent.keyDown(document.body, { key: "w" });
    await waitFor(() => expect(setPlannerTool).toHaveBeenCalledWith("wall"));
  });

  it("opens templates and export modals from the top bar", () => {
    render(<PlannerWorkspace guestMode />);
    fireEvent.click(screen.getByRole("button", { name: "Templates" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Export" }));
    expect(screen.getByRole("dialog", { name: "Export your plan" })).toBeInTheDocument();
  });

  it("handles catalog drop on the canvas surface", async () => {
    render(<PlannerWorkspace guestMode />);
    const surface = document.querySelector(".pw-canvas-surface") as HTMLElement;
    const item = CURATED_CATALOG_ITEMS[0]!;

    fireEvent.drop(surface, {
      clientX: 200,
      clientY: 200,
      dataTransfer: {
        getData: () => JSON.stringify(item),
      },
    });

    await waitFor(() => expect(insertObject).toHaveBeenCalled());
  });

  it("shows blank canvas guidance and starter actions on an empty canvas", () => {
    render(<PlannerWorkspace guestMode />);

    expect(screen.getByRole("region", { name: "Empty canvas guidance" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Draw walls" }));
    expect(setPlannerTool).toHaveBeenCalledWith("wall");

    fireEvent.click(screen.getByRole("button", { name: "Use template" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
