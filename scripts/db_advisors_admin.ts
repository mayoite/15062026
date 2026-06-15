// Run advisor checks against the admin DB.
// Same lint definitions as scripts/db_advisors.ts but using SUPABASE_AUTH_DATABASE_URL.
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });
process.env.PRODUCTS_DATABASE_URL = process.env.SUPABASE_AUTH_DATABASE_URL;

import("./db_advisors").catch((e) => {
  console.error(e);
  process.exit(1);
});
