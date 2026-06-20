import { afterEach, describe, expect, it, vi } from "vitest";

import {
  MODEL_VIEWER_DRACO,
  MODEL_VIEWER_KTX2,
  MODEL_VIEWER_SCRIPT,
  resolveModelViewerDecoderUrls,
  resolveSelfHostedAssetDir,
  resolveSelfHostedAssetUrl,
} from "@/lib/ui/selfHostedAssetUrls";

describe("resolveSelfHostedAssetUrl", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns the local path when fetch succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true })),
    );

    await expect(
      resolveSelfHostedAssetUrl(MODEL_VIEWER_SCRIPT.local, MODEL_VIEWER_SCRIPT.cdn),
    ).resolves.toBe(MODEL_VIEWER_SCRIPT.local);
  });

  it("falls back to the CDN URL when the local asset is missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false })),
    );

    await expect(
      resolveSelfHostedAssetUrl(MODEL_VIEWER_SCRIPT.local, MODEL_VIEWER_SCRIPT.cdn),
    ).resolves.toBe(MODEL_VIEWER_SCRIPT.cdn);
  });
});

describe("resolveSelfHostedAssetDir", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns the local directory when the probe file is reachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true })),
    );

    await expect(
      resolveSelfHostedAssetDir(
        MODEL_VIEWER_DRACO.localProbe,
        MODEL_VIEWER_DRACO.localDir,
        MODEL_VIEWER_DRACO.cdnDir,
      ),
    ).resolves.toBe(MODEL_VIEWER_DRACO.localDir);
  });

  it("returns the CDN directory when the probe file is missing locally", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false })),
    );

    await expect(
      resolveSelfHostedAssetDir(
        MODEL_VIEWER_KTX2.localProbe,
        MODEL_VIEWER_KTX2.localDir,
        MODEL_VIEWER_KTX2.cdnDir,
      ),
    ).resolves.toBe(MODEL_VIEWER_KTX2.cdnDir);
  });
});

describe("resolveModelViewerDecoderUrls", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("resolves both decoder directories", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => ({
        ok: String(url).includes("/cdn/vendor/"),
      })),
    );

    await expect(resolveModelViewerDecoderUrls()).resolves.toEqual({
      dracoDir: MODEL_VIEWER_DRACO.localDir,
      ktx2Dir: MODEL_VIEWER_KTX2.localDir,
    });
  });
});