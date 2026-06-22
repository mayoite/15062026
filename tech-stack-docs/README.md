# Oando Platform — Tech Stack Documentation

A standalone, modifiable documentation site showcasing the entire technology stack, architecture, workflows, and development processes of the **Oando Platform** (a furniture company platform at `oando.co.in` featuring a 2D/3D room planner, product catalog, CRM, and admin dashboard).

Built with **Vite + React + TypeScript + Tailwind CSS**, this site documents the production stack (Next.js 16, Supabase, Fabric.js, Three.js/R3F, Zustand, Drizzle ORM, Playwright + Vitest, Vercel) in an interactive, searchable, responsive interface.

## Quick Start

```bash
cd tech-stack-docs
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

> **Windows / PowerShell:** use `npm.cmd` instead of `npm` (e.g. `npm.cmd run dev`) — this matches the conventions of the main Oando Platform repository.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check + production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run typecheck` | Run TypeScript compiler in check mode |

## Documentation Sections

The site includes 12 documentation pages:

1. **Overview** — Landing page with tech stack summary, key technologies, and navigation
2. **Tech Stack** — All 40+ dependencies grouped by category with versions and roles
3. **Architecture** — System diagrams (Mermaid), App Router structure, planner data flow, auth flow
4. **Features** — Deep-dives into Planner (Fabric.js + R3F), Catalog, CRM, Admin
5. **Code Organization** — Directory layout, module conventions, import patterns
6. **Database** — PostgreSQL schema (ER diagram), Drizzle ORM, migrations, RLS policies
7. **API Design** — Route table, route handler + Server Action examples, error conventions
8. **Testing** — Vitest + Playwright + coverage strategy with code examples
9. **Deployment** — Vercel CI/CD pipeline, release:gate steps, environment variables
10. **Security** — Auth, RLS, secrets management, rate limiting, secret scanning
11. **Performance** — Server components, image optimization, 3D performance, Web Vitals
12. **Workflows** — Git flow, daily dev loop, commit conventions, common task guides

## Features

- **Searchable** — Fuse.js fuzzy search across all documentation sections (sidebar search box)
- **Collapsible sections** — Long content folds into expandable panels
- **Syntax highlighting** — highlight.js for all code blocks with copy-to-clipboard
- **Mermaid diagrams** — Architecture, data flow, ER, sequence, and flowchart diagrams
- **Responsive sidebar** — Collapsible on mobile with a drawer toggle
- **Dark theme** — Modern dark UI built with Tailwind CSS
- **Category filtering** — Filter tech stack by category (Frontend, Canvas & 3D, Backend, etc.)

## Project Structure

```
tech-stack-docs/
├── index.html               # HTML entry point
├── package.json             # Dependencies + scripts
├── vite.config.ts           # Vite config
├── tsconfig.json            # TypeScript config
├── tailwind.config.js       # Tailwind theme (brand + accent colors)
├── postcss.config.js        # PostCSS (tailwind + autoprefixer)
└── src/
    ├── main.tsx             # React entry
    ├── App.tsx              # Router + layout
    ├── index.css            # Tailwind + highlight.js theme
    ├── components/
    │   ├── Sidebar.tsx          # Navigation sidebar (responsive)
    │   ├── SearchResults.tsx    # Search overlay
    │   ├── CodeBlock.tsx        # Code block with syntax highlighting + copy
    │   ├── MermaidDiagram.tsx   # Mermaid renderer (dark theme)
    │   └── CollapsibleSection.tsx  # Expandable section
    ├── pages/
    │   ├── Overview.tsx
    │   ├── TechStack.tsx
    │   ├── Architecture.tsx
    │   ├── Features.tsx
    │   ├── CodeOrganization.tsx
    │   ├── Database.tsx
    │   ├── ApiDesign.tsx
    │   ├── Testing.tsx
    │   ├── Deployment.tsx
    │   ├── Security.tsx
    │   ├── Performance.tsx
    │   └── Workflows.tsx
    ├── data/
    │   ├── navigation.ts        # Sidebar nav structure
    │   └── techStack.ts         # Tech stack dependency data
    ├── hooks/
    │   └── useSearch.ts         # Fuse.js search hook + index
    └── types/
        └── index.ts             # Shared TypeScript types
```

## How to Modify

### Add a new documentation page

1. Create a new file in `src/pages/` (e.g. `ReleaseNotes.tsx`)
2. Add a route in `src/App.tsx`:
   ```tsx
   import { ReleaseNotes } from './pages/ReleaseNotes'
   // ...
   <Route path="/release-notes" element={<ReleaseNotes />} />
   ```
3. Add a nav entry in `src/data/navigation.ts`:
   ```ts
   { id: 'release-notes', label: 'Release Notes', icon: 'GitTag', path: '/release-notes' }
   ```
4. If using a new icon, add it to the `iconMap` in `src/components/Sidebar.tsx`.

### Add a new technology to the stack

Edit `src/data/techStack.ts` and append a new `TechItem` object:

```ts
{
  name: 'New Library',
  version: '^1.0.0',
  category: 'Frontend',  // or create a new category
  description: 'What it does.',
  role: 'How it is used in the Oando Platform.',
  docs: 'https://example.com/docs',
  color: 'bg-blue-600 text-white',
}
```

### Add search content

Edit `src/hooks/useSearch.ts` and add entries to the `searchIndex` array. Each entry needs an `id`, `title`, `path`, `section`, `content` (searchable text), and optional `tags`.

### Customize the theme

Edit `tailwind.config.js` to change the `brand` and `accent` color scales. The Mermaid diagram theme is configured in `src/components/MermaidDiagram.tsx`. The syntax highlighting theme is in `src/index.css` (`.hljs-*` classes).

### Reuse components

- `<CodeBlock code="..." language="typescript" title="example.ts" />` — Renders highlighted code with copy button
- `<MermaidDiagram chart="flowchart TB\n A --> B" title="Title" />` — Renders a Mermaid diagram
- `<CollapsibleSection title="Section" badge="Optional">{children}</CollapsibleSection>` — Expandable panel

## Tech Used to Build This Site

- **Vite 6** — Build tool + dev server
- **React 18** — UI library
- **TypeScript 5** — Type safety (this docs site uses TS 5; the main platform uses TS 6.x)
- **Tailwind CSS 3** — Styling
- **React Router 6** — Client-side routing
- **Fuse.js** — Fuzzy search
- **Mermaid 11** — Diagram rendering
- **highlight.js** — Syntax highlighting
- **Lucide React** — Icons

## Relationship to the Main Platform

This documentation site is a **separate Vite app** that lives inside the main Oando Platform repository at `tech-stack-docs/`. It has its own `package.json` and does not share dependencies with the main Next.js app. Keep it aligned with the authoritative repo docs in `Readme.md`, `AGENTS.md`, `docs/architecture/STRUCTURE_GUIDELINES.md`, `docs/architecture/CSS-SOLUTION.md`, and `docs/plans/` so it mirrors the current stack rather than drifting into stale paths.

---

_Generated for the Oando Platform. See the main repository for the production codebase._
