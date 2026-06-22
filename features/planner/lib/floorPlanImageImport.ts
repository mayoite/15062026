const ACCEPTED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_BYTES = 15 * 1024 * 1024;

export type FloorPlanImagePayload = {
  dataUrl: string;
  width: number;
  height: number;
  fileName: string;
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Could not read the image file."));
    };
    reader.onerror = () => reject(new Error("Could not read the image file."));
    reader.readAsDataURL(file);
  });
}

function loadImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error("The uploaded image could not be decoded."));
    image.src = dataUrl;
  });
}

/** Read a hand sketch or existing floor plan image for canvas underlay. */
export async function readFloorPlanImageFile(file: File): Promise<FloorPlanImagePayload> {
  if (!ACCEPTED_MIME_TYPES.has(file.type)) {
    throw new Error("Upload a JPG, PNG, WebP, or GIF sketch or floor plan.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image must be under 15 MB.");
  }

  const dataUrl = await readFileAsDataUrl(file);
  const { width, height } = await loadImageDimensions(dataUrl);

  if (width < 32 || height < 32) {
    throw new Error("Image is too small to use as a floor plan reference.");
  }

  return { dataUrl, width, height, fileName: file.name };
}
