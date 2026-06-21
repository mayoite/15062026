export const BLUEPRINT_MAX_BYTES = 20 * 1024 * 1024;

export type BlueprintImportKind = "image" | "pdf" | "unsupported";

const IMAGE_MIME_PREFIX = "image/";
const PDF_MIME_TYPE = "application/pdf";

export function getBlueprintImportKind(file: Pick<File, "type">): BlueprintImportKind {
  if (file.type.startsWith(IMAGE_MIME_PREFIX)) {
    return "image";
  }

  if (file.type === PDF_MIME_TYPE) {
    return "pdf";
  }

  return "unsupported";
}

export function validateBlueprintImportFile(
  file: Pick<File, "type" | "size"> | null | undefined,
) {
  if (!file) {
    return { ok: false as const, reason: "missing" as const };
  }

  if (file.size > BLUEPRINT_MAX_BYTES) {
    return { ok: false as const, reason: "too-large" as const };
  }

  const kind = getBlueprintImportKind(file);
  if (kind === "unsupported") {
    return { ok: false as const, reason: "unsupported" as const };
  }

  return { ok: true as const, kind };
}
