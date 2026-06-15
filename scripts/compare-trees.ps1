#!/usr/bin/env pwsh
<#
.SYNOPSIS
Compare two directory trees file-by-file, reporting differences.

.PARAMETER Path1
First directory to compare
.PARAMETER Path2
Second directory to compare
.PARAMETER SkipDirs
Directories to skip (default: node_modules, .git, .next, .turbo, dist, build, coverage, .claude)
.PARAMETER OutputFile
Optional file to write the report to
#>

param(
    [Parameter(Mandatory=$true)]
    [string] $Path1,

    [Parameter(Mandatory=$true)]
    [string] $Path2,

    [string[]] $SkipDirs = @("node_modules", ".git", ".next", ".turbo", "dist", "build", "coverage", ".claude", "playwright-report", "test-results"),

    [string] $OutputFile
)

$skip_ext = @(".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".ico", ".svg",
              ".pdf", ".zip", ".gz", ".woff", ".woff2", ".ttf", ".otf", ".eot",
              ".mp4", ".webm", ".mov", ".lock", ".tsbuildinfo", ".jar", ".class",
              ".o", ".a", ".so", ".dylib")

$results = @{
    identical       = @()
    different       = @()
    only_in_path1   = @()
    only_in_path2   = @()
    binary_skipped  = @()
    total_scanned   = 0
}

function Should-Skip-Dir([string] $name) {
    return $SkipDirs -contains $name
}

function Should-Skip-Ext([string] $ext) {
    return $skip_ext -contains $ext.ToLower()
}

function Is-Binary([string] $file) {
    try {
        $bytes = [System.IO.File]::ReadAllBytes($file)
        # Check for NUL byte (binary indicator)
        return $bytes -contains 0
    } catch {
        return $true
    }
}

function Get-RelativePath([string] $full, [string] $base) {
    if ($full.StartsWith($base)) {
        return $full.Substring($base.Length).TrimStart('\', '/')
    }
    return $full
}

function Walk-Tree([string] $root, [string] $base_for_rel) {
    $fileMap = @{}

    function recurse([string] $dir) {
        try {
            $entries = Get-ChildItem -LiteralPath $dir -ErrorAction Stop
        } catch {
            return
        }

        foreach ($entry in $entries) {
            if (Should-Skip-Dir $entry.Name) { continue }

            if ($entry.PSIsContainer) {
                recurse $entry.FullName
            } else {
                $relPath = Get-RelativePath $entry.FullName $base_for_rel
                $fileMap[$relPath] = $entry.FullName
            }
        }
    }

    recurse $root
    return $fileMap
}

Write-Host "Comparing trees..."
Write-Host "  Path1: $Path1"
Write-Host "  Path2: $Path2"
Write-Host ""

$map1 = Walk-Tree $Path1 ($Path1 -replace '\\$', '')
$map2 = Walk-Tree $Path2 ($Path2 -replace '\\$', '')

$all_keys = @($map1.Keys) + @($map2.Keys) | Select-Object -Unique | Sort-Object

foreach ($relPath in $all_keys) {
    $results.total_scanned += 1

    $file1 = $map1[$relPath]
    $file2 = $map2[$relPath]

    if (-not $file1) {
        $results.only_in_path2 += $relPath
        continue
    }
    if (-not $file2) {
        $results.only_in_path1 += $relPath
        continue
    }

    # Skip binary extensions without reading
    if (Should-Skip-Ext ([System.IO.Path]::GetExtension($relPath))) {
        $results.binary_skipped += $relPath
        continue
    }

    # Check if binary
    if (Is-Binary $file1) {
        $results.binary_skipped += $relPath
        continue
    }

    # Compare content
    try {
        $content1 = [System.IO.File]::ReadAllText($file1)
        $content2 = [System.IO.File]::ReadAllText($file2)

        if ($content1 -eq $content2) {
            $results.identical += $relPath
        } else {
            $results.different += $relPath
        }
    } catch {
        $results.different += "$relPath (read error)"
    }
}

# Generate report
$report = @()
$report += "═" * 80
$report += "FILE COMPARISON REPORT"
$report += "═" * 80
$report += ""
$report += "Path 1: $Path1"
$report += "Path 2: $Path2"
$report += ""
$report += "SUMMARY"
$report += "─" * 80
$report += "Total files scanned:      $($results.total_scanned)"
$report += "Identical:                $($results.identical.Count)"
$report += "Different content:        $($results.different.Count)"
$report += "Only in Path 1:           $($results.only_in_path1.Count)"
$report += "Only in Path 2:           $($results.only_in_path2.Count)"
$report += "Binary/skipped:           $($results.binary_skipped.Count)"
$report += ""

if ($results.different.Count -gt 0) {
    $report += "DIFFERENT FILES"
    $report += "─" * 80
    $results.different | ForEach-Object { $report += "  $_" }
    $report += ""
}

if ($results.only_in_path1.Count -gt 0) {
    $report += "ONLY IN PATH 1"
    $report += "─" * 80
    $results.only_in_path1 | ForEach-Object { $report += "  $_" }
    $report += ""
}

if ($results.only_in_path2.Count -gt 0) {
    $report += "ONLY IN PATH 2"
    $report += "─" * 80
    $results.only_in_path2 | ForEach-Object { $report += "  $_" }
    $report += ""
}

$report_text = $report -join "`n"
Write-Host $report_text

if ($OutputFile) {
    $report_text | Out-File -LiteralPath $OutputFile -Encoding UTF8
    Write-Host ""
    Write-Host "Report written to: $OutputFile"
}
