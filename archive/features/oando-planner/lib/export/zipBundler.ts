import type { PlannerDocument } from "../documentBridge";
import { generateBOQCSVContent, generatePlanJSON } from "./zipBundlerFormatters";
import { downloadBlob, getDateString, slugify } from "./zipBundlerUtils";
import { buildZip, type ZipEntry } from "./zipBundlerArchive";

export { buildZip, type ZipEntry };

export async function exportClientDeliverable(
  plan: PlannerDocument,
  additionalEntries: ZipEntry[] = [],
): Promise<void> {
  const projectName = plan.metadata?.title || "Untitled Plan";
  const slug = slugify(projectName);
  const date = getDateString();

  const entries: ZipEntry[] = [
    ...additionalEntries,
    {
      name: `${slug}-boq.csv`,
      content: generateBOQCSVContent(projectName, plan),
      mimeType: "text/csv",
    },
  ];

  try {
    const zipBlob = await buildZip(entries);
    downloadBlob(zipBlob, `${slug}-client-${date}.zip`);
  } catch (error) {
    throw new Error(
      `Failed to create client deliverable ZIP: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function exportInternal(
  plan: PlannerDocument,
  additionalEntries: ZipEntry[] = [],
): Promise<void> {
  const projectName = plan.metadata?.title || "Untitled Plan";
  const slug = slugify(projectName);
  const date = getDateString();

  const entries: ZipEntry[] = [
    ...additionalEntries,
    {
      name: `${slug}-plan.json`,
      content: generatePlanJSON(plan),
      mimeType: "application/json",
    },
  ];

  try {
    const zipBlob = await buildZip(entries);
    downloadBlob(zipBlob, `${slug}-internal-${date}.zip`);
  } catch (error) {
    throw new Error(
      `Failed to create internal ZIP: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function exportBulkBOQ(
  plans: Array<{ plan: PlannerDocument; name: string }>,
): Promise<void> {
  const date = getDateString();

  const entries: ZipEntry[] = plans.map(({ plan, name }) => ({
    name: `${slugify(name)}-boq.csv`,
    content: generateBOQCSVContent(name, plan),
    mimeType: "text/csv",
  }));

  try {
    const zipBlob = await buildZip(entries);
    downloadBlob(zipBlob, `bulk-boq-export-${date}.zip`);
  } catch (error) {
    throw new Error(
      `Failed to create bulk BOQ ZIP: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
