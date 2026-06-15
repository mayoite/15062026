import { useEffect, useRef } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CURATED_CATALOG_ITEMS } from "@/features/planner/catalog/workspaceCatalog";
import { usePlannerWorkspaceStore } from "@/features/planner/store/workspaceStore";
import { createPlannerEditorMock } from "./planner-editor-mockEditor";

const mockEditor = createPlannerEditorMock();
const setPlannerTool = vi.fn();

vi.mock("@/features/planner/shared/engine/SharedTldrawEngine", () => ({
  SharedTldrawEngine: ({ onMount }: { onMount: (editor: typeof mockEditor) => void }) => {
    const mounted = useRef(false);
    useEffect(() => {
      if (mounted.current) return;
      mounted.current = true;
      onMount(mockEditor);
    }, [onMount]);
    return <div data-testid="tldraw-engine" />;
  },
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/ui/Logo", () => ({
  OneAndOnlyLogo: () => <span data-testid="logo" />,
}));

vi.mock("@/features/planner/3d", () => ({
  Planner3DViewer: () => <div data-testid="planner-3d" />,
}));

vi.mock("@/features/planner/shared/components/SplitViewLayout", () => ({
  SplitViewLayout: ({ children2D }: { children2D: React.ReactNode }) => <div>{children2D}</div>,
}));

