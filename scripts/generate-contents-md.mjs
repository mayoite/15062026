import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

/** @typedef {{ area: string, canonical: string, consumers: string, doNotDuplicate?: string }} OwnershipRow */

/** @type {Record<string, { title: string, why: string, contains: string[], rules?: string[], see?: string[], ownership?: OwnershipRow[] }>} */
/** Root: Readme.md, AGENTS.md, CONTENTS.md (this file). Handover/Failures live in docs/. */
const folders = {
  ".": {
    title: "Repository root",
    why: "Flat-root Next.js monolith. Hand-written root docs: Readme + AGENTS. This CONTENTS.md is generated.",
    contains: [
      "Readme.md — orientation",
      "AGENTS.md — agent rules",
      "CONTENTS.md — generated repo map (npm run docs:sync:all)",
      "docs/ — Handover.md, Failures.md, TESTING, SCRIPTS, DOC-MAP, CSS",
      "plans/ — phased roadmaps",
      "app/, features/, components/, lib/, tests/, scripts/, platform/, config/, results/, archive/",
    ],
    see: ["Readme.md", "AGENTS.md", "docs/DOC-MAP.md", "docs/Handover.md"],
  },
  app: {
    title: "Next.js App Router",
    why: "Routing layer only. Pages import from features/ and components/; business logic stays out of app/.",
    contains: [
      "(site)/ — public marketing routes",
      "planner/ — planner marketing + workspace routes",
      "api/ — Route handlers (server)",
      "css/ — shared FOCSS (tokens, bundles)",
      "admin/, crm/, ops/ — portal routes",
    ],
    rules: ["No heavy business logic in page files", "CSS tokens live in app/css/, not inline in routes"],
    see: ["docs/CSS-ARCHITECTURE.md"],
  },
  "app/(site)": {
    title: "Marketing site routes",
    why: "Public oando.co.in pages: home, products, catalog, contact, careers, legal, etc.",
    contains: ["One folder per route (page.tsx + route-local components)", "globals.css — imports app/css/index.css"],
    rules: ["Route folders mirror URL paths", "Reuse components/home, components/site, features/site"],
  },
  "app/api": {
    title: "API route handlers",
    why: "Server endpoints for catalog, planner saves, admin, AI, tracking — called from client or scripts.",
    contains: ["admin/ — admin portal APIs", "planner/ — planner persistence & AI", "products/, categories/ — catalog", "ai/, ai-advisor/, ai-assist/ — AI proxies"],
    rules: ["Use platform/supabase or platform/drizzle — never raw credentials in handlers"],
  },
  "app/css": {
    title: "Shared CSS (FOCSS)",
    why: "Single design system for site + planner. Tokens and bundles avoid hardcoded colors in TSX.",
    contains: ["base/ — animations, resets", "core/tokens/ — @theme source of truth", "core/site/ — marketing bundles", "core/planner/ — workspace chrome bundles"],
    see: ["docs/CSS-ARCHITECTURE.md"],
  },
  "app/css/base": {
    title: "Global CSS primitives",
    why: "Low-level primitives imported before core tokens — animations, resets not tied to a route.",
    contains: ["animations.css and other cross-app primitives"],
  },
  "app/css/core": {
    title: "FOCSS core layers",
    why: "Tokens, utilities, chrome, and per-surface bundles (site vs planner).",
    contains: ["tokens/ — theme.css", "chrome/ — shell chrome", "site/bundles/ — homepage, catalog, etc.", "planner/bundles/ — workspace UI", "utilities/, typography/, layout/"],
  },
  "app/planner": {
    title: "Planner routes",
    why: "URL surface for the unified planner: marketing landing, guest workspace, authenticated canvas.",
    contains: ["(marketing)/ — landing, features, help", "(workspace)/canvas/, guest/ — editor entry points"],
    rules: ["Editor implementation is in features/planner/, not here"],
  },
  "app/admin": {
    title: "Admin portal routes",
    why: "Internal admin UI for catalog, plans, themes, analytics.",
    contains: ["analytics/, catalog/, planner-catalog/, plans/, themes/, features/"],
  },
  "app/crm": {
    title: "CRM routes",
    why: "Client and project management surfaces for sales/ops.",
    contains: ["clients/, projects/, quotes/"],
  },
  "app/ops": {
    title: "Ops portal routes",
    why: "Operational tools (e.g. customer queries) for internal staff.",
    contains: ["customer-queries/"],
  },
  features: {
    title: "Feature modules (domain logic)",
    why: "Feature-sliced design: each product area owns hooks, stores, and UI tied to its domain.",
    contains: [
      "planner/ — canonical workspace planner (editor, 3D, catalog, AI)",
      "catalog/ — product catalog domain (filters, resolvers, schemas)",
      "shared/ — auth UI, shell, cross-feature hooks",
      "admin/, ops/, crm/, ai/, site-assistant/",
    ],
    ownership: [
      {
        area: "Catalog filters & product resolution",
        canonical: "features/catalog/",
        consumers: "app/(site)/products, components/products, features/planner/catalog",
        doNotDuplicate: "lib/catalog/ — SSG merge, blocks2d, seed scripts only",
      },
      {
        area: "Marketing copy & local catalog index",
        canonical: "data/site/",
        consumers: "features/catalog, components/home, lib/helpers/seo",
        doNotDuplicate: "features/catalog/ — no hardcoded nav/copy",
      },
      {
        area: "Auth UI & session types",
        canonical: "features/shared/auth/",
        consumers: "app/(site)/login, app/(site)/access",
        doNotDuplicate: "lib/auth/ — server session, cookies, redirects",
      },
      {
        area: "Marketing presentational sections",
        canonical: "components/home, components/site",
        consumers: "app/(site) routes",
        doNotDuplicate: "features/ — domain state belongs in features/, not components/",
      },
    ],
    rules: ["Planner code only in features/planner/", "Do not revive archive/ planner variants"],
  },
  "features/planner": {
    title: "Canonical planner",
    why: "Single source for /planner workspace: tldraw editor, catalog placement, 3D viewer, persistence, AI assist.",
    contains: [
      "editor/ — canvas, layers, tools, inspector",
      "catalog/ — ingest + generated items",
      "store/ — Zustand state",
      "3d/, viewer/ — Three.js scene",
      "landing/, onboarding/ — guest funnel",
      "persistence/, document/, model/",
      "shared/ — BOQ, export, engine types",
      "tldraw/ — custom shapes & tools",
    ],
    ownership: [
      {
        area: "Canvas & workspace shell",
        canonical: "features/planner/editor/, features/planner/ui/",
        consumers: "app/planner/(workspace)/",
        doNotDuplicate: "app/planner/ — routes only, no editor logic",
      },
      {
        area: "Planner-specific React chrome",
        canonical: "features/planner/components/, features/planner/shared/components/",
        consumers: "features/planner/editor, features/planner/landing",
        doNotDuplicate: "components/ — marketing UI only",
      },
      {
        area: "Client state (Zustand)",
        canonical: "features/planner/store/",
        consumers: "editor, hooks, persistence",
        doNotDuplicate: "lib/store/ — site quote cart only",
      },
      {
        area: "Document schema & permissions",
        canonical: "features/planner/model/",
        consumers: "persistence, API /api/plans",
        doNotDuplicate: "platform/drizzle/ — DB row shape only",
      },
      {
        area: "Site product catalog",
        canonical: "features/catalog/ + lib/catalog/",
        consumers: "features/planner/catalog via catalogBridge",
        doNotDuplicate: "Duplicate ingest in planner/catalog/ except placement adapters",
      },
    ],
    see: ["docs/TESTING.md", "docs/Handover.md"],
  },
  "features/planner/editor": {
    title: "Planner editor",
    why: "tldraw-based 2D canvas: walls, furniture, layers, measurements, blueprint import.",
    contains: ["inspector/, templates/, layer visibility, tool rail, selection UI"],
  },
  "features/planner/catalog": {
    title: "Planner catalog",
    why: "Furniture catalog for placement: generated items, ingest pipeline, block bridge to canvas.",
    contains: ["ingest/ — CSV ingest scripts target", "generatedCatalogItems.ts — generated output"],
    see: ["scripts/ingest-planner-catalog.ts"],
  },
  "features/planner/store": {
    title: "Planner client state",
    why: "Zustand stores for geometry, furniture, project metadata, catalog filters.",
    contains: ["plannerFurnitureStore, plannerGeometryStore, plannerProjectData, etc."],
  },
  "features/planner/3d": {
    title: "Planner 3D",
    why: "Three.js / R3F scene built from 2D document for preview and walkthrough.",
    contains: ["Scene types, mesh builders, camera presets"],
  },
  "features/planner/landing": {
    title: "Planner marketing UI",
    why: "Landing page sections and CTA flow into guest workspace.",
    contains: ["Hero, features grid, social proof blocks used by app/planner/(marketing)"],
  },
  "features/planner/persistence": {
    title: "Planner persistence",
    why: "Client drafts, autosave, cloud save adapters to API + Drizzle plans table.",
    contains: ["Draft types, save/load orchestration"],
  },
  "features/planner/shared": {
    title: "Planner shared kernel",
    why: "Code shared across editor, export, and 3D without circular imports.",
    contains: ["boq/ — quote cart bridge", "catalog/ — adapters", "export/ — PDF/BOQ", "document/, engine/, types/"],
  },
  "features/planner/tldraw": {
    title: "tldraw extensions",
    why: "Custom shapes (walls, furniture blocks), tools, and shape utils for the canvas.",
    contains: ["shapes/, tools/ — ClearanceChecker, catalog blocks"],
  },
  "features/planner/ui": {
    title: "Planner shell UI",
    why: "Chrome around the canvas: top bar, panels, modals, responsive layout.",
    contains: ["InspectorPanel, catalog panel, project setup gate"],
  },
  "features/shared": {
    title: "Cross-feature shared code",
    why: "Auth, shell layout, analytics hooks used by site, planner, and admin.",
    contains: ["auth/ — AuthShell, session hooks", "components/ — GuestBadge, etc.", "shell/, entry/, dashboard/"],
  },
  "features/catalog": {
    title: "Catalog domain",
    why: "Product filtering, schemas, and resolvers shared by site catalog and planner.",
    contains: ["Filter logic, category trees, product resolution"],
  },

  "features/ai": {
    title: "AI advisor (site-wide)",
    why: "AI assist features outside the planner canvas (advisor config, prompts).",
    contains: ["Advisor configuration and client wrappers"],
  },
  "features/admin": {
    title: "Admin feature module",
    why: "Admin-specific UI logic separated from app/admin routes.",
    contains: ["ui/ — admin components"],
  },
  "features/crm": {
    title: "CRM feature module",
    why: "Client/project quote flows for sales team.",
    contains: ["stores/ — CRM state"],
  },
  "features/ops": {
    title: "Ops feature module",
    why: "Internal ops surfaces (customer queries management).",
    contains: ["Ops page views and data hooks"],
  },
  "features/site-assistant": {
    title: "Site chat assistant",
    why: "Marketing site bot widget (AdvancedBot).",
    contains: ["Chat UI and message handling"],
  },
  components: {
    title: "Shared React components",
    why: "Presentational and composite UI reused across routes. No domain stores here — use features/.",
    contains: ["ui/ — primitives (buttons, dialogs)", "home/, site/ — marketing sections", "products/ — catalog cards", "shared/ — cross-page widgets"],
    ownership: [
      {
        area: "Marketing sections & chrome",
        canonical: "components/home/, components/site/, components/products/",
        consumers: "app/(site)/ routes",
        doNotDuplicate: "features/planner/ — planner workspace UI",
      },
      {
        area: "App-wide UI primitives",
        canonical: "components/ui/",
        consumers: "components/*, features/shared, app/",
        doNotDuplicate: "features/planner/shared/components/ — planner-only chrome",
      },
      {
        area: "Cross-route widgets (site)",
        canonical: "components/shared/",
        consumers: "marketing routes",
        doNotDuplicate: "features/shared/components/ — auth badges, shell pieces",
      },
      {
        area: "Auth & shell (stateful)",
        canonical: "features/shared/components/, features/shared/auth/components/",
        consumers: "login, access, dashboard layouts",
        doNotDuplicate: "components/ — keep dumb/presentational",
      },
    ],
    rules: ["Prefer features/ for stateful domain UI", "ui/ stays dumb and styled via FOCSS tokens"],
  },
  "components/ui": {
    title: "UI primitives",
    why: "Atomic components (Radix-based) shared app-wide.",
    contains: ["Button, Dialog, Tabs, Accordion wrappers"],
  },
  "components/home": {
    title: "Homepage components",
    why: "homepage-v2 sections: hero, collections, projects, contact.",
    contains: ["Section components imported by app/(site) home route"],
  },
  "components/site": {
    title: "Site chrome components",
    why: "Header, footer, mega menu, mobile drawer for marketing layout.",
    contains: ["Navigation, layout shells"],
  },
  "components/products": {
    title: "Product display components",
    why: "Catalog grids, product cards, filters UI for /products and /catalog.",
    contains: ["ProductCard, filter panels, compare UI"],
  },
  "components/shared": {
    title: "Misc shared components",
    why: "Widgets used on multiple marketing routes but not generic enough for ui/.",
    contains: ["Carousels, media blocks, reusable sections"],
  },
  lib: {
    title: "Shared libraries",
    why: "Pure utilities, clients, and helpers with no React views. Imported by features/ and app/.",
    contains: [
      "catalog/ — static params, product merge, blocks2d",
      "auth/, supabase/ — client-safe auth helpers",
      "ai/, analytics/, tracking/",
      "hooks/, helpers/, types/, ui/ (non-component helpers)",
    ],
    ownership: [
      {
        area: "Server session & route guards",
        canonical: "lib/auth/",
        consumers: "app/api, app/crm, app/admin, app/planner layouts",
        doNotDuplicate: "features/shared/auth/ — React providers and login UI",
      },
      {
        area: "Catalog SSG & merge pipeline",
        canonical: "lib/catalog/",
        consumers: "features/catalog/getProducts, app/(site)/products",
        doNotDuplicate: "features/catalog/ — filter UX and domain types",
      },
      {
        area: "Supabase browser client",
        canonical: "lib/supabase/",
        consumers: "features, components (client components)",
        doNotDuplicate: "platform/supabase/ — migrations, admin, edge functions",
      },
      {
        area: "Site quote cart",
        canonical: "lib/store/",
        consumers: "marketing quote flows",
        doNotDuplicate: "features/planner/store/ — planner Zustand only",
      },
    ],
  },
  platform: {
    title: "Infrastructure adapters",
    why: "Protected layer for DB and third-party SDKs. App code imports from here, not raw SDKs scattered in features/.",
    contains: ["supabase/ — clients, migrations, edge functions", "drizzle/ — schema, db.ts, migrations", "appwrite/ — legacy/alternate backend"],
    rules: ["Migrations live here only", "Never commit service-role keys"],
  },
  "platform/supabase": {
    title: "Supabase",
    why: "Primary backend: auth, storage, Postgres, RLS migrations.",
    contains: ["client.ts, server.ts, admin.ts", "migrations/, migrations.admin/", "functions/assistant-chat/"],
  },
  "platform/drizzle": {
    title: "Drizzle ORM",
    why: "Typed SQL access for planner plans and admin tables alongside Supabase.",
    contains: ["schema.ts, db.ts, drizzle.config.ts", "migrations/"],
  },
  "platform/appwrite": {
    title: "Appwrite client",
    why: "Legacy/alternate BaaS adapter kept for migration reference.",
    contains: ["appwrite.ts, client.ts"],
  },
  config: {
    title: "Configuration",
    why: "Build tooling, generated types, and deployment manifests — not runtime app code.",
    contains: ["build/ — eslint, tsconfig, playwright, postcss", "database/types/ — generated Supabase types", "deployment/, environment/"],
  },
  "config/build": {
    title: "Build & test config",
    why: "Tooling configs referenced by package.json and CI.",
    contains: ["eslint.config.mjs, tsconfig.json (base), playwright.config.ts, postcss"],
  },
  "config/database": {
    title: "Database types",
    why: "Generated TypeScript types from Supabase schema.",
    contains: ["types/database.types.ts — regen via npm run db:types"],
  },
  "config/deployment": {
    title: "Deployment config",
    why: "Hosting manifests (DigitalOcean, Vercel-related templates).",
    contains: ["digitalocean/ — app spec templates"],
  },
  "config/environment": {
    title: "Environment templates",
    why: "Documented env var shapes and example configs.",
    contains: ["Env documentation and templates"],
  },
  data: {
    title: "Static data",
    why: "JSON/TS data files that ship with the app (copy, indexes, planner fixtures).",
    contains: ["site/ — navigation, homepage copy, localCatalogIndex.json"],
  },
  "data/site": {
    title: "Site static data",
    why: "Marketing copy, nav trees, and local catalog index for SSG.",
    contains: ["localCatalogIndex.json, navigation-data, homepage content modules"],
  },

  docs: {
    title: "Reference documentation",
    why: "How the repo works today — not phased roadmaps (those live in plans/).",
    contains: [
      "DOC-MAP.md — index + live vs reference vs archive rules",
      "Handover.md, Failures.md — live ops (open issues only in Failures)",
      "TESTING.md, SCRIPTS.md, CSS-ARCHITECTURE.md — reference how-to",
      "ops/audits/, ops/context/ — audit snapshots + reference tables",
    ],
    see: ["Readme.md", "docs/DOC-MAP.md", "plans/CONTENTS.md"],
    rules: ["No phased plans here — use plans/", "Retired docs: archive/docs/"],
  },
  plans: {
    title: "Active plans",
    why: "Phased roadmaps with acceptance criteria. Reference how-to stays in docs/.",
    contains: [
      "MASTER-PLAN.md — program dashboard, metrics, critical path",
      "TESTING-PLAN.md — Vitest/Playwright phases, dual coverage tracks",
      "COVERAGE-PLAN.md — planner 75% + site 50% strategy",
      "REPO-STRUCTURE-PLAN.md — folder layout steps 00–06 (complete)",
      "HARDCODING-PLAN.md — literal remediation steps 00–06",
    ],
    see: ["docs/DOC-MAP.md", "docs/TESTING.md", "docs/Handover.md"],
    rules: [
      "One plan file per initiative",
      "Historical plans: archive/docs/plans/",
      "Do not duplicate docs/TESTING.md or docs/SCRIPTS.md content",
    ],
  },
  "docs/ops": {
    title: "Ops evidence",
    why: "Point-in-time audits and static context tables — not live Handover/Failures logs.",
    contains: [
      "audits/ — supabase-schema-audit.md, runtime-query-audit.md (+ json)",
      "context/ — route-classification.md (npm run docs:routes)",
    ],
    see: ["docs/DOC-MAP.md", "archive/docs/recovered-2026-06-15/"],
    rules: ["No live ops logs here", "Past failures: git log + archive/docs/recovered-2026-06-15/"],
  },
  tests: {
    title: "All tests",
    why: "Single folder for Vitest unit tests and Playwright e2e/a11y specs.",
    contains: [
      "*.test.ts(x) — Vitest",
      "*.spec.ts — Playwright",
      "setup.ts, guestProjectSetup.ts — helpers",
      "INVENTORY.md — auto file list (npm run docs:sync)",
    ],
    see: ["docs/TESTING.md", "tests/INVENTORY.md"],
    rules: ["No subfolders — flat layout with prefixed names", "No co-located tests in features/"],
  },
  scripts: {
    title: "CLI scripts",
    why: "One-off and recurring maintenance: seed, migrations, catalog ingest, audits, recovery, doc generation.",
    contains: [
      "TypeScript (.ts), Node (.mjs), Python (.py), shell deploy scripts",
      "generate-docs.mjs — CONTENTS.md + test inventory (+ optional coverage)",
    ],
    see: ["docs/SCRIPTS.md"],
    rules: ["Wire recurring tasks to package.json", "Write outputs to results/"],
  },
  "results/tooling-docs": {
    title: "Tooling doc exports",
    why: "Snapshots from audit/render scripts (formerly tools/docs/).",
    contains: ["ops/ — external asset audits and similar JSON exports"],
  },
  "results/tooling-reports": {
    title: "Tooling reports",
    why: "Intermediate analysis outputs (formerly tools/reports/).",
    contains: ["Catalog asset arrangement and similar JSON reports"],
  },
  public: {
    title: "Static public assets",
    why: "Files served at / without bundling: images, fonts, 3D models, tldraw CDN fallback.",
    contains: ["images/, fonts/, models/, cdn/, tldraw-assets/", "favicon and static downloads"],
    rules: ["Large assets prefer CDN/Supabase storage; public/ for essentials only"],
  },
  "public/images": {
    title: "Public images",
    why: "Static image assets referenced by URL in marketing and planner.",
    contains: ["Product placeholders, icons, marketing imagery"],
  },
  "public/models": {
    title: "3D models",
    why: "GLB/OBJ assets for planner 3D viewer and product previews.",
    contains: ["Furniture and scene models"],
  },
  "public/tldraw-assets": {
    title: "tldraw static assets",
    why: "Self-hosted tldraw icons/fonts when not loaded from package CDN.",
    contains: ["tldraw package asset mirror"],
  },
  results: {
    title: "Generated evidence",
    why: "Outputs from tests, audits, scripts — not source code. Safe to regenerate.",
    contains: [
      "audits/ — security, lighthouse, merge checklists",
      "screenshots/ — Playwright captures",
      "coverage/, docs-rendered/, project-tree.csv, repo-dir-tree.xlsx",
      "tooling-docs/, tooling-reports/ — legacy tools/ outputs",
    ],
    rules: ["Do not hand-edit as source of truth", "Commit selectively for handover evidence"],
  },
  "results/audits": {
    title: "Audit reports",
    why: "Human-readable audit outputs from quality and security scripts.",
    contains: ["security-audit.md, lighthouse-audit.md, repo-merge-checklist.txt"],
  },
  "results/screenshots": {
    title: "Screenshot evidence",
    why: "Visual regression and navigation smoke captures.",
    contains: ["Playwright and capture-*.mjs outputs"],
  },
  archive: {
    title: "Archived code",
    why: "Retired implementations kept for reference during migration. Never import into live app.",
    contains: [
      "features/ — old planner variants",
      "data/planner-orphans-2026-06-14/ — unused data/planner prototypes",
      "docs/ — retired plan packs and recovered session logs",
      "legacy-tests/, imports/, css/",
    ],
    rules: ["Do not delete without backup", "Do not import from archive/ in app or features"],
  },
  project: {
    title: "Architectural contracts",
    why: "Machine-readable project metadata (route contracts, governance JSON).",
    contains: ["route-contract.json — expected routes and classifications"],
  },
};

