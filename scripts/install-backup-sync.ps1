# Install automatic backup mirror: E:\16062026 -> E:\Goodsites\15062026
# - Scheduled task every 5 minutes (full /MIR incl. deletions)
# - Optional: -Watch starts the live file watcher in this terminal

param(
  [switch]$Watch,
  [int]$IntervalMinutes = 5
)

$ErrorActionPreference = 'Stop'

$taskName = 'Oando-Backup-Sync-16062026'
$syncScript = Join-Path $PSScriptRoot 'sync-backup-to-15062026.ps1'
$watchScript = Join-Path $PSScriptRoot 'watch-backup-sync.ps1'

if (-not (Test-Path -LiteralPath $syncScript)) {
  throw "Missing $syncScript"
}

$action = New-ScheduledTaskAction -Execute 'pwsh.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$syncScript`" -Quiet"
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) `
  -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes) `
  -RepetitionDuration (New-TimeSpan -Days 3650)
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null
Write-Host "Scheduled task registered: $taskName (every $IntervalMinutes min)"

# Run once now
& $syncScript
Write-Host "Initial sync complete."

if ($Watch) {
  & $watchScript
}