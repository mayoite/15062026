export type ExportLayout = {
  projectName: string;
  clientName?: string;
  preparedBy?: string;
  roomWidthMm: number;
  roomDepthMm: number;
  unitSystem: "metric" | "imperial";
  generatedAt: string;
};

export type ExportFormat = "pdf" | "csv" | "json";
