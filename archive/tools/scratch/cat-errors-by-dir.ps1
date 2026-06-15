$ErrorActionPreference = 'Stop'
$lines = Select-String -Path 'tsc-errors.txt' -Pattern ': error TS' | ForEach-Object { $_.Line }

$byDir = @{}
foreach ($line in $lines) {
    # path is everything before the first '('
    $path = ($line -split '\(')[0]
    $parts = $path -split '[\\/]'
    if ($parts.Length -ge 2) {
        $key = $parts[0] + '/' + $parts[1]
    } else {
        $key = $parts[0]
    }
    if ($byDir.ContainsKey($key)) { $byDir[$key]++ } else { $byDir[$key] = 1 }
}

$byDir.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object {
    '{0,5}  {1}' -f $_.Value, $_.Key
}
