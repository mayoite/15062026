"use client";

import { installTldrawLicensePingBlock } from "@/features/planner/lib/blockTldrawLicensePing";
import { Tldraw, type TldrawProps } from "tldraw";

installTldrawLicensePingBlock();

import { getAssetUrls } from "@tldraw/assets/selfHosted";

// We will host Tldraw assets ourselves to avoid third-party CDNs
const localAssetUrls = getAssetUrls({ baseUrl: "/tldraw-assets/" });

// Client component: only NEXT_PUBLIC_* is inlined by Next at build time.
const tldrawLicenseKey = process.env.NEXT_PUBLIC_TLDRAW_LICENSE_KEY?.trim() || undefined;

export type SharedTldrawEngineProps = Omit<TldrawProps, "assetUrls">;

export function SharedTldrawEngine(props: SharedTldrawEngineProps) {
  return (
    <div className="h-full w-full relative">
      <Tldraw
        assetUrls={localAssetUrls}
        licenseKey={tldrawLicenseKey}
        hideUi
        components={{ Toolbar: null, NavigationPanel: null }}
        {...props}
      />
    </div>
  );
}
