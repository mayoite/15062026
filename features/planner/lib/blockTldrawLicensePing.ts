const INSTALL_FLAG = "__oandoTldrawUnlicensedMitigations__";

export function hasPlannerTldrawLicenseKey(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_TLDRAW_LICENSE_KEY?.trim());
}

export function isTldrawLicensePingUrl(url: string): boolean {
  try {
    const parsed = new URL(url, "https://localhost");
    return parsed.hostname === "cdn.tldraw.com";
  } catch {
    return url.includes("cdn.tldraw.com");
  }
}

function isTldrawLicenseConsoleNoise(args: unknown[]): boolean {
  const first = args[0];
  if (typeof first !== "string") return false;

  const text = first.replace(/%c/g, "").toLowerCase();
  if (text.includes("sales@tldraw.com")) return true;
  if (text.includes("tldraw") && text.includes("license")) return true;

  if (/^-{10,}$/.test(text.trim())) {
    const style = args[1];
    return typeof style === "string" && (style.includes("crimson") || style.includes("orange"));
  }

  return false;
}

export function installTldrawLicensePingBlock(): void {
  if (typeof window === "undefined" || hasPlannerTldrawLicenseKey()) return;

  const windowWithFlag = window as Window & { [INSTALL_FLAG]?: boolean };
  if (windowWithFlag[INSTALL_FLAG]) return;
  windowWithFlag[INSTALL_FLAG] = true;

  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;

    if (isTldrawLicensePingUrl(url)) {
      return Promise.resolve(new Response(null, { status: 204, statusText: "No Content" }));
    }

    return nativeFetch(input, init);
  };

  const nativeLog = console.log.bind(console);
  console.log = (...args: unknown[]) => {
    if (isTldrawLicenseConsoleNoise(args)) return;
    nativeLog(...args);
  };
}