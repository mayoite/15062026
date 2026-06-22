import fs from "node:fs";
import path from "node:path";

import AdminInventoryPageView from "@/features/planner/admin/AdminInventoryPageView";

const INVENTORY_PATH = path.join(process.cwd(), "results", "app-pages-inventory.csv");

export default function AdminInventoryPage() {
  let csv = "";
  let generatedAt: string | null = null;
  let rowCount = 0;

  if (fs.existsSync(INVENTORY_PATH)) {
    csv = fs.readFileSync(INVENTORY_PATH, "utf8");
    generatedAt = fs.statSync(INVENTORY_PATH).mtime.toISOString();
    rowCount = Math.max(0, csv.split(/\r?\n/).filter(Boolean).length - 1);
  }

  return <AdminInventoryPageView csv={csv} generatedAt={generatedAt} rowCount={rowCount} />;
}
