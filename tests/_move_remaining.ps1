# Move .test.ts files with vi.mock to integration/
$integrationFiles = @()
Get-ChildItem "E:\16062026\tests\*.test.ts" | ForEach-Object {
  $content = Get-Content $_.FullName -Raw
  if ($content -match 'vi\.mock') {
    $integrationFiles += $_.Name
    Move-Item -Path $_.FullName -Destination "E:\16062026\tests\integration\" -Force
  }
}
Write-Host "Moved to integration/: $($integrationFiles.Count) files"

# Move remaining .test.ts to unit/
$unitFiles = @()
Get-ChildItem "E:\16062026\tests\*.test.ts" | ForEach-Object {
  $unitFiles += $_.Name
  Move-Item -Path $_.FullName -Destination "E:\16062026\tests\unit\" -Force
}
Write-Host "Moved to unit/: $($unitFiles.Count) files"
