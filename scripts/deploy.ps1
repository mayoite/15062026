# deploy.ps1 — Windows wrapper for the DigitalOcean deploy.
#
# What it does:
#   1. Checks doctl is installed and authenticated.
#   2. Runs scripts/do-deploy.sh through Git Bash, which reads .env.local,
#      generates app.generated.yaml (gitignored), and applies it to DO.
#
# Your part (one time):
#   winget install DigitalOcean.Doctl
#   doctl auth init        # paste your DO API token here, on your machine
#
# Then just run this file:
#   pwsh scripts/deploy.ps1                 # create a new app
#   pwsh scripts/deploy.ps1 -AppId <id>     # update an existing app
#
# The DO token lives only in doctl's local config. Secrets come from .env.local.
# Nothing secret is committed.

param(
    [string]$AppId = ""
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $RepoRoot

Write-Host "==> Repo: $RepoRoot" -ForegroundColor Cyan

# --- 1. doctl present? ---
$doctl = Get-Command doctl -ErrorAction SilentlyContinue
if (-not $doctl) {
    Write-Host "doctl is not installed." -ForegroundColor Yellow
    Write-Host "Install it once with:" -ForegroundColor Yellow
    Write-Host "    winget install DigitalOcean.Doctl"
    Write-Host "Then authenticate (paste your DO API token):"
    Write-Host "    doctl auth init"
    exit 1
}

# --- 2. doctl authenticated? ---
try {
    doctl account get --format Email --no-header | Out-Null
} catch {
    Write-Host "doctl is installed but not authenticated." -ForegroundColor Yellow
    Write-Host "Run this and paste your DO API token:" -ForegroundColor Yellow
    Write-Host "    doctl auth init"
    exit 1
}
Write-Host "==> doctl authenticated." -ForegroundColor Green

# --- 3. .env.local present? ---
if (-not (Test-Path (Join-Path $RepoRoot ".env.local"))) {
    Write-Host "ERROR: .env.local not found in repo root." -ForegroundColor Red
    exit 1
}

# --- 4. locate Git Bash to run the .sh ---
$bash = Get-Command bash -ErrorAction SilentlyContinue
if (-not $bash) {
    foreach ($p in @("C:\Program Files\Git\bin\bash.exe", "C:\Program Files (x86)\Git\bin\bash.exe")) {
        if (Test-Path $p) { $bash = @{ Source = $p }; break }
    }
}
if (-not $bash) {
    Write-Host "ERROR: bash not found (install Git for Windows)." -ForegroundColor Red
    exit 1
}

# --- 5. run the generator/applier ---
$script = "scripts/do-deploy.sh"
Write-Host "==> Generating spec from .env.local and applying to DO..." -ForegroundColor Cyan

if ($AppId) {
    $env:APP_ID = $AppId
    Write-Host "    Updating existing app: $AppId"
} else {
    Write-Host "    Creating a new app"
}

& $bash.Source $script "--apply"
$code = $LASTEXITCODE

if ($code -eq 0) {
    Write-Host "==> Deploy command finished. Check status with: doctl apps list" -ForegroundColor Green
    Write-Host "    Reminder: after the URL is assigned, set NEXT_PUBLIC_SITE_URL in .env.local and re-run." -ForegroundColor Yellow
    Write-Host "    Reminder: run the planner_saves migration against prod Supabase." -ForegroundColor Yellow
} else {
    Write-Host "==> Deploy script exited with code $code." -ForegroundColor Red
}
exit $code