function render({ title, why, contains, rules, see, ownership }) {
  const lines = [
    `# ${title}`,
    "",
    "## Why this folder exists",
    "",
    why,
    "",
    "## What is here",
    "",
    ...contains.map((c) => `- ${c}`),
  ];
  if (ownership?.length) {
    lines.push(
      "",
      "## Ownership",
      "",
      "| Area | Canonical owner | Typical consumers | Do not duplicate in |",
      "|------|-----------------|-------------------|---------------------|",
      ...ownership.map(
        (row) =>
          `| ${row.area} | \`${row.canonical}\` | ${row.consumers} | ${row.doNotDuplicate ?? "—"} |`,
      ),
    );
  }
  if (rules?.length) {
    lines.push("", "## Rules", "", ...rules.map((r) => `- ${r}`));
  }
  if (see?.length) {
    lines.push("", "## See also", "", ...see.map((s) => `- \`${s}\``));
  }
  lines.push("", "---", "*Generated by `scripts/generate-contents-md.mjs` — edit manifest, then `npm run docs:sync:all`.*", "");
  return lines.join("\n");
}

let written = 0;
for (const [rel, meta] of Object.entries(folders)) {
  const dir = rel === "." ? repoRoot : path.join(repoRoot, rel);
  if (!fs.existsSync(dir)) continue;
  const out = path.join(dir, "CONTENTS.md");
  fs.writeFileSync(out, render(meta), "utf8");
  written += 1;
}
console.log(`Wrote ${written} CONTENTS.md files`);