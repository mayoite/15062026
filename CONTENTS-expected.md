# CONTENTS.md — Expected shape after migration
# This is a REFERENCE document. The real CONTENTS.md is regenerated in Phase 10
# by: npm run docs:sync:all

## Root
| File | Role |
|------|------|
| AGENTS.md | Agent rules — read first |
| Readme.md | Project orientation |
| CONTENTS.md | This file — auto-generated |
| package.json | Root workspace scripts (proxy into site/) |
| tsconfig.json | Workspace-level TypeScript config |
| .env.example | Environment variable reference |
| migration-map.md | Phase 1 audit map — archive after migration |

## archive/
Legacy outputs, audit reports, results snapshots.
| Path | Contents |
|------|---------|
| archive/results/ | Test + audit result snapshots |
| archive/outputs/ | Script output files |
| archive/findingsnew/ | Historical findings (if present) |
| archive/comprehensive-audit-2026-06-20/ | 8 audit reports + executive summary |

## plans/
Roadmaps and WIP planner packets.
| Path | Contents |
|------|---------|
| plans/wip/ | Active planner unified packets |
| plans/plans/ | Docs-level plan files |

## tech-stack-generator/
Vite + React mini-site source. Run `npm run dev` inside this folder.
Output writes to ../tech-stack-docs/ on build.

## tech-stack-docs/
Generated static output from tech-stack-generator/. Do not edit manually.

## docs/
Active documentation.
| File | Role |
|------|------|
| docs/Failures.md | Blockers, skips, follow-ups log |
| docs/Handover.md | Agent/human handover state |
| docs/api/openapi.yaml | OpenAPI 3.0 spec |
| docs/architecture/ | System overview, component arch, data flow, deployment |
| docs/CSS-ARCHITECTURE.md | CSS import map |
| docs/workflow/README.md | Asset and CDN workflow |

## site/
The full Next.js application for oando.co.in.

### App router
| Path | Role |
|------|------|
| site/app/ | Next.js App Router pages and layouts |
| site/app/planner/ | Planner workspace routes |
| site/app/css/ | CSS architecture (base, tokens, bundles) |
| site/app/api/ | API route handlers |

### Features
| Path | Role |
|------|------|
| site/features/planner/ | Unified planner (Fabric canvas + 3D) |
| site/features/site-assistant/ | Site assistant shell |

### Shared
| Path | Role |
|------|------|
| site/components/ | Shared UI components |
| site/lib/ | Utilities, site-data, API schemas |
| site/lib/site-data/ | Static site copy, nav trees, catalog index |
| site/platform/ | Drizzle ORM schema + DB layer |
| site/i18n/ | next-intl locale messages |
| site/public/ | Static assets, CDN SDKs |

### Config
| Path | Role |
|------|------|
| site/config/ | Build config, route contract, DB types |
| site/config/route-contract.json | Canonical route metadata |
| site/config/build/eslint.config.mjs | ESLint config |
| site/config/build/playwright.config.ts | Playwright E2E config |
| site/config/build/tsconfig.json | Base TS config (extended by site/tsconfig.json) |

### Tests + Scripts
| Path | Role |
|------|------|
| site/tests/ | Vitest unit + Playwright E2E tests |
| site/scripts/ | Dev, build, audit, catalog scripts |
| site/fixtures/ | Test fixtures |

### Config files
| File | Role |
|------|------|
| site/next.config.js | Next.js config |
| site/tsconfig.json | App-level TypeScript config |
| site/postcss.config.mjs | PostCSS config |
| site/vitest.config.ts | Vitest workspace config |
| site/vitest.shared.ts | Shared vitest setup |
| site/vitest.site.config.ts | Site-scoped vitest config |