vi.mock("@/features/planner/hooks/usePlannerAutosave", () => ({
  usePlannerAutosave: () => ({
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

const savePlannerDraftDocument = vi.fn(() => ({ savedAt: "2026-06-15T10:00:00.000Z" }));
const loadPlannerDraftDocument = vi.fn(() => null);
const listPlannerDraftDocuments = vi.fn(() => []);

vi.mock("@/features/planner/persistence/plannerDraft", () => ({
  LOCAL_CURRENT_DRAFT_ID: "current",
  loadPlannerDraftDocument: (...args: unknown[]) => loadPlannerDraftDocument(...args),
  savePlannerDraftDocument: (...args: unknown[]) => savePlannerDraftDocument(...args),
  deletePlannerDraftDocument: vi.fn(() => true),
  listPlannerDraftDocuments: (...args: unknown[]) => listPlannerDraftDocuments(...args),
}));

vi.mock("@/features/planner/persistence/plannerImport", () => ({
  parsePlannerDocumentImportFile: vi.fn(async () => ({
    ok: false,
    errors: ["Invalid planner JSON"],
  })),
}));

vi.mock("@/features/planner/lib/compliance", () => ({
  runPlannerComplianceCheck: vi.fn(() => []),
}));

vi.mock("@/features/planner/lib/measurements", async () => {
  const actual = await vi.importActual<typeof import("@/features/planner/lib/measurements")>(
    "@/features/planner/lib/measurements",
  );
  return {
    ...actual,
    deriveViewportState: vi.fn(() => ({ canvasMeasurements: [] })),
  };
});

vi.mock("@/features/planner/lib/documentBridge", () => ({
  buildPlannerDocumentFromEditor: vi.fn(() => ({
    id: "doc-1",
    name: "Workspace Plan",
    title: "Workspace Plan",
    unitSystem: "mm",
    shapes: [],
  })),
  loadPlannerDocumentIntoEditor: vi.fn(() => true),
}));

vi.mock("@/features/planner/catalog/shapeTypeRegistry", async () => {
  const actual = await vi.importActual<typeof import("@/features/planner/catalog/shapeTypeRegistry")>(
    "@/features/planner/catalog/shapeTypeRegistry",
  );
  return {
    ...actual,
    acceptsCatalogDrag: vi.fn(() => true),
    readCatalogDragPayload: vi.fn(() => JSON.stringify(CURATED_CATALOG_ITEMS[0])),
  };
});

import { PlannerWorkspace } from "@/features/planner/editor/PlannerWorkspace";

describe("PlannerWorkspace", () => {
  // Heavy RTL shell; allow headroom under parallel full-suite runs.
  vi.setConfig({ testTimeout: 60_000 });

  beforeEach(() => {
    vi.clearAllMocks();
    usePlannerWorkspaceStore.setState({
      plannerStep: "catalog",
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

  it("mounts workspace shell and handles tool keyboard shortcuts", async () => {
    render(<PlannerWorkspace guestMode />);
    expect(screen.getByTestId("tldraw-engine")).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Plan metrics" })).toBeInTheDocument();

    await waitFor(() => expect(screen.getByTestId("tldraw-engine")).toBeInTheDocument());
    fireEvent.keyDown(document.body, { key: "w" });
    await waitFor(() => expect(setPlannerTool).toHaveBeenCalledWith("wall"), { timeout: 5000 });
    expect(mockEditor.setCurrentTool).toHaveBeenCalledWith("planner-wall");
  });

  it("opens templates and export modals from top bar", async () => {
    render(<PlannerWorkspace guestMode />);
    fireEvent.click(screen.getByRole("button", { name: "Templates" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });

    fireEvent.click(screen.getByRole("button", { name: "Export" }));
    expect(screen.getByRole("dialog", { name: "Export your plan" })).toBeInTheDocument();
  });

  it("handles catalog drop on canvas", async () => {
    render(<PlannerWorkspace guestMode />);
    const surface = document.querySelector(".pw-canvas-surface") as HTMLElement;
    const item = CURATED_CATALOG_ITEMS[0]!;

    fireEvent.dragOver(surface, {
      dataTransfer: { dropEffect: "copy" },
    });
    fireEvent.drop(surface, {
      clientX: 200,
      clientY: 200,
      dataTransfer: {
        getData: () => JSON.stringify(item),
      },
    });

    await waitFor(() => expect(mockEditor.createShape).toHaveBeenCalled());
  });

  it("opens blueprint panel from left tab and toggles view with ctrl-tab", async () => {
    render(<PlannerWorkspace guestMode />);
    fireEvent.click(screen.getByRole("tab", { name: /Blueprint/i }));
    expect(screen.getByText(/Sign in to import a floor plan image/i)).toBeInTheDocument();

    fireEvent.keyDown(document.body, { key: "Tab", ctrlKey: true });
    fireEvent.keyDown(document.body, { key: "Tab", ctrlKey: true });
    fireEvent.keyDown(document.body, { key: "Tab", ctrlKey: true });
  });

  it("switches planner steps and tool rail selections", async () => {
    render(<PlannerWorkspace guestMode />);
    await waitFor(() => expect(mockEditor.store.listen).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: "Review" }));
    fireEvent.click(screen.getByRole("button", { name: "Space" }));

    fireEvent.click(screen.getByRole("button", { name: "Wall" }));
    expect(setPlannerTool).toHaveBeenCalledWith("wall");
  });

  it("opens session dialog and saves local draft", async () => {
    loadPlannerDraftDocument.mockReturnValueOnce({
      id: "current",
      name: "Workspace Plan",
      title: "Workspace Plan",
      unitSystem: "mm",
      itemCount: 0,
      roomWidthMm: 6000,
      roomDepthMm: 5000,
      updatedAt: "2026-06-15T10:00:00.000Z",
    });
    listPlannerDraftDocuments.mockReturnValueOnce([
      {
        scope: { documentId: "saved-1" },
        storageKey: "saved-1",
        envelope: {
          savedAt: "2026-06-15T09:00:00.000Z",
          document: {
            id: "saved-1",
            name: "HQ Copy",
            title: "HQ Copy",
            unitSystem: "mm",
            itemCount: 2,
            roomWidthMm: 6000,
            roomDepthMm: 5000,
          },
        },
      },
    ]);

    render(<PlannerWorkspace guestMode={false} />);
    fireEvent.click(screen.getByRole("button", { name: "More actions" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Plan sessions" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Save Local Draft/i }));
    await waitFor(() => expect(savePlannerDraftDocument).toHaveBeenCalled(), {
      timeout: 15_000,
    });
  });

  it("clears drag ghost on canvas drag leave", async () => {
    render(<PlannerWorkspace guestMode />);
    const surface = document.querySelector(".pw-canvas-surface") as HTMLElement;
    fireEvent.dragOver(surface, { dataTransfer: { dropEffect: "copy" } });
    fireEvent.dragLeave(surface, { relatedTarget: document.body });
  });
});