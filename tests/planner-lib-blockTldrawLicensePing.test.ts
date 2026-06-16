import { afterEach, describe, expect, it, vi } from "vitest";

import {
  installTldrawLicensePingBlock,
  isTldrawLicensePingUrl,
} from "@/features/planner/lib/blockTldrawLicensePing";

const ENV_KEY = "NEXT_PUBLIC_TLDRAW_LICENSE_KEY";

describe("isTldrawLicensePingUrl", () => {
  it("matches tldraw CDN URLs", () => {
    expect(
      isTldrawLicensePingUrl(
        "https://cdn.tldraw.com/3.15.0/watermarks/watermark-track.svg?license_type=unlicensed",
      ),
    ).toBe(true);
  });

  it("ignores self-hosted tldraw assets", () => {
    expect(isTldrawLicensePingUrl("/tldraw-assets/fonts/IBMPlexSans-Medium.woff2")).toBe(false);
  });
});

describe("installTldrawLicensePingBlock", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env[ENV_KEY];
    delete (window as Window & { __oandoTldrawUnlicensedMitigations__?: boolean })
      .__oandoTldrawUnlicensedMitigations__;
  });

  it("short-circuits cdn.tldraw.com fetches", async () => {
    const nativeFetch = vi.fn().mockResolvedValue(new Response("ok"));
    vi.stubGlobal("fetch", nativeFetch);

    installTldrawLicensePingBlock();

    const response = await fetch(
      "https://cdn.tldraw.com/3.15.0/watermarks/watermark-track.svg?license_type=unlicensed",
    );

    expect(response.status).toBe(204);
    expect(nativeFetch).not.toHaveBeenCalled();

    await fetch("/tldraw-assets/icons/icon/0_merged.svg");
    expect(nativeFetch).toHaveBeenCalledTimes(1);
  });

  it("skips mitigations when a license key is configured", async () => {
    process.env[ENV_KEY] = "tldraw-test-key";
    const nativeFetch = vi.fn().mockResolvedValue(new Response("ok"));
    vi.stubGlobal("fetch", nativeFetch);

    installTldrawLicensePingBlock();

    await fetch("https://cdn.tldraw.com/3.15.0/watermarks/watermark-track.svg");
    expect(nativeFetch).toHaveBeenCalledTimes(1);
  });

  it("suppresses tldraw license console noise", () => {
    const nativeLog = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn());

    installTldrawLicensePingBlock();

    console.log("%cNo tldraw license key provided!", "color: white; background: crimson;");
    console.log("planner ready");

    expect(nativeLog).toHaveBeenCalledTimes(1);
    expect(nativeLog.mock.calls[0]?.[0]).toBe("planner ready");
    nativeLog.mockRestore();
  });
});