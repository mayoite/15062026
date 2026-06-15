const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, '../../app');

// Define the route groups and which folders belong to them
const groups = {
  '(planners)': [
    'oando-planner', 
    'buddy-planner', 
    'oofpl-planner', 
    'planning', 
    'canvas', 
    'shared'
  ],
  '(crm)': ['crm'],
  '(ops)': ['ops', 'admin'],
  // Everything else goes to (site)
};

function migrate() {
  console.log("Starting Route Isolation Migration...");

  // 1. Create group directories
  const allGroups = ['(site)', ...Object.keys(groups)];
  for (const group of allGroups) {
    const groupPath = path.join(appDir, group);
    if (!fs.existsSync(groupPath)) {
      fs.mkdirSync(groupPath);
      console.log(`Created group directory: ${group}`);
    }
  }

  // 2. Move root layout to (site) temporarily, or read it to copy
  const rootLayoutPath = path.join(appDir, 'layout.tsx');
  let layoutContent = '';
  if (fs.existsSync(rootLayoutPath)) {
    layoutContent = fs.readFileSync(rootLayoutPath, 'utf8');
    // We will delete the root layout later so Next.js uses multiple root layouts
  }

  // 3. Move directories
  const entries = fs.readdirSync(appDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('(') || entry.name === 'layout.tsx') {
      continue; // Skip group dirs and root layout for now
    }
    
    const sourcePath = path.join(appDir, entry.name);
    let targetGroup = '(site)'; // default

    for (const [groupName, folders] of Object.entries(groups)) {
      if (folders.includes(entry.name)) {
        targetGroup = groupName;
        break;
      }
    }

    const targetPath = path.join(appDir, targetGroup, entry.name);
    fs.renameSync(sourcePath, targetPath);
    console.log(`Moved ${entry.name} -> ${targetGroup}/`);
  }

  // 4. Create separate root layouts
  // For (site) - keep original with RouteChrome
  const siteLayoutPath = path.join(appDir, '(site)', 'layout.tsx');
  if (!fs.existsSync(siteLayoutPath) && layoutContent) {
    // We need to adjust imports since it's one level deeper
    // @/ imports will still work!
    fs.writeFileSync(siteLayoutPath, layoutContent);
    console.log(`Created (site)/layout.tsx`);
  }

  // For (planners) - minimal layout without RouteChrome
  const plannersLayoutPath = path.join(appDir, '(planners)', 'layout.tsx');
  if (!fs.existsSync(plannersLayoutPath)) {
    const plannerLayoutContent = `import type { Metadata, Viewport } from "next";
import "@/app/(site)/globals.css"; // Reuse globals from site
import QueryProvider from "@/app/(site)/providers/QueryProvider";
import { ciscoSans, helveticaNeue } from "@/lib/fonts";

export const viewport: Viewport = { width: "device-width", initialScale: 1, minimumScale: 1 };

export default function PlannerLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={\`\${ciscoSans.variable} \${helveticaNeue.variable}\`}>
      <body className="antialiased h-screen w-screen overflow-hidden">
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}`;
    fs.writeFileSync(plannersLayoutPath, plannerLayoutContent);
    console.log(`Created (planners)/layout.tsx`);
  }

  // Create similar minimal root layouts for CRM and Ops if needed...
  // For now, we will just copy the planners one as a base, or the site one.
  for (const group of ['(crm)', '(ops)']) {
    const groupLayoutPath = path.join(appDir, group, 'layout.tsx');
    if (!fs.existsSync(groupLayoutPath)) {
      // Basic layout
      const basicLayout = `import type { Metadata, Viewport } from "next";
import "@/app/(site)/globals.css";
import QueryProvider from "@/app/(site)/providers/QueryProvider";

export const viewport: Viewport = { width: "device-width", initialScale: 1, minimumScale: 1 };

export default function ${group.replace(/[()]/g, '')}Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body className="antialiased bg-background">
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}`;
      fs.writeFileSync(groupLayoutPath, basicLayout);
      console.log(`Created ${group}/layout.tsx`);
    }
  }

  // 5. Delete root layout to enforce separate contexts
  if (fs.existsSync(rootLayoutPath)) {
    fs.unlinkSync(rootLayoutPath);
    console.log("Deleted root layout.tsx to enable Multiple Root Layouts (full page loads between contexts).");
  }

  console.log("Migration complete!");
}

migrate();
