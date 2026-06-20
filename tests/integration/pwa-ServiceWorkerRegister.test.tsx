import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";

describe("ServiceWorkerRegister", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  let registerMock: ReturnType<typeof vi.fn>;
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    registerMock = vi.fn().mockResolvedValue(undefined);
    // Stub navigator.serviceWorker for happy-dom (which lacks it by default).
    vi.stubGlobal("navigator", {
      ...navigator,
      serviceWorker: { register: registerMock },
    });
    addEventListenerSpy = vi.spyOn(window, "addEventListener");
    removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("does not register when NODE_ENV is not production", () => {
    process.env.NODE_ENV = "development";
    const { unmount } = render(<ServiceWorkerRegister />);
    // The guard returns before binding the load listener in non-production.
    expect(registerMock).not.toHaveBeenCalled();
    expect(addEventListenerSpy).not.toHaveBeenCalledWith("load", expect.any(Function));
    unmount();
    expect(removeEventListenerSpy).not.toHaveBeenCalledWith("load", expect.any(Function));
  });

  it("registers the service worker on window load when in production", () => {
    process.env.NODE_ENV = "production";
    render(<ServiceWorkerRegister />);
    // The load listener is registered; fire it manually.
    const loadHandler = addEventListenerSpy.mock.calls.find(
      ([event]) => event === "load",
    )?.[1] as ((...args: unknown[]) => void) | undefined;
    expect(loadHandler).toBeTypeOf("function");
    loadHandler?.();
    expect(registerMock).toHaveBeenCalledWith("/sw.js");
  });

  it("logs a warning when registration fails", () => {
    process.env.NODE_ENV = "production";
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    registerMock.mockRejectedValueOnce(new Error("sw down"));
    render(<ServiceWorkerRegister />);
    const loadHandler = addEventListenerSpy.mock.calls.find(
      ([event]) => event === "load",
    )?.[1] as ((...args: unknown[]) => void) | undefined;
    loadHandler?.();
    // The register call returns a rejected promise; let it settle.
    return Promise.resolve().then(() => {
      expect(warnSpy).toHaveBeenCalledWith(
        "[sw] registration failed:",
        expect.any(Error),
      );
    });
  });

  it("renders nothing", () => {
    const { container } = render(<ServiceWorkerRegister />);
    expect(container.firstChild).toBeNull();
  });

  it("does not register when navigator.serviceWorker is unavailable", () => {
    process.env.NODE_ENV = "production";
    vi.stubGlobal("navigator", { ...navigator });
    expect(() => render(<ServiceWorkerRegister />)).not.toThrow();
    // addEventListener for load still happens; firing it must not throw.
    const loadHandler = addEventListenerSpy.mock.calls.find(
      ([event]) => event === "load",
    )?.[1] as ((...args: unknown[]) => void) | undefined;
    expect(() => loadHandler?.()).not.toThrow();
  });
});
