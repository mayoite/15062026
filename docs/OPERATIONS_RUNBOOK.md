# Operations Runbook

**Last updated:** 2026-06-20

Procedures for deploying, backing up, and recovering the Oando Platform.

## Deployment

### Production Deployment (Vercel)

```powershell
# 1. Run the full release gate locally
npm.cmd run release:gate

# 2. If all checks pass, deploy to production
npm.cmd run vercel:prod
```

The release gate runs: `lint:secrets → lint → typecheck → test → build → test:a11y → test:e2e:nav → test:planner-catalog → test:coverage → test:coverage:site`

### Preview Deployment

```powershell
npm.cmd run vercel:preview
```

### Rollback

Vercel rollbacks are performed via the Vercel dashboard:
1. Go to the project on vercel.com
2. Navigate to Deployments
3. Find the last known-good deployment
4. Click "Instant Rollback"

Alternatively, redeploy a previous commit:
```powershell
git checkout <known-good-commit>
npm.cmd run vercel:prod
```

## Database

### Backup

```powershell
# Full Supabase backup (tables + storage)
npm.cmd run supabase:backup

# Backup dropped tables before destructive migrations
npm.cmd run db:backup-dropped
```

### Apply Migrations

```powershell
# Apply all pending migrations to the primary database
npm.cmd run db:apply

# Apply admin schema migrations
npm.cmd run db:apply:admin
```

### Restore

Supabase restores are performed via the Supabase dashboard:
1. Go to Database → Backups
2. Select the backup point
3. Click "Restore"

For table-level restores from the dropped-tables backup:
```powershell
npx tsx scripts/db_backup_dropped_tables.ts --restore
```

### Sync Drizzle Schema

```powershell
# Sync Drizzle schema with Supabase database
npm.cmd run db:sync-drizzle

# Generate TypeScript types from Supabase
npm.cmd run db:types
```

### Advisors

```powershell
# Run all database advisors
npm.cmd run db:advisors

# Security-focused advisors
npm.cmd run db:advisors:security

# Performance-focused advisors
npm.cmd run db:advisors:performance

# Admin database advisors
npm.cmd run db:advisors:admin
```

## Incident Response

### Planner Not Loading

1. Check if `/planner` returns 200 — if not, check Vercel deployment status
2. Check browser console for WebGL errors — 3D viewer has a fallback mode
3. Check `PlannerErrorBoundary` — if triggered, user sees "Try again" button
4. Check IndexedDB — planner drafts are stored locally; clearing IndexedDB resets the planner

### Auth Failures

1. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
2. Check Supabase dashboard for auth service status
3. Guest mode still works without auth — users can access `/planner` as guests

### Database Connection Issues

1. Run `npm.cmd run db:test` to verify connectivity
2. Check Supabase dashboard for database status
3. If connection pool exhausted, reduce concurrent requests or increase pool size

### Catalog Images Not Loading

1. Run `npm.cmd run assets:cdn:audit` to check for broken CDN paths
2. Run `npm.cmd run assets:cdn:fix -- --apply` to fix broken paths
3. Check R2 bucket `oando-asset-cdn` for missing assets

## Monitoring

### Health Checks

- **Site:** `GET /` should return 200
- **Planner:** `GET /planner` should return 200
- **API:** `GET /api/health` (if implemented) should return 200
- **Sitemap:** `GET /sitemap.xml` should return valid XML

### Launch Validation

```powershell
# Validate environment variables before launch
npm.cmd run launch:env

# Run launch smoke tests
npm.cmd run launch:smoke

# Audit hosted runtime
npm.cmd run audit:hosted:runtime
```

### Recovery State

```powershell
# Generate a recovery snapshot
npm.cmd run recovery:snapshot

# Watch recovery state in real-time
npm.cmd run recovery:watch
```

## Asset Management

### CDN Assets

```powershell
# Upload catalog assets to R2
npm.cmd run assets:cdn:upload

# Incremental upload (skip existing)
npm.cmd run assets:cdn:upload:incremental

# Download CDN assets locally
npm.cmd run assets:cdn:catalog

# Audit for broken CDN paths
npm.cmd run assets:cdn:audit

# Fix broken CDN paths
npm.cmd run assets:cdn:fix

# Sync vendor CDN assets
npm.cmd run assets:cdn:sync
```

### Catalog Management

```powershell
# Ingest planner catalog
npm.cmd run catalog:ingest

# Generate blocks QA
npm.cmd run catalog:blocks:qa

# Organize catalog images (dry run)
npm.cmd run catalog:organize:dry

# Organize catalog images (apply)
npm.cmd run catalog:organize:apply

# Audit product quality
npm.cmd run audit:products:quality
```
