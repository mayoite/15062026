import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PlannerTopBar } from "@/features/planner/editor/PlannerTopBar";
import { createPlannerEditorMock } from "./planner-editor-mockEditor";

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

vi.mock("@/features/planner/components/WorkspaceThemeProvider", () => ({
  useTheme: () => ({ resolvedTheme: "light" }),
}));

vi.mock("@/features/planner/components/PlannerThemeToggle", () => ({
  PlannerThemeToggle: () => <button type="button">Theme</button>,
}));

vi.mock("@/features/planner/ui/PlannerSaveIndicator", () => ({
  PlannerSaveIndicator: () => <span>Saved</span>,
}));

describe("PlannerTopBar", () => {
  const baseProps = {
    guestMode: false,
    planName: "HQ Layout",
    viewMode: "2d" as const,
    onViewModeChange: vi.fn(),
    saveStatus: "saved" as const,
    lastSavedAt: "2026-06-15T10:00:00.000Z",
    onRetrySave: vi.fn(),
    onOpenSession: vi.fn(),
    onOpenTemplates: vi.fn(),
    onOpenAi: vi.fn(),
    onOpenExport: vi.fn(),
    editor: createPlannerEditorMock(),
  };

  it("renders brand, view toggle, and actions", () => {
    render(<PlannerTopBar {...baseProps} />);
    expect(screen.getByText("HQ Layout")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "3D" }));
    expect(baseProps.onViewModeChange).toHaveBeenCalledWith("3d");
    fireEvent.click(screen.getByRole("button", { name: "Export" }));
    expect(baseProps.onOpenExport).toHaveBeenCalled();
  });

  it("opens overflow menu actions", () => {
    render(<PlannerTopBar {...baseProps} guestMode />);
    fireEvent.click(screen.getByRole("button", { name: "More actions" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Templates" }));
    expect(baseProps.onOpenTemplates).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "More actions" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "AI advisor" }));
    expect(baseProps.onOpenAi).toHaveBeenCalled();
  });

  it("opens sessions, split view, and closes menu on outside click", () => {
    const onOpenSession = vi.fn();
    const onViewModeChange = vi.fn();
    render(
      <PlannerTopBar
        {...baseProps}
        onOpenSession={onOpenSession}
        onViewModeChange={onViewModeChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "More actions" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Plan sessions" }));
    expect(onOpenSession).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Split" }));
    expect(onViewModeChange).toHaveBeenCalledWith("split");

    fireEvent.click(screen.getByRole("button", { name: "More actions" }));
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("menuitem", { name: "Plan sessions" })).not.toBeInTheDocument();
  });

  it("shows fallback title and hides export when editor is null", () => {
    render(<PlannerTopBar {...baseProps} planName="   " editor={null} />);
    expect(screen.getByText("Workspace Planner")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Export" })).not.toBeInTheDocument();
  });
});