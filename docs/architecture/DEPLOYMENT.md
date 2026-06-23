# Deployment Architecture

## Deployment Topology

```mermaid
flowchart TB
    subgraph Edge["Edge Layer"]
        Cloudflare["Cloudflare CDN\n- Edge caching\n- DDoS protection\n- Image optimization"]
    end

    subgraph AppLayer["Application Layer"]
        Vercel["Vercel\n- Next.js 16 SSR/SSG\n- Edge Functions\n- Preview deployments"]
    end

    subgraph DataLayer["Data Layer"]
        Supabase["Supabase\n- Auth\n- Catalog DB\n- RLS policies"]
        DOPostgres["DigitalOcean\nManaged Postgres\n- Plans\n- Teams\n- Audit events"]
        DOSpaces["DigitalOcean Spaces\n- Product images\n- 3D models\n- S3-compatible"]
    end

    subgraph External["External Services"]
        OpenRouter["OpenRouter\n- AI recommendations\n- AI advisor"]
        Resend["Resend\n- Transactional email"]
    end

    Cloudflare --> Vercel
    Vercel --> Supabase
    Vercel --> DOPostgres
    Vercel --> DOSpaces
    Vercel --> OpenRouter
    Vercel --> Resend
```

## Vercel Configuration

**Build settings:**
- Framework: Next.js 16
- Build command: `npm run build`
- Output directory: `.next`
- Node.js version: 20+

**Environment variables (production):**
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key
- `SUPABASE_ADMIN_SERVICE_ROLE_KEY` — Server-side service role
- `NEXT_ADMIN_SUPABASE_URL` — Admin Supabase URL
- `DATABASE_URL` — DigitalOcean Postgres connection string
- `ORIGIN_ENDPOINT` — DigitalOcean Spaces CDN
- `OPENROUTER_API_KEY_PRIMARY` and `OPENROUTER_API_KEY_BACKUP` — AI model access
- `RESEND_API_KEY` — Email sending

## Self-Hosted Configuration

For non-Vercel deployments:

```bash
# Build
npm ci
npm run build

# Start
npm start

# Or with custom port
PORT=3000 npm start
```

**Requirements:**
- Node.js 20+
- PostgreSQL 15+ (for Drizzle tables)
- Supabase project (for auth + catalog)
- S3-compatible storage (for assets)

## CI/CD Pipeline

```mermaid
flowchart LR
    Push["Git Push"] --> Typecheck["TypeScript\nCheck"]
    Typecheck --> Lint["ESLint\nCheck"]
    Lint --> Tests["Vitest\nUnit + Integration"]
    Tests --> E2E["Playwright\nE2E Tests"]
    E2E --> Build["Next.js\nBuild"]
    Build --> Deploy["Deploy to\nVercel"]
```

**Quality gates:**
- `npm run typecheck` — Zero TypeScript errors
- `npm run lint` — Zero ESLint warnings
- `npm run test` — All unit/integration tests pass
- `npm run test:e2e` — Playwright E2E tests pass
- `npm run build` — Production build succeeds

## Database Management

### Supabase (Auth + Catalog)

- Migrations: `platform/supabase/migrations/`
- Applied via: Supabase CLI or dashboard
- RLS policies enforced on all tables

### DigitalOcean Postgres (Drizzle)

- Schema: `platform/drizzle/schema.ts`
- Tables: profiles, plans, teams, team_members, invites, audit_events
- Connection: Via `DATABASE_URL` environment variable
- Pooling: Lazy initialization with Proxy pattern

## Monitoring

- **Vercel Analytics**: Core Web Vitals, page speed
- **Supabase Dashboard**: Auth events, query performance
- **DigitalOcean**: Database metrics, connection pooling
- **Cloudflare**: Traffic analytics, security events

## Security

- All secrets in environment variables (never committed)
- Supabase RLS for row-level data access
- CSRF protection on mutation routes
- XSS sanitization on all JSON-LD injection
- HttpOnly secure cookies for sessions
- Rate limiting on public API endpoints

## Scaling Considerations

- **Static pages**: ISR with revalidation for product pages
- **API routes**: Serverless functions (auto-scaling on Vercel)
- **Database**: Connection pooling via Supabase PgBouncer
- **Assets**: CDN-distributed via Cloudflare + DigitalOcean Spaces
- **3D/Canvas**: Client-side only, no server impact

## Disaster Recovery

- **Supabase**: Automated daily backups, point-in-time recovery
- **DigitalOcean Postgres**: Automated backups with 7-day retention
- **DigitalOcean Spaces**: Versioning enabled, cross-region replication
- **Vercel**: Deployment rollback via dashboard or CLI
