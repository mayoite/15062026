"use client";

import {
  hasPlannerTldrawLicenseKey,
  installTldrawLicensePingBlock,
} from "@/features/planner/lib/blockTldrawLicensePing";

installTldrawLicensePingBlock();

export function TldrawNetworkGuard({ children }: { children: React.ReactNode }) {
  const unlicensed = !hasPlannerTldrawLicenseKey();

  return (
    <div className={unlicensed ? "planner-tldraw-unlicensed" : undefined}>{children}</div>
  );
}