# 04 Platform and API Boundaries

## Protection Rule

This phase is read-only until explicit approval covers exact protected files. Consensus today: no protected-path edit has been approved for the Oando planner swap; keep phase 4 audit-only.

Protected scope:

```text
app/api/
config/
platform/
project/
proxy.ts
auth/session behavior
database migrations and generated schema
```

## Audit Tasks

- [ ] Map all API routes by method, authentication, validation, rate limit, repository, and response shape.
- [ ] Identify duplicate AI advisor routes.
- [ ] Identify duplicate product filtering and catalog administration routes.
- [ ] Map plan persistence routes to their current document schema.
- [ ] Map Appwrite, Supabase, Drizzle, and direct database usage.
- [ ] Verify authorization inside every protected server operation.
- [ ] Verify Zod validation or equivalent at request boundaries.
- [ ] Record provider-specific calls leaking into UI components.
- [ ] Publish findings in Repo Store without changing behavior.

## Approval Package

Before any protected edit, provide exact paths, current behavior, proposed behavior, data/auth risk, tests, and rollback method.

## Acceptance Gate

Repo Store contains an accurate provider, API, authentication, and persistence boundary map. The map explicitly notes that OandoPlanner is the only active planner context that flows through protected persistence routes.
