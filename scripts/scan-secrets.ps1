param(
  [switch]$Ci
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$pathExcludes = @(
  '.git/',
  'node_modules/',
  '.next/',
  'dist/',
  'build/',
  '.turbo/'
)

$fileExcludes = @(
  'scripts/scan-secrets.ps1'
)

$sourcePatterns = @(
  @{ Name = 'AWS access key'; Regex = 'AKIA[0-9A-Z]{16}' },
  @{ Name = 'GitHub token'; Regex = 'gh[pousr]_[A-Za-z0-9_]{20,}' },
  @{ Name = 'Stripe secret key'; Regex = 'sk_(live|test)_[A-Za-z0-9]{8,}' },
  @{ Name = 'Razorpay live key'; Regex = 'rk_live_[A-Za-z0-9]{8,}' },
  @{ Name = 'Slack token'; Regex = 'xox[baprs]-[A-Za-z0-9-]{10,}' },
  @{ Name = 'Supabase service role marker'; Regex = 'service_role' },
  @{ Name = 'Private key block'; Regex = '-----BEGIN [A-Z ]*PRIVATE KEY-----' },
  @{ Name = 'Database URL with inline password'; Regex = '(postgres|postgresql|mysql|mongodb(\+srv)?|redis)://[^/\s:@]+:[^@\s]+@' },
  @{ Name = 'Credential-like string assignment'; Regex = '(?i)(secret|token|password|api[_-]?key|client[_-]?secret)[A-Za-z0-9_]*\s*[:=]\s*["''][^"'']{8,}["'']' }
)

$historyPatterns = @(
  @{ Name = 'AWS access key'; Regex = 'AKIA[0-9A-Z]{16}' },
  @{ Name = 'GitHub token'; Regex = 'gh[pousr]_[A-Za-z0-9_]{20,}' },
  @{ Name = 'Stripe secret key'; Regex = 'sk_(live|test)_[A-Za-z0-9]{8,}' },
  @{ Name = 'Razorpay live key'; Regex = 'rk_live_[A-Za-z0-9]{8,}' },
  @{ Name = 'Slack token'; Regex = 'xox[baprs]-[A-Za-z0-9-]{10,}' },
  @{ Name = 'Supabase service role marker'; Regex = 'service_role' },
  @{ Name = 'Private key block'; Regex = '-----BEGIN [A-Z ]*PRIVATE KEY-----' },
  @{ Name = 'Database URL with inline password'; Regex = '(postgres|postgresql|mysql|mongodb(\+srv)?|redis)://[^/\s:@]+:[^@\s]+@' }
)

$historyAllowlist = @(
  '80bcddef9cda1709bde9f4816d5fdcb3a1457855'
)

function Invoke-Rg {
  param(
    [string]$Regex
  )

  $args = @('-n', '--hidden', '--no-heading')
  foreach ($exclude in $pathExcludes) {
    $args += @('-g', "!$exclude**")
  }
  foreach ($exclude in $fileExcludes) {
    $args += @('-g', "!$exclude")
  }
  $args += @('-g', '!.env*', '-e', $Regex, '.')

  $output = & rg @args 2>$null
  if ($LASTEXITCODE -eq 1) {
    return @()
  }
  if ($LASTEXITCODE -ne 0) {
    throw "rg failed for pattern: $Regex"
  }

  return $output
}

$sourceFindings = New-Object System.Collections.Generic.List[string]
foreach ($pattern in $sourcePatterns) {
  $matches = Invoke-Rg -Regex $pattern.Regex
  foreach ($match in $matches) {
    $sourceFindings.Add("[source] $($pattern.Name): $match")
  }
}

$historyFindings = New-Object System.Collections.Generic.List[string]
foreach ($pattern in $historyPatterns) {
  $matches = git log --all --extended-regexp -G $pattern.Regex --format='%H %s'
  if ($LASTEXITCODE -ne 0) {
    throw "git log failed for pattern: $($pattern.Name)"
  }

  foreach ($match in ($matches | Where-Object {
    $_ -and
    $_.Trim() -and
    ($historyAllowlist -notcontains (($_ -split ' ')[0]))
  })) {
    $historyFindings.Add("[history] $($pattern.Name): $match")
  }
}

if ($sourceFindings.Count -eq 0 -and $historyFindings.Count -eq 0) {
  Write-Host 'Secret scan passed with no findings.'
  exit 0
}

Write-Host 'Secret scan found potential leaks:'
foreach ($finding in ($sourceFindings + $historyFindings | Sort-Object -Unique)) {
  Write-Host $finding
}

if ($Ci) {
  Write-Error 'Secret scan failed.'
} else {
  exit 1
}
