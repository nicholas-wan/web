# Helpers shared by build.ps1 and verify.ps1, so the two can never disagree.

function Get-ContentVersion([string]$Content) {
    # Line endings are normalized before hashing: git's autocrlf gives the same
    # commit CRLF on one checkout and LF on another, and without this the same
    # source produced a different ?v= locally than in CI. The hash answers "did
    # the code change", and an EOL flip is not a code change.
    $bytes = (New-Object System.Text.UTF8Encoding($false)).GetBytes($Content.Replace("`r`n", "`n"))
    $sha = [System.Security.Cryptography.SHA256]::Create()
    try { $hash = $sha.ComputeHash($bytes) } finally { $sha.Dispose() }
    return -join ($hash[0..3] | ForEach-Object { $_.ToString('x2') })
}

# SHA-256 of a file as upper-case hex, like Get-FileHash but without the
# cmdlet's per-call cost (802 discovery thumbnails in build and verify, Nov 2026).
function Get-FileSha256([string]$Path) {
    $sha = [System.Security.Cryptography.SHA256]::Create()
    $stream = [IO.File]::OpenRead($Path)
    try { return [BitConverter]::ToString($sha.ComputeHash($stream)).Replace('-', '') }
    finally { $stream.Dispose(); $sha.Dispose() }
}

# Published CSS ships without comments (about a third of its gzip size, Nov 2026).
# The sources keep them; /*! ... */ comments (the icon licence) are kept. Quoted
# strings are matched first so a "/*" inside one is never treated as a comment.
function Remove-CssComments([string]$Css) {
    $stripped = [regex]::Replace($Css, '("(?:\\.|[^"\\])*"|''(?:\\.|[^''\\])*'')|/\*(?!!)[\s\S]*?\*/', { param($m) $m.Groups[1].Value })
    $stripped = [regex]::Replace($stripped, '(?m)^[ \t]+$', '')
    return ([regex]::Replace($stripped, '(\r?\n){3,}', "`n`n")).Trim() + "`n"
}
