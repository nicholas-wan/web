[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [ValidateSet('build', 'verify', 'check', 'test')]
    [string]$Task = 'check',
    [switch]$Clean,
    [string]$Output = 'dist'
)

$ErrorActionPreference = 'Stop'
$buildScript = Join-Path $PSScriptRoot 'site\build.ps1'
$verifyScript = Join-Path $PSScriptRoot 'site\verify.ps1'

function Invoke-SiteBuild([bool]$UseClean) {
    & $buildScript -Output $Output -Clean:$UseClean
}

switch ($Task) {
    'build' {
        Invoke-SiteBuild -UseClean $Clean.IsPresent
    }
    'verify' {
        if ($Output -ne 'dist') { throw 'Verification currently targets the canonical dist output.' }
        & $verifyScript
    }
    'check' {
        if ($Output -ne 'dist') { throw 'The CI-equivalent check targets the canonical dist output.' }
        Invoke-SiteBuild -UseClean $true
        & $verifyScript
    }
    'test' {
        # Everything CI runs before it deploys: check, unit tests, browser tests.
        if ($Output -ne 'dist') { throw 'The browser tests serve the canonical dist output.' }
        Invoke-SiteBuild -UseClean $true
        # Verification and the unit tests need only the built dist/, so they run
        # beside the browser tests (26 Nov 2026: about 10 s off each local run).
        # Every part runs to the end; any failure fails the task afterwards.
        $browserDir = Join-Path $PSScriptRoot 'tests\browser'
        $side = Start-Job -ScriptBlock {
            param($root, $verify, $browserDir)
            Set-Location $root
            & $verify
            Set-Location $browserDir
            npm run test:unit
            if ($LASTEXITCODE -ne 0) { throw 'Unit tests failed.' }
        } -ArgumentList (Split-Path $PSScriptRoot -Parent), $verifyScript, $browserDir
        $browserFailed = $false
        Push-Location $browserDir
        try {
            npm test
            $browserFailed = $LASTEXITCODE -ne 0
        }
        finally { Pop-Location }
        $null = Wait-Job $side
        Write-Host '--- Verification and unit tests ---'
        $sideFailed = $false
        try { Receive-Job $side -ErrorAction Stop } catch { $sideFailed = $true; Write-Host $_ }
        if ($side.State -eq 'Failed') { $sideFailed = $true }
        Remove-Job $side
        if ($sideFailed) { throw 'Verification or unit tests failed.' }
        if ($browserFailed) { throw 'Browser tests failed.' }
    }
}
