[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [ValidateSet('build', 'verify', 'check')]
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
}
