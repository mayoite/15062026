/**
 * Branded 2D Output Style Presets (Plan 04, P1)
 *
 * Three Oando export presets that control how 2D plan exports are styled:
 * proposal, technical, and client-presentation.
 */

export type PaperSize = "A4" | "A3" | "A4-landscape";

export type ColorScheme = "color" | "monochrome";

export type ExportPreset = {
  name: string;
  showDimensions: boolean;
  showLabels: boolean;
  showLogo: boolean;
  colorScheme: ColorScheme;
  logoPath: string;
  paperSize: PaperSize;
  font?: string;
};

export const EXPORT_PRESETS = {
  proposal: {
    name: "Oando Proposal",
    showDimensions: false,
    showLabels: true,
    showLogo: true,
    colorScheme: "color",
    logoPath: "/logo-v2.webp",
    paperSize: "A4",
  },
  technical: {
    name: "Technical Drawing",
    showDimensions: true,
    showLabels: true,
    showLogo: false,
    colorScheme: "monochrome",
    logoPath: "/logo-v2.webp",
    paperSize: "A3",
    font: "monospace",
  },
  "client-presentation": {
    name: "Client Presentation",
    showDimensions: false,
    showLabels: false,
    showLogo: true,
    colorScheme: "color",
    logoPath: "/logo-v2.webp",
    paperSize: "A4-landscape",
  },
} as const satisfies Record<string, ExportPreset>;

export type ExportPresetId = keyof typeof EXPORT_PRESETS;

export function getExportPreset(id: ExportPresetId): ExportPreset {
  return EXPORT_PRESETS[id];
}
