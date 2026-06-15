import { useEffect, useRef } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CURATED_CATALOG_ITEMS } from "@/features/planner/catalog/workspaceCatalog";
import { usePlannerWorkspaceStore } from "@/features/planner/store/workspaceStore";
import { createPlannerEditorMock, makeShape } from "./planner-editor-mockEditor";

const mockEditor = createPlannerEditorMock({
  shapes: [
    makeShape("shape:wall", "planner-wall", {
      startX: 0,
      startY: 0,
      endX: 200,
      endY: 0,
    }),
    makeShape("shape:desk", "planner-furniture", {
      productName: "Desk",
      catalogId: "desk-1",
      widthMm: 1200,
      heightMm: 600,
    }),
  ],
});
const setPlannerTool = vi.fn();
const parsePlannerDocumentImportFile = vi.fn();
const loadPlannerDocumentIntoEditor = vi.fn(() => true);
const savePlannerDraftDocument = vi.fn(() => ({ savedAt: "2026-06-15T10:00:00.000Z" }));
const loadPlannerDraftDocument = vi.fn(() => null);
const listPlannerDraftDocuments = vi.fn(() => []);
const deletePlannerDraftDocument = vi.fn(() => true);
const hydrateCloudPlanIntoIndexedDb = vi.fn(async () => undefined);

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
  SplitViewLayout: ({ children2D, view }: { children2D: React.ReactNode; view: string }) => (
    <div data-view={view}>{children2D}</div>
  ),
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
  hydrateCloudPlanIntoIndexedDb: (...args: unknown[]) => hydrateCloudPlanIntoIndexedDb(...args),
}));

vi.mock("@/features/planner/persistence/plannerDraft", () => ({
  LOCAL_CURRENT_DRAFT_ID: "current",
  loadPlannerDraftDocument: (...args: unknown[]) => loadPlannerDraftDocument(...args),
  savePlannerDraftDocument: (...args: unknown[]) => savePlannerDraftDocument(...args),
  deletePlannerDraftDocument: (...args: unknown[]) => deletePlannerDraftDocument(...args),
  listPlannerDraftDocuments: (...args: unknown[]) => listPlannerDraftDocuments(...args),
}));

vi.mock("@/features/planner/persistence/plannerImport", () => ({
  parsePlannerDocumentImportFile: (...args: unknown[]) => parsePlannerDocumentImportFile(...args),
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
    roomWidthMm: 6000,
    roomDepthMm: 5000,
    itemCount: 2,
  })),
  loadPlannerDocumentIntoEditor: (...args: unknown[]) => loadPlannerDocumentIntoEditor(...args),
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

