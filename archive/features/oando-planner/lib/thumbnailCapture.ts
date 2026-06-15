import type { Editor } from "tldraw";

/**
 * Options for thumbnail capture.
 */
export interface ThumbnailOptions {
  /** Target width in pixels (default: 400) */
  width?: number;
  /** Target height in pixels (default: 300) */
  height?: number;
  /** Timeout in milliseconds (default: 5000) */
  timeoutMs?: number;
}

const DEFAULT_WIDTH = 400;
const DEFAULT_HEIGHT = 300;
const DEFAULT_TIMEOUT_MS = 5000;

/**
 * Captures a thumbnail of the current canvas state as a PNG data URL.
 *
 * Uses tldraw's exportAs API to capture the canvas, then resizes to the
 * target dimensions (400x300 by default) while preserving aspect ratio.
 *
 * @param editor - The tldraw Editor instance
 * @param options - Optional configuration for width, height, and timeout
 * @returns A base64 data URL of the thumbnail, or null on failure/timeout/empty canvas
 *
 * @example
 * ```ts
 * const editor = getTldrawEditor();
 * if (editor) {
 *   const thumbnail = await captureThumbnail(editor);
 *   if (thumbnail) {
 *     localStorage.setItem(`planner.thumbnails.${projectId}`, thumbnail);
 *   }
 * }
 * ```
 *
 * **Validates: Requirements 12.1, 12.2, 12.6**
 */
export async function captureThumbnail(
  editor: Editor,
  options?: ThumbnailOptions
): Promise<string | null> {
  const targetWidth = options?.width ?? DEFAULT_WIDTH;
  const targetHeight = options?.height ?? DEFAULT_HEIGHT;
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  // Get all shape IDs on the current page
  const shapes = editor.getCurrentPageShapes();
  if (shapes.length === 0) {
    // Empty canvas - return null
    return null;
  }

  const ids = shapes.map((sh) => sh.id);

  // Get the bounds of all shapes to calculate the appropriate scale
  const bounds = editor.getSelectionPageBounds() ?? editor.getCurrentPageBounds();
  if (!bounds || bounds.width === 0 || bounds.height === 0) {
    return null;
  }

  // Calculate scale to fit within target dimensions while preserving aspect ratio
  const scaleX = targetWidth / bounds.width;
  const scaleY = targetHeight / bounds.height;
  const scale = Math.min(scaleX, scaleY);

  // Create a promise that races between the export and a timeout
  const exportPromise = (async (): Promise<string | null> => {
    try {
      // Create a temporary blob URL to capture the export
      // We need to intercept the download and convert to data URL
      const blob = await exportToBlob(editor, ids, scale);
      if (!blob) {
        return null;
      }

      // Convert blob to data URL
      const dataUrl = await blobToDataUrl(blob);

      // Resize to exact target dimensions with padding if needed
      const resizedDataUrl = await resizeToTarget(dataUrl, targetWidth, targetHeight);

      return resizedDataUrl;
    } catch (error) {
      console.warn("Thumbnail capture failed:", error);
      return null;
    }
  })();

  const timeoutPromise = new Promise<null>((resolve) => {
    setTimeout(() => resolve(null), timeoutMs);
  });

  return Promise.race([exportPromise, timeoutPromise]);
}

/**
 * Export shapes to a PNG blob using tldraw's export functionality.
 * This uses the getSvgElement and canvas rendering approach for more control.
 */
async function exportToBlob(
  editor: Editor,
  ids: readonly ReturnType<Editor["getCurrentPageShapes"]>[number]["id"][],
  scale: number
): Promise<Blob | null> {
  try {
    // Use tldraw's getSvgElement to get an SVG of the shapes
    // Convert readonly array to mutable array for tldraw API compatibility
    const svgResult = await editor.getSvgElement([...ids], {
      scale,
      background: true,
      padding: 16,
    });

    if (!svgResult?.svg) {
      return null;
    }

    const svg = svgResult.svg;

    // Convert SVG to PNG via canvas
    const svgString = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);

    return new Promise<Blob | null>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = svg.width.baseVal.value || 400;
        canvas.height = svg.height.baseVal.value || 300;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(svgUrl);
          resolve(null);
          return;
        }

        // White background
        ctx.fillStyle = "var(--surface-panel)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw the SVG
        ctx.drawImage(img, 0, 0);

        URL.revokeObjectURL(svgUrl);

        canvas.toBlob(
          (blob) => {
            resolve(blob);
          },
          "image/png",
          0.9
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(svgUrl);
        resolve(null);
      };

      img.src = svgUrl;
    });
  } catch (error) {
    console.warn("Failed to export shapes to blob:", error);
    return null;
  }
}

/**
 * Convert a Blob to a data URL.
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert blob to data URL"));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * Resize an image to exact target dimensions, centering and padding if needed.
 * This ensures all thumbnails have consistent dimensions.
 */
async function resizeToTarget(
  dataUrl: string,
  targetWidth: number,
  targetHeight: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      // Fill with white background
      ctx.fillStyle = "var(--surface-panel)";
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // Calculate scaling to fit within target while preserving aspect ratio
      const imgAspect = img.width / img.height;
      const targetAspect = targetWidth / targetHeight;

      let drawWidth: number;
      let drawHeight: number;
      let offsetX: number;
      let offsetY: number;

      if (imgAspect > targetAspect) {
        // Image is wider than target - fit to width
        drawWidth = targetWidth;
        drawHeight = targetWidth / imgAspect;
        offsetX = 0;
        offsetY = (targetHeight - drawHeight) / 2;
      } else {
        // Image is taller than target - fit to height
        drawHeight = targetHeight;
        drawWidth = targetHeight * imgAspect;
        offsetX = (targetWidth - drawWidth) / 2;
        offsetY = 0;
      }

      // Draw the image centered
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

      resolve(canvas.toDataURL("image/png", 0.9));
    };

    img.onerror = () => reject(new Error("Failed to load image for resizing"));
    img.src = dataUrl;
  });
}

/**
 * Storage key helper for thumbnail localStorage entries.
 */
export function getThumbnailStorageKey(projectId: string): string {
  return `planner.thumbnails.${projectId}`;
}

/**
 * Retrieve a stored thumbnail for a project.
 * @param projectId - The project's unique identifier
 * @returns The thumbnail data URL, or null if not found
 */
export function getStoredThumbnail(projectId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(getThumbnailStorageKey(projectId));
  } catch {
    return null;
  }
}

/**
 * Store a thumbnail for a project.
 * @param projectId - The project's unique identifier
 * @param dataUrl - The thumbnail data URL
 */
export function storeThumbnail(projectId: string, dataUrl: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getThumbnailStorageKey(projectId), dataUrl);
  } catch (error) {
    // localStorage quota exceeded or other error - non-fatal
    console.warn("Failed to store thumbnail:", error);
  }
}

/**
 * Remove a stored thumbnail for a project.
 * @param projectId - The project's unique identifier
 */
export function removeThumbnail(projectId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(getThumbnailStorageKey(projectId));
  } catch {
    // Ignore errors on removal
  }
}
