import LZString from "lz-string";
import type {
  DoorItem,
  FurnitureItem,
  MeasurementItem,
  Room,
  Wall,
  WindowItem,
} from "../data/plannerStore";

export interface SharedProjectData {
  projectName: string;
  walls: Wall[];
  rooms: Room[];
  furniture: FurnitureItem[];
  doors: DoorItem[];
  windows: WindowItem[];
  measurements: MeasurementItem[];
  v: number;
}

export function encodeProjectToURL(data: SharedProjectData): string {
  const json = JSON.stringify(data);
  const compressed = LZString.compressToEncodedURIComponent(json);
  const baseURL = window.location.origin + "/oando-planner/shared";
  return `${baseURL}#share=${compressed}`;
}

export function decodeProjectFromHash(hash: string): SharedProjectData | null {
  try {
    const match = hash.match(/[#&]share=([^&]+)/);
    if (!match) return null;
    const json = LZString.decompressFromEncodedURIComponent(match[1]);
    if (!json) return null;
    const data = JSON.parse(json);
    if (!data || typeof data !== "object") return null;
    return data as SharedProjectData;
  } catch {
    return null;
  }
}

export function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
  }
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return Promise.resolve(ok);
  } catch {
    return Promise.resolve(false);
  }
}