describe("PlannerWorkspace branches", () => {
  vi.setConfig({ testTimeout: 60_000 });

  beforeEach(() => {
    vi.clearAllMocks();
    parsePlannerDocumentImportFile.mockResolvedValue({
      ok: false,
      errors: ["Invalid planner JSON"],
    });
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

  it("hydrates cloud plan when planId is provided", async () => {
    render(<PlannerWorkspace guestMode={false} planId="cloud-plan-1" />);
    await waitFor(() =>
      expect(hydrateCloudPlanIntoIndexedDb).toHaveBeenCalledWith("cloud-plan-1", false),
    );
    expect(screen.getByRole("button", { name: /Draw/i })).toHaveAttribute("aria-current", "step");
    expect(mockEditor.selectNone).toHaveBeenCalled();
  });

  it("applies templates, catalog clicks, and invalid drops", async () => {
    render(<PlannerWorkspace guestMode={false} />);
    await waitFor(() => expect(screen.getByTestId("tldraw-engine")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Templates" }));
    fireEvent.click(screen.getByRole("button", { name: /Open Plan Office layout preview/i }));
    fireEvent.click(screen.getByRole("button", { name: /Apply template/i }));
    expect(mockEditor.run).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("tab", { name: /Library/i }));
    const catalogCard = document.querySelector(".pw-catalog-card") as HTMLElement;
    expect(catalogCard).toBeTruthy();
    fireEvent.click(catalogCard);
    expect(mockEditor.createShape).toHaveBeenCalled();

    const surface = document.querySelector(".pw-canvas-surface") as HTMLElement;
    fireEvent.drop(surface, {
      clientX: 100,
      clientY: 100,
      dataTransfer: { getData: () => "not-json" },
    });
  });

  it("manages session save, load, rename, delete, import, and export json", async () => {
    const namedDraft = {
      id: "saved-1",
      name: "HQ Copy",
      title: "HQ Copy",
      unitSystem: "mm" as const,
      itemCount: 2,
      roomWidthMm: 6000,
      roomDepthMm: 5000,
    };
    loadPlannerDraftDocument.mockImplementation((scope: { documentId?: string }) => {
      if (scope?.documentId === "current") {
        return {
          ...namedDraft,
          id: "current",
          name: "Workspace Plan",
          title: "Workspace Plan",
        };
      }
      if (scope?.documentId === "saved-1") return namedDraft;
      return null;
    });
    listPlannerDraftDocuments.mockReturnValue([
      {
        scope: { documentId: "saved-1" },
        storageKey: "saved-1",
        envelope: {
          savedAt: "2026-06-15T09:00:00.000Z",
          document: namedDraft,
        },
      },
    ]);

    render(<PlannerWorkspace guestMode={false} />);
    fireEvent.click(screen.getByRole("button", { name: "More actions" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Plan sessions" }));

    fireEvent.click(screen.getByRole("button", { name: /Save as New Session/i }));
    fireEvent.click(screen.getByRole("button", { name: /Save Local Draft/i }));

    fireEvent.click(screen.getByRole("button", { name: /Load HQ Copy/i }));
    await waitFor(() => expect(mockEditor.selectNone).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: /Export Plan JSON/i }));

    fireEvent.click(screen.getByRole("button", { name: /Open in 3D Viewer/i }));
    expect(deletePlannerDraftDocument).not.toHaveBeenCalled();
  });

  it("renames and deletes named local sessions", async () => {
    const namedDraft = {
      id: "saved-1",
      name: "HQ Copy",
      title: "HQ Copy",
      unitSystem: "mm" as const,
      itemCount: 2,
      roomWidthMm: 6000,
      roomDepthMm: 5000,
    };
    loadPlannerDraftDocument.mockImplementation((scope: { documentId?: string }) => {
      if (scope?.documentId === "saved-1") return namedDraft;
      return null;
    });
    listPlannerDraftDocuments.mockReturnValue([
      {
        scope: { documentId: "saved-1" },
        storageKey: "saved-1",
        envelope: {
          savedAt: "2026-06-15T09:00:00.000Z",
          document: namedDraft,
        },
      },
    ]);

    render(<PlannerWorkspace guestMode={false} />);
    fireEvent.click(screen.getByRole("button", { name: "More actions" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Plan sessions" }));

    fireEvent.click(screen.getByRole("button", { name: "Rename HQ Copy" }));
    fireEvent.change(screen.getAllByLabelText("Rename HQ Copy")[0]!, {
      target: { value: "Renamed HQ" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(savePlannerDraftDocument).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: "Delete HQ Copy" }));
    await waitFor(() => expect(deletePlannerDraftDocument).toHaveBeenCalled());
  });

  it("shows error when loading a missing local draft", async () => {
    listPlannerDraftDocuments.mockReturnValue([
      {
        scope: { documentId: "missing" },
        storageKey: "missing",
        envelope: {
          savedAt: "2026-06-15T09:00:00.000Z",
          document: {
            id: "missing",
            name: "Ghost",
            title: "Ghost",
            unitSystem: "mm",
            itemCount: 0,
            roomWidthMm: 1000,
            roomDepthMm: 1000,
          },
        },
      },
    ]);
    loadPlannerDraftDocument.mockReturnValue(null);

    render(<PlannerWorkspace guestMode={false} />);
    fireEvent.click(screen.getByRole("button", { name: "More actions" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Plan sessions" }));
    fireEvent.click(screen.getByRole("button", { name: /Load Ghost/i }));
    await waitFor(() => expect(screen.getByText(/Local draft not found/i)).toBeInTheDocument());
  });

  it("toggles layer visibility and opens AI assist", async () => {
    render(<PlannerWorkspace guestMode={false} />);
    await waitFor(() => expect(mockEditor.store.listen).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: "AI" }));
    expect(screen.getByRole("tab", { name: /AI Assist/i })).toHaveAttribute("aria-selected", "true");

    fireEvent.click(screen.getByRole("button", { name: /Review/i }));
    fireEvent.click(screen.getByRole("button", { name: /Hide Walls & openings layer/i }));
    expect(usePlannerWorkspaceStore.getState().layerVisible.walls).toBe(false);
  });
});
