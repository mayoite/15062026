import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load environment variables from the repo root.
dotenv.config({ path: ".env.local" });

export default defineConfig({
  schema: "platform/drizzle/schema.ts",
  out: "platform/drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    url: process.env.DATABASE_URL!,
  },
});
