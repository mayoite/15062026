import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  buildTemplatePreview,
  TemplatePickerModal,
} from "@/features/planner/editor/templates/TemplatePickerModal";
import { LAYOUT_TEMPLATES } from "@/features/planner/templates/layoutTemplates";

describe("buildTemplatePreview", () => {
  it("builds preview rects from template shapes", () => {
    const template = LAYOUT_TEMPLATES[0]!;
    const preview = buildTemplatePreview(template);
    expect(preview.viewBoxHeight).toBeGreaterThan(0);
    expect(preview.rects[0]?.kind).toBe("room");
    expect(preview.rects.length).toBeGreaterThan(1);
  });
});

describe("TemplatePickerModal", () => {
  it("renders templates and applies selection", () => {
    const onApply = vi.fn();
    const onClose = vi.fn();
    render(<TemplatePickerModal isOpen onClose={onClose} onApply={onApply} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Open Plan Office layout preview/i }));
    fireEvent.click(screen.getByRole("button", { name: /Apply template/i }));
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ id: "open-plan-24" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("closes on escape and backdrop", () => {
    const onClose = vi.fn();
    render(<TemplatePickerModal isOpen onClose={onClose} onApply={vi.fn()} />);
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("returns null when closed and ignores apply without selection", () => {
    const onApply = vi.fn();
    const { container, rerender } = render(
      <TemplatePickerModal isOpen={false} onClose={vi.fn()} onApply={onApply} />,
    );
    expect(container.firstChild).toBeNull();

    rerender(<TemplatePickerModal isOpen onClose={vi.fn()} onApply={onApply} />);
    fireEvent.click(screen.getByRole("button", { name: /Apply template/i }));
    expect(onApply).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: "Tab" });
  });
});