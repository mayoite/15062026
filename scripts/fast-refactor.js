const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();

const moves = [
  // Platform
  { from: 'lib/db.ts', to: 'platform/drizzle/db.ts', oldImport: '@/lib/db', newImport: '@/platform/drizzle/db' },
  { from: 'lib/schema.ts', to: 'platform/drizzle/schema.ts', oldImport: '@/lib/schema', newImport: '@/platform/drizzle/schema' },
  { from: 'lib/supabaseAdmin.ts', to: 'platform/supabase/admin.ts', oldImport: '@/lib/supabaseAdmin', newImport: '@/platform/supabase/admin' },
  { from: 'lib/supabaseSafe.ts', to: 'platform/supabase/safe.ts', oldImport: '@/lib/supabaseSafe', newImport: '@/platform/supabase/safe' },
  { from: 'lib/supabaseAuthAdmin.ts', to: 'platform/supabase/auth-admin.ts', oldImport: '@/lib/supabaseAuthAdmin', newImport: '@/platform/supabase/auth-admin' },
  { from: 'lib/appwrite.ts', to: 'platform/appwrite/client.ts', oldImport: '@/lib/appwrite', newImport: '@/platform/appwrite/client' },

  // Catalog
  { from: 'lib/catalogCategories.ts', to: 'features/catalog/categories.ts', oldImport: '@/lib/catalogCategories', newImport: '@/features/catalog/categories' },
  { from: 'lib/catalogImageMetadata.ts', to: 'features/catalog/imageMetadata.ts', oldImport: '@/lib/catalogImageMetadata', newImport: '@/features/catalog/imageMetadata' },
  { from: 'lib/catalogSlug.ts', to: 'features/catalog/slugResolver.ts', oldImport: '@/lib/catalogSlug', newImport: '@/features/catalog/slugResolver' },
  { from: 'lib/getProducts.ts', to: 'features/catalog/getProducts.ts', oldImport: '@/lib/getProducts', newImport: '@/features/catalog/getProducts' },
  { from: 'lib/productSpecSchema.ts', to: 'features/catalog/specSchema.ts', oldImport: '@/lib/productSpecSchema', newImport: '@/features/catalog/specSchema' },
  { from: 'lib/productTraits.ts', to: 'features/catalog/traits.ts', oldImport: '@/lib/productTraits', newImport: '@/features/catalog/traits' },
  { from: 'lib/productFilters.ts', to: 'features/catalog/filters.ts', oldImport: '@/lib/productFilters', newImport: '@/features/catalog/filters' },

  // CRM & AI
  { from: 'lib/businessStats.ts', to: 'features/crm/businessStats.ts', oldImport: '@/lib/businessStats', newImport: '@/features/crm/businessStats' },
  { from: 'lib/contactSurfaces.ts', to: 'features/crm/contactSurfaces.ts', oldImport: '@/lib/contactSurfaces', newImport: '@/features/crm/contactSurfaces' },
  { from: 'lib/aiAdvisor.ts', to: 'features/ai/aiAdvisor.ts', oldImport: '@/lib/aiAdvisor', newImport: '@/features/ai/aiAdvisor' },
];

function getAllFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  
  const files = fs.readdirSync(dirPath);
  
  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!['node_modules', '.next', 'tools', 'dist', '.git'].includes(file)) {
        arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
      }
    } else {
      if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
        arrayOfFiles.push(fullPath);
      }
    }
  });
  
  return arrayOfFiles;
}

const allSourceFiles = getAllFiles(projectRoot);

// Step 1: Pre-process the moved files to convert relative `./` or `../` imports to absolute `@/...`
// This prevents relative imports inside the moved files from breaking when they change directory!
for (const move of moves) {
  const fromPath = path.join(projectRoot, move.from);
  if (fs.existsSync(fromPath)) {
    let content = fs.readFileSync(fromPath, 'utf8');
    
    // Replace `from './something'` with `from '@/lib/something'`
    content = content.replace(/from\s+['"]\.\/([^'"]+)['"]/g, "from '@/lib/$1'");
    // Replace `from '../something'` with `from '@/$1'` (rough approximation, we'll fix if needed)
    content = content.replace(/from\s+['"]\.\.\/([^'"]+)['"]/g, "from '@/$1'");
    
    fs.writeFileSync(fromPath, content, 'utf8');
  }
}

// Step 2: Global Search and Replace for import paths
console.log(`Scanning ${allSourceFiles.length} files...`);

for (const filePath of allSourceFiles) {
  let originalContent = fs.readFileSync(filePath, 'utf8');
  let content = originalContent;

  for (const move of moves) {
    // Replace imports using single quotes or double quotes
    const regex = new RegExp(`['"]${move.oldImport}['"]`, 'g');
    content = content.replace(regex, `'${move.newImport}'`);
  }

  if (content !== originalContent) {
    console.log(`Updated imports in: ${path.relative(projectRoot, filePath)}`);
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

// Step 3: Move the files
for (const move of moves) {
  const fromPath = path.join(projectRoot, move.from);
  const toPath = path.join(projectRoot, move.to);
  
  if (fs.existsSync(fromPath)) {
    const dir = path.dirname(toPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.renameSync(fromPath, toPath);
    console.log(`Moved: ${move.from} -> ${move.to}`);
  }
}

console.log("Migration complete!");
