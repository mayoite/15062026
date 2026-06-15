import { Project } from "ts-morph";

async function main() {
  const project = new Project({
    tsConfigFilePath: "tsconfig.json",
  });

  const moves = [
    // Platform
    { from: 'lib/db.ts', to: 'platform/drizzle/db.ts' },
    { from: 'lib/schema.ts', to: 'platform/drizzle/schema.ts' },
    { from: 'lib/supabaseAdmin.ts', to: 'platform/supabase/admin.ts' },
    { from: 'lib/supabaseSafe.ts', to: 'platform/supabase/safe.ts' },
    { from: 'lib/supabaseAuthAdmin.ts', to: 'platform/supabase/auth-admin.ts' },
    { from: 'lib/appwrite.ts', to: 'platform/appwrite/client.ts' },

    // Catalog Features
    { from: 'lib/catalogCategories.ts', to: 'features/catalog/categories.ts' },
    { from: 'lib/catalogImageMetadata.ts', to: 'features/catalog/imageMetadata.ts' },
    { from: 'lib/catalogSlug.ts', to: 'features/catalog/slugResolver.ts' },
    { from: 'lib/getProducts.ts', to: 'features/catalog/getProducts.ts' },
    { from: 'lib/productSpecSchema.ts', to: 'features/catalog/specSchema.ts' },
    { from: 'lib/productTraits.ts', to: 'features/catalog/traits.ts' },
    { from: 'lib/productFilters.ts', to: 'features/catalog/filters.ts' },

    // CRM / AI Features
    { from: 'lib/businessStats.ts', to: 'features/crm/businessStats.ts' },
    { from: 'lib/contactSurfaces.ts', to: 'features/crm/contactSurfaces.ts' },
    { from: 'lib/aiAdvisor.ts', to: 'features/ai/aiAdvisor.ts' },
  ];

  for (const move of moves) {
    const sourceFile = project.getSourceFile(move.from);
    if (sourceFile) {
      console.log(`Moving ${move.from} to ${move.to}`);
      sourceFile.move(move.to);
    } else {
      console.warn(`[WARN] Source file not found: ${move.from}`);
    }
  }

  console.log("Saving project changes...");
  await project.save();
  console.log("All moves saved successfully!");
}

main().catch(console.error);
