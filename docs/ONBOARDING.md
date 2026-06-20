# Developer Onboarding

**Last updated:** 2026-06-20

Welcome to the Oando Platform. This guide gets you from clone to running local dev in under 15 minutes.

## Prerequisites

- **Node.js** 20+ (check with `node -v`)
- **PowerShell** (Windows) or any POSIX shell (macOS/Linux)
- **Git**
- A Supabase project (for database + auth)

## Quick Start

```powershell
# 1. Clone
git clone https://github.com/mayoite/15062026.git
cd 16062026

# 2. Install dependencies
npm.cmd install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local with your Supabase URL and anon key:
#   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 4. Start dev server
npm.cmd run dev
# Open http://localhost:3000
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Service role key for admin operations |
| `OPENAI_API_KEY` | Optional | For AI advisor features |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Optional | For Gemini-powered features |
| `RESEND_API_KEY` | Optional | For transactional email |

## Common Commands

```powershell
# Development
npm.cmd run dev              # Start dev server (webpack)
npm.cmd run dev:turbo        # Start dev server (turbopack, experimental)

# Quality gates
npm.cmd run typecheck        # TypeScript check (tsc --noEmit)
npm.cmd run lint             # ESLint (zero warnings policy)
npm.cmd run lint:secrets     # Secretlint scan
npm.cmd run test             # Vitest run
npm.cmd run test:planner     # Planner-specific tests
npm.cmd run test:e2e:nav     # Playwright navigation smoke
npm.cmd run test:a11y        # Playwright accessibility tests

# Full release gate
npm.cmd run release:gate

# Database
npm.cmd run db:types         # Generate Supabase types
npm.cmd run db:apply         # Apply migrations
npm.cmd run db:advisors      # Run database advisors
npm.cmd run seed             # Seed database

# Build
npm.cmd run build            # Production build
```

## Project Structure

```
app/                  # Next.js App Router routes
  (site)/             # Marketing site routes
  admin/              # Admin dashboard
  crm/                # CRM dashboard
  ops/                # Ops dashboard
  planner/            # Planner workspace
  api/                # API route handlers
components/            # Shared UI components
  home/               # Homepage components
  site/               # Site chrome (header, footer, nav)
  ui/                 # Primitive UI components
features/              # Feature modules
  planner/            # Space planner (canvas, 3D, editor)
  catalog/            # Product catalog
  crm/                # CRM features
  admin/              # Admin features
  shared/             # Shared feature code
lib/                   # Utilities and helpers
  auth/               # Auth helpers (Supabase)
  security/           # Security utilities (XSS, CSRF)
  i18n/               # Internationalization helpers
platform/              # Platform integrations
  supabase/           # Supabase client + migrations
  drizzle/            # Drizzle ORM schema
config/                # Build configuration
  build/              # ESLint, TypeScript, Playwright, Vitest configs
tests/                 # Test files
docs/                  # Documentation
  architecture/        # Architecture docs (C4, data flow, deployment)
  api/                # OpenAPI spec
  audit/              # Audit reports
tech-stack-docs/       # Tech stack documentation site (Vite)
```

## Key Conventions

- **TypeScript 6.x** strict mode — zero errors allowed
- **ESLint** — zero warnings policy
- **PowerShell** — use `npm.cmd`, not `npm`
- **CSS** — tokens in `app/css/core/tokens/theme.css`, no hex in components
- **State** — Zustand stores per feature slice
- **Auth** — Supabase only (Appwrite fully removed)
- **i18n** — next-intl with 5 locales (en, hi, fr, de, es)

## Testing

- **Unit tests:** Vitest (`*.test.ts`, `*.test.tsx`)
- **E2E tests:** Playwright (`tests/*.spec.ts`)
- **Coverage:** `npm.cmd run test:coverage`
- Run a single test file: `npx vitest run path/to/test.test.ts`

## Next Steps

1. Read `docs/architecture/SYSTEM_OVERVIEW.md` for the big picture
2. Read `docs/architecture/COMPONENT_ARCHITECTURE.md` for module relationships
3. Read `AGENTS.md` for agent-specific rules
4. Run `npm.cmd run dev` and explore the planner at `/planner`
