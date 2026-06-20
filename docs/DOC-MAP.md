# Documentation Map

**Last updated:** 2026-06-20

## Architecture
- `docs/architecture/SYSTEM_OVERVIEW.md` — System purpose, C4 context diagram, core capabilities, tech stack
- `docs/architecture/COMPONENT_ARCHITECTURE.md` — Module relationships, layer dependencies
- `docs/architecture/DATA_FLOW.md` — Data flow diagrams for major workflows
- `docs/architecture/DEPLOYMENT.md` — Deployment architecture, environments, scaling

## API
- `docs/api/openapi.yaml` — OpenAPI 3.0 specification for key API routes
## Database
- `docs/database/SCHEMA.md` — Schema reference with ERDs + RLS matrix
- `docs/database/SEEDING.md` — Seeding workflow
- `docs/database/ADVISORS.md` — Database advisors (security + performance)

## Audit Reports
- `docs/audit/SEO_AUDIT.md` — SEO audit (7.5 → 9.5/10)
- `docs/audit/MEMORY_MANAGEMENT.md` — Memory management audit (6.0 → 8.0/10)
- `comprehensive-audit-2026-06-20/` — Full audit suite (8 reports + executive summary)

## Operations
- `docs/OPERATIONS_RUNBOOK.md` — Deployment, backup, restore, incident response
- `docs/ONBOARDING.md` — Developer onboarding guide

## Feature Documentation
- `features/planner/CONTENTS.md` — Planner feature overview
- `features/catalog/CONTENTS.md` — Catalog feature overview
- `features/shared/CONTENTS.md` — Shared feature code
- Each feature subdirectory has its own `CONTENTS.md`

## Tech Stack Site
- `tech-stack-docs/` — Interactive Vite site documenting the full technology stack
  - Run: `cd tech-stack-docs && npm.cmd install && npm.cmd run dev`
  - Opens at http://localhost:5173

## Root
- `README.md` — Repo orientation
- `AGENTS.md` — Agent rules
