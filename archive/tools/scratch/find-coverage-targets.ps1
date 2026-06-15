$ErrorActionPreference = 'Stop'
$json = Get-Content 'results/coverage/features/coverage-summary.json' -Raw | ConvertFrom-Json

# Build a flat list: file, lines.total, lines.pct, statements.total, statements.pct
$rows = @()
foreach ($prop in $json.PSObject.Properties) {
    if ($prop.Name -eq 'total') { continue }
    $entry = $prop.Value
    $rows += [PSCustomObject]@{
        File = $prop.Name -replace [regex]::Escape((Resolve-Path '.').Path), ''
        Lines = $entry.lines.total
        LinesPct = $entry.lines.pct
        Stmts = $entry.statements.total
        StmtsPct = $entry.statements.pct
        Funcs = $entry.functions.total
        FuncsPct = $entry.functions.pct
        UncoveredLines = $entry.lines.total - $entry.lines.covered
    }
}

# High-value targets: 0% coverage, sorted by uncovered lines descending
Write-Host "=== TOP 30 ZERO-COVERAGE FILES BY SIZE (highest leverage) ==="
$rows | Where-Object { $_.LinesPct -eq 0 -and $_.Lines -gt 5 } | Sort-Object Lines -Descending | Select-Object -First 30 | ForEach-Object {
    '{0,5}  {1}' -f $_.Lines, $_.File
}

Write-Host ""
Write-Host "=== AGGREGATE TOTALS ==="
$total = $json.total
'Statements: {0}/{1} = {2}%' -f $total.statements.covered, $total.statements.total, $total.statements.pct
'Branches:   {0}/{1} = {2}%' -f $total.branches.covered, $total.branches.total, $total.branches.pct
'Functions:  {0}/{1} = {2}%' -f $total.functions.covered, $total.functions.total, $total.functions.pct
'Lines:      {0}/{1} = {2}%' -f $total.lines.covered, $total.lines.total, $total.lines.pct
