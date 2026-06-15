export function clampBlueprintPdfPage(page: number, pageCount: number) {
  if (!Number.isFinite(pageCount) || pageCount <= 0) return 1;
  if (!Number.isFinite(page)) return 1;
  return Math.min(pageCount, Math.max(1, Math.round(page)));
}
