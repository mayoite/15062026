$lines = Get-Content "$PSScriptRoot\..\..\tsc-errors.txt"
Write-Host ("TOTAL: " + $lines.Count)
Write-Host "=== TS2304 missing names (top 25) ==="
$lines | Where-Object { $_ -match 'TS2304' } | ForEach-Object {
    if ($_ -match "Cannot find name '([^']+)'") { $matches[1] }
} | Group-Object | Sort-Object Count -Descending | Select-Object -First 25 | ForEach-Object {
    '{0,5}  {1}' -f $_.Count, $_.Name
}
