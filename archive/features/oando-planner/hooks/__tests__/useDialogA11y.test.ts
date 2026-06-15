import { renderHook } from "@testing-library/react";
import { useDialogA11y } from "../useDialogA11y";
import { fireEvent } from "@testing-library/react";

describe("useDialogA11y", () => {
  it("returns a ref", () => {
    const onClose = jest.fn();
    const { result } = renderHook(() => useDialogA11y(true, onClose));
    expect(result.current).toHaveProperty("current");
  });

  it("calls onClose when Escape is pressed while open", () => {
    const onClose = jest.fn();
    renderHook(() => useDialogA11y(true, onClose));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose when closed", () => {
    const onClose = jest.fn();
    renderHook(() => useDialogA11y(false, onClose));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("cleans up on unmount", () => {
    const onClose = jest.fn();
    const { unmount } = renderHook(() => useDialogA11y(true, onClose));
    unmount();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });
});
