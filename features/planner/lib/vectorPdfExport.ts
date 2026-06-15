import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export interface PlannerPdfPage {
  svgContent: string;
}

export interface CreatePlannerPdfOptions {
  title: string;
  pages: PlannerPdfPage[];
  logoPath?: string;
}

/**
 * Creates a multi-page PDF document using pdf-lib.
 * Each page embeds SVG content as a PNG image (pdf-lib does not natively
 * support SVG embedding, so we rasterise via a canvas for now).
 */
export async function createPlannerPdf(
  options: CreatePlannerPdfOptions,
): Promise<Uint8Array> {
  const { title, pages, logoPath } = options;
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(title);
  pdfDoc.setCreator("Oando Planner");

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let logoImage: Awaited<ReturnType<typeof pdfDoc.embedPng>> | null = null;
  if (logoPath && typeof window !== "undefined") {
    try {
      logoImage = await embedLogoImage(pdfDoc, logoPath);
    } catch {
      // Logo is optional — continue without it
    }
  }

  for (let i = 0; i < pages.length; i++) {
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();

    // Header with title
    page.drawText(title, {
      x: 50,
      y: height - 50,
      size: 16,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });

    // Page number
    page.drawText(`Page ${i + 1} of ${pages.length}`, {
      x: 50,
      y: 30,
      size: 9,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Logo top-right
    if (logoImage && i === 0) {
      const logoDims = logoImage.scale(0.3);
      page.drawImage(logoImage, {
        x: width - logoDims.width - 40,
        y: height - logoDims.height - 30,
        width: logoDims.width,
        height: logoDims.height,
      });
    }

    // Render SVG content to PNG via canvas and embed
    const svgContent = pages[i].svgContent;
    if (svgContent && typeof window !== "undefined") {
      try {
        const pngBytes = await svgToPngBytes(svgContent, width - 100, height - 120);
        const img = await pdfDoc.embedPng(pngBytes);
        const dims = img.scaleToFit(width - 100, height - 120);
        page.drawImage(img, {
          x: 50,
          y: 60,
          width: dims.width,
          height: dims.height,
        });
      } catch {
        // If SVG rendering fails, leave the page with just the header
        page.drawText("[SVG rendering failed]", {
          x: 50,
          y: height - 80,
          size: 10,
          font,
          color: rgb(0.6, 0.2, 0.2),
        });
      }
    }
  }

  return pdfDoc.save();
}

async function embedLogoImage(
  pdfDoc: PDFDocument,
  logoPath: string,
): Promise<Awaited<ReturnType<typeof pdfDoc.embedPng>>> {
  const response = await fetch(logoPath);
  if (!response.ok) {
    throw new Error(`Logo fetch failed: ${response.status}`);
  }

  const logoBytes = await response.arrayBuffer();
  const lower = logoPath.toLowerCase();

  if (lower.endsWith(".png")) {
    return pdfDoc.embedPng(logoBytes);
  }

  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
    return pdfDoc.embedJpg(logoBytes);
  }

  const pngBytes = await rasterImageBytesToPng(logoBytes, logoPath);
  return pdfDoc.embedPng(pngBytes);
}

async function rasterImageBytesToPng(bytes: ArrayBuffer, sourcePath: string): Promise<Uint8Array> {
  const blob = new Blob([bytes], {
    type: sourcePath.toLowerCase().endsWith(".webp") ? "image/webp" : "image/*",
  });
  const url = URL.createObjectURL(blob);

  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Logo image decode failed"));
      image.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth || 1;
    canvas.height = image.naturalHeight || 1;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not get 2d context");
    context.drawImage(image, 0, 0);

    const dataUrl = canvas.toDataURL("image/png");
    const base64 = dataUrl.split(",")[1] ?? "";
    const binary = atob(base64);
    const pngBytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      pngBytes[i] = binary.charCodeAt(i);
    }
    return pngBytes;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Helper: converts an SVG string to PNG bytes via an offscreen canvas.
 */
async function svgToPngBytes(
  svgContent: string,
  maxWidth: number,
  maxHeight: number,
): Promise<Uint8Array> {
  const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });

  // Scale to fit within bounds
  let w = img.naturalWidth || maxWidth;
  let h = img.naturalHeight || maxHeight;
  const scaleX = maxWidth / w;
  const scaleY = maxHeight / h;
  const scale = Math.min(scaleX, scaleY, 1);
  w = Math.floor(w * scale);
  h = Math.floor(h * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2d context");
  ctx.drawImage(img, 0, 0, w, h);
  URL.revokeObjectURL(url);

  const dataUrl = canvas.toDataURL("image/png");
  const base64 = dataUrl.split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
