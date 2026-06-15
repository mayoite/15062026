#!/usr/bin/env bash
# do-deploy.sh — build a DigitalOcean App Spec with real env values pulled from
# your local .env.local, and (optionally) apply it via doctl.
#
# SECURITY: the generated spec contains live secrets. It is written to
# app.generated.yaml which is .gitignored. NEVER commit it. The committed
# config/deployment/digitalocean/app.yaml stays value-free.
#
# Usage:
#   scripts/do-deploy.sh                 # generate app.generated.yaml only
#   scripts/do-deploy.sh --apply         # generate + apply (needs doctl auth)
#   APP_ID=xxxx scripts/do-deploy.sh --apply   # update an existing app
#
# Run from the repo root. Requires .env.local in the repo root.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="$ROOT/.env.local"
OUT="$ROOT/app.generated.yaml"
APPLY="${1:-}"

[ -f "$ENV_FILE" ] || { echo "ERROR: $ENV_FILE not found." >&2; exit 1; }

# Read a key's value from .env.local (strips surrounding quotes, keeps the rest).
val() {
  local k="$1"
  # last match wins (mirror shell sourcing); tolerate spaces around '='
  local line
  line="$(grep -E "^[[:space:]]*$k[[:space:]]*=" "$ENV_FILE" | tail -1 || true)"
  [ -n "$line" ] || { echo ""; return; }
  local v="${line#*=}"
  v="${v#"${v%%[![:space:]]*}"}"   # ltrim
  printf '%s' "$v"
}

# Emit one env entry. Args: KEY SCOPE [SECRET]
emit() {
  local k="$1" scope="$2" secret="${3:-}"
  local v; v="$(val "$k")"
  if [ -z "$v" ]; then
    echo "  # WARNING: $k empty in .env.local — skipped" >&2
    return
  fi
  {
    printf -- '      - key: %s\n' "$k"
    printf -- '        scope: %s\n' "$scope"
    [ "$secret" = "SECRET" ] && printf -- '        type: SECRET\n'
    # YAML-safe: single-quote, escape embedded single quotes
    printf -- "        value: '%s'\n" "${v//\'/\'\'}"
  } >> "$OUT"
}

# Emit a literal (non-.env) value. Args: KEY SCOPE VALUE
lit() {
  {
    printf -- '      - key: %s\n' "$1"
    printf -- '        scope: %s\n' "$2"
    printf -- "        value: '%s'\n" "$3"
  } >> "$OUT"
}

cat > "$OUT" <<'YAML'
# GENERATED — contains live secrets. DO NOT COMMIT. (.gitignored)
name: claude0206
region: blr
services:
  - name: web
    build_command: npm run build
    run_command: node .next/standalone/server.js
    environment_slug: node-js
    instance_size_slug: apps-s-1vcpu-1gb
    instance_count: 1
    http_port: 3000
    health_check:
      http_path: /
      initial_delay_seconds: 20
      period_seconds: 15
      timeout_seconds: 5
      failure_threshold: 3
    envs:
YAML

# ---- BUILD-TIME (inlined into the bundle) ----
emit NEXT_PUBLIC_SUPABASE_URL            BUILD_TIME
emit NEXT_PUBLIC_SUPABASE_ANON_KEY       BUILD_TIME
emit NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY BUILD_TIME
# NEXT_PUBLIC_SITE_URL: set to the assigned app URL after first deploy, then re-run.
if [ -n "$(val NEXT_PUBLIC_SITE_URL)" ]; then emit NEXT_PUBLIC_SITE_URL BUILD_TIME; fi
if [ -n "$(val NEXT_PUBLIC_ASSET_BASE_URL)" ]; then emit NEXT_PUBLIC_ASSET_BASE_URL BUILD_TIME; fi

# ---- RUN-TIME SECRETS ----
emit SUPABASE_URL                     RUN_TIME SECRET
emit SUPABASE_SERVICE_ROLE_KEY        RUN_TIME SECRET
emit NEXT_ADMIN_SUPABASE_URL          RUN_TIME SECRET
emit NEXT_ADMIN_SUPABASE_ANON_KEY     RUN_TIME SECRET
emit SUPABASE_ADMIN_SERVICE_ROLE_KEY  RUN_TIME SECRET
emit PRODUCTS_DATABASE_URL            RUN_TIME SECRET
emit SUPABASE_AUTH_DATABASE_URL       RUN_TIME SECRET
emit OPENROUTER_API_KEY               RUN_TIME SECRET
emit GOOGLE_API_KEY                   RUN_TIME SECRET
emit NOVA_ACT_API_KEY                 RUN_TIME SECRET
emit RESEND_API_KEY                   RUN_TIME SECRET
emit CLOUDFLARE_API_TOKEN             RUN_TIME SECRET
emit CLOUDFLARE_ACCOUNT_ID            RUN_TIME SECRET
emit ADMIN_TOKEN                      RUN_TIME SECRET
emit CUSTOMER_QUERIES_ADMIN_TOKEN     RUN_TIME SECRET

# ---- RUN-TIME plain ----
emit ADMIN_EMAILS        RUN_TIME
emit EMAIL_FROM          RUN_TIME
emit STAFF_NOTIFY_EMAIL  RUN_TIME
lit  OPENROUTER_BASE_URL RUN_TIME "$(val OPENROUTER_BASE_URL)"
lit  OPENROUTER_MODEL    RUN_TIME "$(val OPENROUTER_MODEL)"
lit  NODE_ENV            RUN_TIME production

echo "Wrote $OUT" >&2

if [ "$APPLY" = "--apply" ]; then
  command -v doctl >/dev/null 2>&1 || {
    echo "ERROR: --apply needs doctl. Install: https://docs.digitalocean.com/reference/doctl/how-to/install/" >&2
    exit 1; }
  if [ -n "${APP_ID:-}" ]; then
    echo "Updating existing app $APP_ID ..." >&2
    doctl apps update "$APP_ID" --spec "$OUT"
  else
    echo "Creating new app ..." >&2
    doctl apps create --spec "$OUT"
  fi
else
  echo "Next: review $OUT, then either" >&2
  echo "  doctl apps create --spec $OUT" >&2
  echo "  (or) upload it in the DO dashboard, or re-run with --apply" >&2
fi
