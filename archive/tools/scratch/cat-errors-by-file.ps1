$ErrorActionPreference = 'Stop'
$lines = Select-String -Path 'tsc-errors.txt' -Pattern ': error TS' | ForEach-Object { $_.Line }

$byFile = @{}
foreach ($line in $lines) {
    $path = ($line -split '\(')[0]
    if ($byFile.ContainsKey($path)) { $byFile[$path]++ } else { $byFile[$path] = 1 }
}

$byFile.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object {
    '{0,5}  {1}' -f $_.Value, $_.Key
}
