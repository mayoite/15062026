"use client";

let plugLoaded = false;

export function initDevRevPlug() {
  if (plugLoaded || typeof window === "undefined") return;
  const appId = process.env.NEXT_PUBLIC_DEVREV_APP_ID;
  if (!appId) return;

  try {
    const script = document.createElement("script");
    script.src = "https://plug-platform.devrev.ai/static/plug.js";
    script.async = true;
    script.onload = () => {
      const win = window as unknown as Record<string, unknown>;
      if (typeof win.plugSDK === "object" && win.plugSDK !== null) {
        const sdk = win.plugSDK as { init: (opts: { app_id: string }) => void };
        sdk.init({ app_id: appId });
      }
    };
    document.head.appendChild(script);
    plugLoaded = true;
  } catch {
    console.warn("DevRev PLuG widget failed to load");
  }
}
