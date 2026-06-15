#!/usr/bin/env pwsh
<#
.SYNOPSIS
Compare two directory trees file-by-file by modified time and byte size only.
Reports per-file whether modified time and/or byte size differ. No content read.
#>

param(
    [Parameter(Mandatory=$true)] [string] $Path1,
    [Parameter(Mandatory=$true)] [string] $Path2,
    [string[]] $SkipDirs = @("node_modules", ".git", ".next", ".turbo", "dist", "build", "coverage", ".claude", "playwright-report", "test-results"),
    [string] $OutputFile
)

function Get-FileMap([string] $root) {
    $map = @{}
    $base = $root.TrimEnd('\','/')
    $stack = [System.Collections.Stack]::new()
    $stack.Push($base)
    while ($stack.Count -gt 0) {
        $dir = $stack.Pop()
        try { $entries = Get-ChildItem -LiteralPath $dir -Force -ErrorAction Stop } catch { continue }
        foreach ($e in $entries) {
            if ($e.PSIsContainer) {
                if ($SkipDirs -contains $e.Name) { continue }
                $stack.Push($e.FullName)
            } else {
                $rel = $e.FullName.Substring($base.Length).TrimStart('\','/')
                $map[$rel] = [PSCustomObject]@{
                    Bytes    = $e.Length
                    Modified = $e.LastWriteTimeUtc
                }
            }
        }
    }
    return $map
}

Write-Host "Scanning Path1: $Path1"
$m1 = Get-FileMap $Path1
Write-Host "Scanning Path2: $Path2"
$m2 = Get-FileMap $Path2

$allKeys = @($m1.Keys) + @($m2.Keys) | Select-Object -Unique | Sort-Object

$rows = @()
$nChanged = 0; $nSame = 0; $nOnly1 = 0; $nOnly2 = 0

foreach ($rel in $allKeys) {
    $a = $m1[$rel]; $b = $m2[$rel]
    if (-not $a) { $nOnly2++; $rows += [PSCustomObject]@{ File=$rel; Status="ONLY-IN-PATH2"; BytesChanged=""; TimeChanged="" }; continue }
    if (-not $b) { $nOnly1++; $rows += [PSCustomObject]@{ File=$rel; Status="ONLY-IN-PATH1"; BytesChanged=""; TimeChanged="" }; continue }

    $bytesDiff = $a.Bytes -ne $b.Bytes
    $timeDiff  = $a.Modified -ne $b.Modified

    if ($bytesDiff -or $timeDiff) {
        $nChanged++
        $rows += [PSCustomObject]@{
            File         = $rel
            Status       = "CHANGED"
            BytesChanged = if ($bytesDiff) { "YES ($($a.Bytes) -> $($b.Bytes))" } else { "no" }
            TimeChanged  = if ($timeDiff)  { "YES ($($a.Modified.ToString('o')) -> $($b.Modified.ToString('o')))" } else { "no" }
        }
    } else {
        $nSame++
    }
}

$report = @()
$report += ("=" * 90)
$report += "META COMPARISON (modified time + byte size only)"
$report += ("=" * 90)
$report += "Path1: $Path1"
$report += "Path2: $Path2"
$report += ""
$report += "SUMMARY"
$report += ("-" * 90)
$report += "Files compared (in both):  $($nChanged + $nSame)"
$report += "  Identical (time+bytes):  $nSame"
$report += "  Changed (time or bytes): $nChanged"
$report += "Only in Path1:             $nOnly1"
$report += "Only in Path2:             $nOnly2"
$report += ""

$changedRows = $rows | Where-Object { $_.Status -eq "CHANGED" }
if ($changedRows) {
    $report += "CHANGED FILES (time or bytes differ)"
    $report += ("-" * 90)
    foreach ($r in $changedRows) {
        $report += "  $($r.File)"
        $report += "      bytes: $($r.BytesChanged)"
        $report += "      mtime: $($r.TimeChanged)"
    }
    $report += ""
}

$only1 = $rows | Where-Object { $_.Status -eq "ONLY-IN-PATH1" }
if ($only1) {
    $report += "ONLY IN PATH1"
    $report += ("-" * 90)
    $only1 | ForEach-Object { $report += "  $($_.File)" }
    $report += ""
}

$only2 = $rows | Where-Object { $_.Status -eq "ONLY-IN-PATH2" }
if ($only2) {
    $report += "ONLY IN PATH2"
    $report += ("-" * 90)
    $only2 | ForEach-Object { $report += "  $($_.File)" }
    $report += ""
}

$text = $report -join "`n"
Write-Host $text
if ($OutputFile) {
    $text | Out-File -LiteralPath $OutputFile -Encoding UTF8
    Write-Host "`nReport written to: $OutputFile"
}
