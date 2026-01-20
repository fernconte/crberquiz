$ErrorActionPreference = "Stop"

$psql = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psql) {
  Write-Error "psql not found. Install PostgreSQL client tools."
  exit 1
}

$schemaPath = Join-Path $PSScriptRoot "..\\schema.sql"
$seedPath = Join-Path $PSScriptRoot "..\\seed.sql"

if ($env:DATABASE_URL) {
  & $psql.Path $env:DATABASE_URL -v ON_ERROR_STOP=1 -f $schemaPath
  & $psql.Path $env:DATABASE_URL -v ON_ERROR_STOP=1 -f $seedPath
  exit 0
}

$required = @("PGHOST", "PGUSER", "PGDATABASE")
$missing = $required | Where-Object { -not $env:$_ }
if ($missing.Count -gt 0) {
  Write-Error "Set DATABASE_URL or PGHOST, PGUSER, PGDATABASE (and optionally PGPASSWORD, PGPORT)."
  exit 1
}

$args = @(
  "-v", "ON_ERROR_STOP=1",
  "-h", $env:PGHOST,
  "-U", $env:PGUSER,
  "-d", $env:PGDATABASE
)

if ($env:PGPORT) {
  $args += @("-p", $env:PGPORT)
}

& $psql.Path @args -f $schemaPath
& $psql.Path @args -f $seedPath
