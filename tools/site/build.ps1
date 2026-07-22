param(
    [string]$Output = "dist",
    [switch]$Clean
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$out = Join-Path $root $Output
Add-Type -AssemblyName System.Drawing
$navigationPartialPath = Join-Path $root "partials\site-navigation.html"
if (-not (Test-Path -LiteralPath $navigationPartialPath)) { throw "Missing shared navigation partial: $navigationPartialPath" }
$navigationTemplate = Get-Content -LiteralPath $navigationPartialPath -Raw -Encoding UTF8
$travelJournalPartialPath = Join-Path $root "partials\travel-journal.html"
if (-not (Test-Path -LiteralPath $travelJournalPartialPath)) { throw "Missing shared travel journal partial: $travelJournalPartialPath" }
$travelJournalTemplate = Get-Content -LiteralPath $travelJournalPartialPath -Raw -Encoding UTF8
$imageDimensionCachePath = Join-Path $root '.cache\site-image-dimensions.json'
$imageDimensionCache = @{}
$imageDimensionCacheDirty = $false
$sourceImageIndex = @{}
foreach ($imageSourceRoot in @((Join-Path $root 'images'), (Join-Path $root 'images-webp'))) {
    if (Test-Path -LiteralPath $imageSourceRoot) {
        foreach ($imageFile in Get-ChildItem -LiteralPath $imageSourceRoot -Recurse -File) {
            $sourceImageIndex[$imageFile.FullName.ToLowerInvariant()] = $imageFile
        }
    }
}
if (Test-Path -LiteralPath $imageDimensionCachePath) {
    try {
        foreach ($entry in @(Get-Content -LiteralPath $imageDimensionCachePath -Raw -Encoding UTF8 | ConvertFrom-Json)) {
            $imageDimensionCache[$entry.Path] = $entry
        }
    } catch {
        Write-Warning "Ignoring invalid image dimension cache: $imageDimensionCachePath"
    }
}

function Write-Utf8([string]$Path, [string]$Content) {
    $utf8 = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Content, $utf8)
}

function Add-AttributeToImgTag([string]$Tag, [string]$Attribute) {
    (($Tag -replace '\s*/?>$', '') + ' ' + $Attribute + ' />')
}

function Get-WebpDimensions([string]$Path) {
    # System.Drawing cannot decode WebP, so it returns nothing for these files.
    # That silently cost every .webp image its intrinsic width/height (layout
    # shift) and its srcset (full-size images to phones). The dimensions live in
    # the RIFF header, so read them directly. Verified against Pillow on all 114
    # webp files in the repo. Covers VP8X (extended), VP8 (lossy), VP8L
    # (lossless); anything else returns $null and falls back to the old path.
    try {
        $bytes = New-Object byte[] 40
        $stream = [System.IO.File]::OpenRead($Path)
        try { $read = $stream.Read($bytes, 0, 40) } finally { $stream.Dispose() }
        if ($read -lt 30) { return $null }
        $ascii = [System.Text.Encoding]::ASCII
        if ($ascii.GetString($bytes, 0, 4) -ne 'RIFF' -or $ascii.GetString($bytes, 8, 4) -ne 'WEBP') { return $null }
        # Every shift casts to [int] first: PowerShell's -shl returns the type of
        # its LEFT operand, so [byte]4 -shl 8 wraps to 0 and silently drops the
        # high byte, yielding 176x64 for a 1200x1600 image.
        $format = $ascii.GetString($bytes, 12, 4)
        if ($format -eq 'VP8X') {
            $w = ([int]$bytes[24] -bor ([int]$bytes[25] -shl 8) -bor ([int]$bytes[26] -shl 16)) + 1
            $h = ([int]$bytes[27] -bor ([int]$bytes[28] -shl 8) -bor ([int]$bytes[29] -shl 16)) + 1
            return @{ Width = $w; Height = $h }
        }
        if ($format -eq 'VP8 ') {
            if ($bytes[23] -ne 0x9D -or $bytes[24] -ne 0x01 -or $bytes[25] -ne 0x2A) { return $null }
            $w = (([int]$bytes[26] -bor ([int]$bytes[27] -shl 8)) -band 0x3FFF)
            $h = (([int]$bytes[28] -bor ([int]$bytes[29] -shl 8)) -band 0x3FFF)
            return @{ Width = $w; Height = $h }
        }
        if ($format -eq 'VP8L') {
            if ($bytes[20] -ne 0x2F) { return $null }
            $n = [int]$bytes[21] -bor ([int]$bytes[22] -shl 8) -bor ([int]$bytes[23] -shl 16) -bor ([int]$bytes[24] -shl 24)
            return @{ Width = ($n -band 0x3FFF) + 1; Height = (($n -shr 14) -band 0x3FFF) + 1 }
        }
        return $null
    } catch { return $null }
}

function Get-SourceImageInfo([string]$Path, [hashtable]$Index) {
    if (-not $Path) { return $null }
    return $Index[[IO.Path]::GetFullPath($Path).ToLowerInvariant()]
}

function Get-CachedImageDimensions([string]$Path, [hashtable]$SourceIndex) {
    $info = Get-SourceImageInfo $Path $SourceIndex
    if (-not $info) { return $null }
    $key = $info.FullName.ToLowerInvariant()
    $cached = $script:imageDimensionCache[$key]
    if ($cached -and $cached.Length -eq $info.Length -and $cached.LastWriteTicks -eq $info.LastWriteTimeUtc.Ticks) {
        return @{ Width = [int]$cached.Width; Height = [int]$cached.Height }
    }

    try {
        if ($Path -match '\.webp$') {
            $dimensions = Get-WebpDimensions $Path
        } else {
            $loadedImage = [System.Drawing.Image]::FromFile($Path)
            try { $dimensions = @{ Width = $loadedImage.Width; Height = $loadedImage.Height } }
            finally { $loadedImage.Dispose() }
        }
        if ($dimensions) {
            $script:imageDimensionCache[$key] = [pscustomobject]@{
                Path = $key
                Length = $info.Length
                LastWriteTicks = $info.LastWriteTimeUtc.Ticks
                Width = $dimensions.Width
                Height = $dimensions.Height
            }
            $script:imageDimensionCacheDirty = $true
        }
        return $dimensions
    } catch {
        return $null
    }
}

function Add-ImagePerformanceAttributes([string]$Markup, [string]$ImageRoot, [hashtable]$SourceIndex) {
    $state = @{ Counter = 0 }
    return [regex]::Replace($Markup, '<img\b[^>]*>', {
        param($match)
        $tag = $match.Value
        $isJournalBanner = $tag -match 'class="[^"]*\bjournal-banner\b'
        $srcMatch = [regex]::Match($tag, 'src="([^"]+)"')
        if (-not $srcMatch.Success -or $srcMatch.Groups[1].Value -match '^(https?:|data:)') { return $tag }
        $relative = $srcMatch.Groups[1].Value.Replace('/', '\')
        $path = Join-Path $ImageRoot ($relative -replace '^images\\', '')
        if (-not (Get-SourceImageInfo $path $SourceIndex)) {
            $webpRootPath = Join-Path (Split-Path $ImageRoot -Parent) 'images-webp'
            $bare = $relative -replace '^images\\', ''
            if ($relative -match '\.webp$') {
                $path = Join-Path $webpRootPath $bare
            } elseif ($relative -match '\.(jpg|jpeg)$') {
                # The markup still names the .jpg, but the original was removed once a
                # webp replacement existed (see $webpMap). Without this fallback the
                # build finds no file, so those images ship with no intrinsic
                # width/height and no srcset — the house gallery lost both that way.
                $path = Join-Path $webpRootPath ([IO.Path]::ChangeExtension($bare, '.webp'))
            }
        }
        $dimensions = Get-CachedImageDimensions $path $SourceIndex
        if ($dimensions) {
            # Emit intrinsic width/height on every image, including masonry
            # bricks. With CSS `.content-image { width: 100% }` and height auto,
            # the attributes only supply an aspect ratio, so the browser reserves
            # each image's space before it loads. Without this the banner jumps
            # ~500px on load, masonry columns rebalance as lazy images arrive,
            # and anchor jumps drift on long journals.
            if ($tag -notmatch '\bwidth=') { $tag = Add-AttributeToImgTag $tag ('width="{0}"' -f $dimensions.Width) }
            if ($tag -notmatch '\bheight=') { $tag = Add-AttributeToImgTag $tag ('height="{0}"' -f $dimensions.Height) }
            if ($relative -match '\.(jpg|jpeg|webp)$' -and $tag -notmatch '\bsrcset=') {
                # Follow the RESOLVED file, not the reference: a .jpg ref that fell
                # back to a webp replacement must look for -480.webp, not -480.jpg.
                # .jpeg sources keep the historical -480.jpg naming.
                $variantSuffix = if ($path -match '\.webp$') { '.webp' } else { '.jpg' }
                $originalSource = "$($srcMatch.Groups[1].Value) $($dimensions.Width)w"
                $sources = @()
                $variant480 = [IO.Path]::Combine([IO.Path]::GetDirectoryName($path), ([IO.Path]::GetFileNameWithoutExtension($path) + '-480' + $variantSuffix))
                $variant800 = [IO.Path]::Combine([IO.Path]::GetDirectoryName($path), ([IO.Path]::GetFileNameWithoutExtension($path) + '-800' + $variantSuffix))
                $has480 = $dimensions.Width -gt 480 -and [bool](Get-SourceImageInfo $variant480 $SourceIndex)
                $has800 = $dimensions.Width -gt 800 -and [bool](Get-SourceImageInfo $variant800 $SourceIndex)
                if ($has480) {
                    $sources += "$($srcMatch.Groups[1].Value -replace '\.(jpg|jpeg|webp)$', ('-480' + $variantSuffix)) 480w"
                }
                if (-not $has480) { $sources += $originalSource }
                if ($has800) {
                    $sources += "$($srcMatch.Groups[1].Value -replace '\.(jpg|jpeg|webp)$', ('-800' + $variantSuffix)) 800w"
                }
                if ($has480) { $sources += $originalSource }
                if ($sources.Count -gt 1) {
                    $tag = Add-AttributeToImgTag $tag ('srcset="{0}"' -f ($sources -join ', '))
                    if ($tag -notmatch '\bsizes=') {
                        $sizes = if ($isJournalBanner) { '(max-width: 736px) 100vw, 1152px' } else { '(max-width: 736px) 100vw, 800px' }
                        $tag = Add-AttributeToImgTag $tag ('sizes="{0}"' -f $sizes)
                    }
                }
            }
        }
        if ($tag -notmatch '\bdecoding=') { $tag = Add-AttributeToImgTag $tag 'decoding="async"' }
        if ($tag -notmatch '\bloading=') {
            if ($isJournalBanner -or $state.Counter -eq 0) { $tag = Add-AttributeToImgTag $tag 'loading="eager" fetchpriority="high"' }
            else { $tag = Add-AttributeToImgTag $tag 'loading="lazy"' }
        }
        $state.Counter++
        return $tag
    })
}

function Normalize-MissingJpegReferences([string]$Markup, [string]$ImageRoot) {
    return [regex]::Replace($Markup, 'src="(images/[^"?]+)\.jpeg"', {
        param($match)
        $relative = $match.Groups[1].Value + '.jpeg'
        $path = Join-Path $ImageRoot ($relative -replace '^images/', '')
        $jpgPath = [IO.Path]::ChangeExtension($path, '.jpg')
        if (-not (Test-Path -LiteralPath $path) -and (Test-Path -LiteralPath $jpgPath)) {
            return 'src="' + $match.Groups[1].Value + '.jpg"'
        }
        return $match.Value
    })
}

if ($Clean -and (Test-Path -LiteralPath $out)) {
    # Keep the output directory itself so a local preview process with that
    # directory open cannot prevent an otherwise clean rebuild.
    Get-ChildItem -LiteralPath $out -Force | Remove-Item -Recurse -Force
}
New-Item -ItemType Directory -Path $out -Force | Out-Null

function Sync-Directory([string]$Source, [string]$Destination) {
    New-Item -ItemType Directory -Path $Destination -Force | Out-Null
    if ($Clean) {
        Get-ChildItem -LiteralPath $Source -Force | Copy-Item -Destination $Destination -Recurse -Force
    } else {
        & robocopy $Source $Destination /E /XO /FFT /NFL /NDL /NJH /NJS /NP | Out-Null
        if ($LASTEXITCODE -gt 7) { throw "Failed to sync $Source to $Destination (robocopy exit $LASTEXITCODE)." }
    }
}

function Copy-ReferencedImages([string]$OutputRoot, [string]$ImageRoot, [string]$WebpRoot, [hashtable]$SourceIndex) {
    $references = New-Object 'System.Collections.Generic.HashSet[string]' ([System.StringComparer]::OrdinalIgnoreCase)
    $scanFiles = Get-ChildItem -LiteralPath $OutputRoot -Recurse -File | Where-Object { $_.Extension -in @('.html', '.css', '.js', '.webmanifest') }
    $patterns = @(
        '(?i)(?:src|href|content)=["''][^"'']*(images/[^"''?#]+)["'']',
        '(?i)url\(["'']?[^\)"'']*(images/[^\)"''?#]+)',
        '(?i)["''][^"'']*(images/[^"''?#]+)["'']',
        '(?i)(images/[^"''\s\),?#]+)'
    )

    foreach ($file in $scanFiles) {
        $content = Get-Content -LiteralPath $file.FullName -Raw -Encoding UTF8
        foreach ($pattern in $patterns) {
            foreach ($match in [regex]::Matches($content, $pattern)) {
                $path = [Uri]::UnescapeDataString($match.Groups[1].Value) -replace '\\', '/'
                if ($path -match '(?i)\.(?:avif|gif|jpe?g|mp4|png|svg|webm|webp)$') { [void]$references.Add($path) }
            }
        }
    }

    $destinationRoot = Join-Path $OutputRoot 'images'
    New-Item -ItemType Directory -Path $destinationRoot -Force | Out-Null
    $publishedImageIndex = @{}
    foreach ($publishedFile in Get-ChildItem -LiteralPath $destinationRoot -Recurse -File -ErrorAction SilentlyContinue) {
        $publishedImageIndex[$publishedFile.FullName.ToLowerInvariant()] = $publishedFile
    }
    $copied = 0

    foreach ($reference in ($references | Sort-Object)) {
        $relative = $reference.Substring('images/'.Length) -replace '/', '\\'
        $source = $null
        $webpCandidate = if ($WebpRoot) { Join-Path $WebpRoot $relative } else { $null }
        $imageCandidate = Join-Path $ImageRoot $relative
        if ($webpCandidate -and (Get-SourceImageInfo $webpCandidate $SourceIndex)) { $source = $webpCandidate }
        elseif (Get-SourceImageInfo $imageCandidate $SourceIndex) { $source = $imageCandidate }
        if (-not $source) {
            Write-Warning "Skipping stale image reference: $reference"
            continue
        }

        $destination = Join-Path $OutputRoot ($reference -replace '/', '\\')
        New-Item -ItemType Directory -Path (Split-Path $destination -Parent) -Force | Out-Null
        $destinationInfo = $publishedImageIndex[[IO.Path]::GetFullPath($destination).ToLowerInvariant()]
        $copyRequired = -not $destinationInfo
        if (-not $copyRequired) {
            $sourceInfo = Get-SourceImageInfo $source $SourceIndex
            $copyRequired = $sourceInfo.Length -ne $destinationInfo.Length -or
                $sourceInfo.LastWriteTimeUtc -gt $destinationInfo.LastWriteTimeUtc
        }
        if ($copyRequired) {
            Copy-Item -LiteralPath $source -Destination $destination -Force
            $copied++
        }
    }
    Write-Output "Published $($references.Count) referenced images ($copied copied)."
}

$journalManifestPath = Join-Path $root "journals\manifest.json"
if (-not (Test-Path -LiteralPath $journalManifestPath)) { throw "Missing travel journal manifest: $journalManifestPath" }
$journalManifestData = Get-Content -LiteralPath $journalManifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
$journalManifest = @($journalManifestData | Sort-Object order)
if ($journalManifest.Count -eq 0) { throw "Travel journal manifest is empty." }
$tripOrder = @($journalManifest | ForEach-Object { $_.slug })
$journalBySlug = @{}
$tripLabels = @{}
# Per-page share/preview image; pages not listed fall back to the hero.
$defaultOgImage = "images/travel/2025_japan/day8_amanohashidate/kyoto4-800.jpg"
$ogImages = @{ "travel" = "images/travel/2026_guangzhou/day5/canton-tower-couple.webp" }
foreach ($journal in $journalManifest) {
    if ($journalBySlug.ContainsKey($journal.slug)) { throw "Duplicate travel journal slug: $($journal.slug)" }
    $journalBySlug[$journal.slug] = $journal
    $tripLabels[$journal.slug] = $journal.label
    if ($journal.ogImage) { $ogImages[$journal.slug] = $journal.ogImage }
}

function Add-TravelNavigation([string]$Markup, [string]$Slug) {
    if ($tripOrder -notcontains $Slug) { return $Markup }

    $headings = [regex]::Matches($Markup, '(?is)<h2\b[^>]*>(.*?)</h2>')
    $sections = @()
    $headingIndex = 0
    foreach ($heading in $headings) {
        $label = [regex]::Replace($heading.Groups[1].Value, '<[^>]+>', '')
        $label = [System.Net.WebUtility]::HtmlDecode(($label -replace '\s+', ' ').Trim())
        $label = $label -replace '(?i)^Day\s+\d+\s*-\s*', ''
        $label = $label -replace '^#\d+\s*-\s*', ''
        if ($label -eq 'Hutt Lagoon & Kalbarri National Park') { $label = 'Hutt Lagoon & Kalbarri' }
    if ($label -match '^Melbourne\s*-\s*(.+)$') { $label = 'Melbourne &middot; ' + $Matches[1] }
    if ($label -match '^Sydney\s*-\s*(.+)$') { $label = 'Sydney &middot; ' + $Matches[1] }
        if ($label -eq 'Melbourne City') { $label = 'Melbourne' }
        if ($label -eq 'Sydney City') { $label = 'Sydney' }
        if ($label -eq 'Osaka & Nara') { $label = '&#x1F3C3; Osaka &amp; Nara &#x1F98C;' }
        if ($label -eq 'Tokyo') { $label = '&#x1F5FB; Tokyo &#x1F5FC;' }
        if ($label -eq 'France') { $label = '&#x1F5FC; France' }
        if ($label -eq 'Belgium') { $label = '&#x1F9C7; Belgium' }
        if ($label -eq 'Netherlands') { $label = '&#x1F337; Netherlands' }
        if ($label -eq 'Germany') { $label = '&#x1F968; Germany' }
        if ($label -eq 'Switzerland') { $label = '&#x1F3D4; Switzerland' }
        if ($label -eq 'Melbourne') { $label = '&#x1F998; Melbourne' }
        if ($label -eq 'Sydney') { $label = '&#x1F998; Sydney' }
        if ($label -eq 'Departure') { $label = '&#x2708;&#xFE0F; Departure' }
        if ($label -eq 'Germany Switzerland') { $label = '&#x1F1E9;&#x1F1EA; Germany · &#x1F1E8;&#x1F1ED; Switzerland' }
        if ($label -eq 'France Switzerland') { $label = '&#x1F1EB;&#x1F1F7; France · &#x1F1E8;&#x1F1ED; Switzerland' }
        if ($label -match 'France$' -and $label -notmatch '&#x1F1EB;') { $label = $label -replace 'France$', '&#x1F1EB;&#x1F1F7; France' }
        if ($label -match 'Belgium$' -and $label -notmatch '&#x1F1E7;') { $label = $label -replace 'Belgium$', '&#x1F1E7;&#x1F1EA; Belgium' }
        if ($label -match 'Netherlands$' -and $label -notmatch '&#x1F1F3;') { $label = $label -replace 'Netherlands$', '&#x1F1F3;&#x1F1F1; Netherlands' }
        if ($label -match 'Germany$' -and $label -notmatch '&#x1F1E9;') { $label = $label -replace 'Germany$', '&#x1F1E9;&#x1F1EA; Germany' }
        if ($label -match 'Switzerland$' -and $label -notmatch '&#x1F1E8;') { $label = $label -replace 'Switzerland$', '&#x1F1E8;&#x1F1ED; Switzerland' }
        $label = [regex]::Replace($label, '&#x1F1[0-9A-F]{2};', '')
        $label = ($label -replace '\s+', ' ').Trim()
        if ($label -match '^\s*Germany.*Switzerland$') { $label = '&#x1F968; Germany &middot; &#x1F3D4; Switzerland' }
        if ($label -match '^\s*France.*Switzerland$') { $label = '&#x1F5FC; France &middot; &#x1F3D4; Switzerland' }
        if ($headingIndex -eq 0 -and $label -match '(?i)(trip$|silicon valley$)') {
            $headingIndex++
            continue
        }
        $sections += @{ Id = "trip-section-$($sections.Count + 1)"; Label = $label }
        $headingIndex++
    }

    # Keep only meaningful location changes in the jump navigation. Departure is
    # not a destination, and repeated day headings should not become duplicate pills.
    $dedupedSections = @()
    $previousPlainLabel = ""
    foreach ($section in $sections) {
        $plainLabel = [System.Net.WebUtility]::HtmlDecode(([regex]::Replace($section.Label, '&#x[0-9A-Fa-f]+;', '') -replace '\s+', ' ').Trim())
        if ($plainLabel -eq 'Departure' -or $plainLabel -eq $previousPlainLabel) { continue }
        $dedupedSections += $section
        $previousPlainLabel = $plainLabel
    }
    $sections = $dedupedSections

    $sectionState = @{ Count = 0; First = $true }
    $updated = [regex]::Replace($Markup, '(?is)<h2\b([^>]*)>(.*?)</h2>', {
        param($match)
        $label = [regex]::Replace($match.Groups[2].Value, '<[^>]+>', '')
        $label = [System.Net.WebUtility]::HtmlDecode(($label -replace '\s+', ' ').Trim())
        if ($sectionState.First -and $label -match '(?i)(trip$|silicon valley$)') {
            $sectionState.First = $false
            return $match.Value
        }
        $sectionState.First = $false
        $id = "trip-section-$($sectionState.Count + 1)"
        $sectionState.Count++
        return ('<h2 id="' + $id + '"' + $match.Groups[1].Value + '>' + $match.Groups[2].Value + '</h2>')
    })

    $groups = [ordered]@{}
    foreach ($section in $sections) {
        $group = $tripLabels[$Slug]
        if ($Slug -eq 'travel_2024_australia') {
            $sectionNumber = [int]($section.Id -replace '\D', '')
            $group = if ($sectionNumber -le 5) { 'Melbourne' } else { 'Sydney' }
        }
        elseif ($section.Label -match 'Melbourne') { $group = 'Melbourne' }
        elseif ($section.Label -match 'Sydney') { $group = 'Sydney' }
        elseif ($Slug -eq 'travel_2022_europe') {
            if ($section.Label -match 'France') { $group = 'France' }
            elseif ($section.Label -match 'Belgium') { $group = 'Belgium' }
            elseif ($section.Label -match 'Netherlands') { $group = 'Netherlands' }
            elseif ($section.Label -match 'Germany') { $group = 'Germany' }
            elseif ($section.Label -match 'Switzerland') { $group = 'Switzerland' }
        }
        if (-not $groups.Contains($group)) { $groups[$group] = @() }
        $groups[$group] += $section
    }
    $jumpGroups = foreach ($group in $groups.Keys) {
        $groupItems = $groups[$group]
        $firstItem = $groupItems[0]
        $firstPlainLabel = [System.Net.WebUtility]::HtmlDecode(([regex]::Replace($firstItem.Label, '&#x[0-9A-Fa-f]+;', '') -replace '\s+', ' ').Trim())
        $headingLabel = if ($firstPlainLabel -eq $group) { $firstItem.Label } else { $group }
        $headingEmoji = @{
            'Europe' = '&#x1F30D; '
            'Perth' = '&#x1F334; '
            'USA & Canada' = '&#x1F5FA; '
            'Australia' = '&#x1F998; '
            'Germany' = '&#x1F968; '
            'Japan' = '&#x1F5FC; '
            'Guangzhou' = '&#x1F307; '
            'Silicon Valley' = '&#x1F4BB; '
        }
        if ($firstPlainLabel -ne $group -and $headingEmoji.ContainsKey($group)) { $headingLabel = $headingEmoji[$group] + $group }
        $headingLabel = [regex]::Replace($headingLabel, '(&#x1F[0-9A-Fa-f]+;|&#x2708;)(&#xFE0F;)?', '<span class="travel-emoji">$1$2</span>')
        $groupHeading = ""
        if ($groups.Keys.Count -gt 1) {
            $groupHeading = '<span class="travel-jump-group__label">' + $headingLabel + '</span>'
            if ($firstPlainLabel -eq $group) {
                $groupHeading = '<a class="travel-jump-group__label" href="#' + $firstItem.Id + '">' + $headingLabel + '</a>'
            }
        }
        $links = ($groupItems | ForEach-Object {
            if ($firstPlainLabel -eq $group -and $_.Id -eq $firstItem.Id) { return }
            $displayLabel = $_.Label
            $plainLabel = [System.Net.WebUtility]::HtmlDecode(([regex]::Replace($displayLabel, '&#x[0-9A-Fa-f]+;', '') -replace '\s+', ' ').Trim())
            if ($plainLabel.Contains('&middot;') -or $plainLabel.Contains([char]0xB7)) { return }
            if ($plainLabel -match '^(Melbourne|Sydney)\s*[\u00B7]\s*(.+)$') { $displayLabel = $Matches[2] }
            elseif ($plainLabel -eq $group) { $displayLabel = 'Overview' }
            $displayLabel = ([regex]::Replace($displayLabel, '&#x[0-9A-Fa-f]+;', '') -replace '^\s+|\s+$', '')
            '<a href="#' + $_.Id + '">' + $displayLabel + '</a>'
        }) -join ""
        '<div class="travel-jump-group">' + $groupHeading + '<div>' + $links + '</div></div>'
    }
    $currentIndex = [array]::IndexOf($tripOrder, $Slug)
    $previous = if ($currentIndex -gt 0) { $tripOrder[$currentIndex - 1] } else { $null }
    $next = if ($currentIndex -lt ($tripOrder.Count - 1)) { $tripOrder[$currentIndex + 1] } else { $null }
    $previousLink = if ($previous) { '<a class="travel-pagination__previous" href="' + $previous + '"><span>Previous journal</span><strong>&#8592; ' + $tripLabels[$previous] + '</strong></a>' } else { '' }
    $nextLink = if ($next) { '<a class="travel-pagination__next" href="' + $next + '"><span>Next journal</span><strong>' + $tripLabels[$next] + ' &#8594;</strong></a>' } else { '' }
    $navigation = '<nav class="travel-section-nav" aria-label="Trip sections"><strong>Trip sections</strong><div class="travel-jump-groups">' + ($jumpGroups -join '') + '</div></nav>'
    $pagination = '<nav class="travel-pagination" aria-label="Trip navigation">' + $previousLink + $nextLink + '</nav>'
    $mainMatch = [regex]::Match($updated, '(?is)^\s*<div id="main"(?<attributes>[^>]*)>(?<content>.*)</div>\s*(?:<!--.*?-->\s*)*$')
    if (-not $mainMatch.Success) { throw "Could not render $Slug through the shared travel journal template." }
    $rendered = $travelJournalTemplate.Replace('{{MAIN_ATTRIBUTES}}', $mainMatch.Groups['attributes'].Value)
    $rendered = $rendered.Replace('{{TRIP_NAVIGATION}}', $navigation)
    $rendered = $rendered.Replace('{{JOURNAL_CONTENT}}', $mainMatch.Groups['content'].Value.Trim())
    return $rendered.Replace('{{TRIP_PAGINATION}}', $pagination)
}

function Add-PageNavigation([string]$Markup, [string]$Slug) {
    $sectionOrder = @('index', 'experience', 'skills', 'personal', 'travel')
    $sectionLabels = @{
        'index' = 'About'
        'experience' = 'Work'
        'skills' = 'Skills'
        'personal' = 'Personal'
        'travel' = 'Travel'
    }
    $links = @()
    if ($sectionOrder -contains $Slug) {
        $current = [array]::IndexOf($sectionOrder, $Slug)
        if ($current -gt 0) {
            $previous = $sectionOrder[$current - 1]
            $links += '<a class="site-pager__link site-pager__link--previous" href="' + $previous + '"><span>Previous section</span><strong>&#8592; ' + $sectionLabels[$previous] + '</strong></a>'
        }
        if ($current -lt ($sectionOrder.Count - 1)) {
            $next = $sectionOrder[$current + 1]
            $links += '<a class="site-pager__link site-pager__link--next" href="' + $next + '"><span>Next section</span><strong>' + $sectionLabels[$next] + ' &#8594;</strong></a>'
        }
    } elseif ($Slug -in @('house', 'prewed')) {
        $links += '<a class="site-pager__link site-pager__link--next" href="personal"><span>Back to</span><strong>Personal timeline &#8594;</strong></a>'
    }
    if ($links.Count -eq 0) { return $Markup }
    $modifier = if ($links.Count -eq 1) { ' site-pager--single' } else { '' }
    $navigation = '<nav class="site-pager' + $modifier + '" aria-label="Page navigation">' + ($links -join '') + '</nav>'
    $closingIndex = $Markup.LastIndexOf('</div>')
    if ($closingIndex -lt 0) { return $Markup }
    return $Markup.Insert($closingIndex, "$navigation`n")
}

function Add-SectionIntro([string]$Markup, [string]$Slug) {
    $intro = switch ($Slug) {
        'experience' { '<div id="selected-work" class="section-intro section-intro--experience"><span class="section-intro__eyebrow">Selected work</span><h1 class="section-intro__title" id="portfolio-title">Product &amp; AI portfolio</h1><p>Product leadership and outcomes across AI, cybersecurity, and data.</p></div>' }
        default { $null }
    }
    if (-not $intro) { return $Markup }
    return [regex]::Replace($Markup, '<div id="main"[^>]*>', { param($match) $match.Value + $intro }, 1)
}

function Add-GalleryPageHeading([string]$Markup, [string]$Slug) {
    $label = if ($Slug -eq 'house') {
        'House photoshoot'
    } elseif ($Slug -eq 'prewed') {
        'Pre-wedding photoshoot'
    } elseif ($tripOrder -contains $Slug) {
        [System.Net.WebUtility]::HtmlEncode($tripLabels[$Slug]) + ' travel journal'
    } else {
        $null
    }
    if (-not $label) { return $Markup }
    return [regex]::Replace($Markup, '<div id="main"[^>]*>', { param($match) $match.Value + "<h1 class=`"sr-only`">$label</h1>" }, 1)
}

function Add-GalleryAltText([string]$Markup, [string]$Slug) {
    if ($tripOrder -notcontains $Slug) { return $Markup }
    $label = [System.Net.WebUtility]::HtmlEncode($tripLabels[$Slug])
    $state = @{ Counter = 0 }
    return [regex]::Replace($Markup, '<img\b[^>]*\balt=""[^>]*>', {
        param($match)
        $state.Counter++
        return $match.Value.Replace('alt=""', "alt=`"$label travel photograph $($state.Counter)`"")
    })
}

function Convert-MainLandmark([string]$Markup) {
    $updated = [regex]::Replace($Markup, '<div id="main"([^>]*)>', '<main id="main"$1>', 1)
    $closingIndex = $updated.LastIndexOf('</div>')
    if ($closingIndex -lt 0) { return $updated }
    return $updated.Remove($closingIndex, 6).Insert($closingIndex, '</main>')
}

$webpMap = @{}
$webpSource = Join-Path $root "images-webp"
$optimizedAnimatedImages = @(
    "travel\2019_sv\SF_aqua1.gif",
    "travel\2022_europe\day7\switzerlandgif4.gif",
    "travel\2022_europe\day2\parisgif1.gif",
    "travel\2022_europe\day2\parisgif2.gif",
    "travel\2022_europe\day2\parisgif3.gif",
    "travel\2022_europe\day2\parisgif4.gif",
    "travel\2022_europe\day3\brusselsgif1.gif",
    "travel\2022_europe\day7\switzerlandgif1.gif",
    "travel\2023_perth\day7\greenough_gif_01.gif",
    "travel\2019_sv\LV_lights1.gif",
    "travel\2023_perth\day2\quokka_gif_01.gif",
    "travel\2019_sv\MONTEREY_aqua1.gif",
    "travel\2022_europe\day7\switzerlandgif3.gif",
    "travel\2022_europe\day8\zurichgif1.gif",
    "travel\2022_europe\day4\netherlands1.gif",
    "travel\2019_sv\SF_lombard.gif",
    "travel\2023_perth\day2\quokka_gif_02.gif",
    "travel\2023_perth\day5\nesuto_geraldton_01_gif.gif",
    "travel\2023_perth\day2\cycling_gif_01.gif",
    "travel\2019_sv\GOT_archery.gif",
    "travel\2019_sv\GOT_dance.gif",
    "travel\2019_sv\LV_fountain.gif",
    "travel\2019_sv\MONTEREY_aqua2.gif",
    "travel\2019_sv\MONTEREY_aqua3.gif",
    "travel\2019_sv\SF_silver.gif",
    "travel\2019_sv\SF_sutro.gif",
    "travel\2022_europe\day7\switzerlandgif2.gif",
    "travel\2022_europe\day7\switzerlandgif5.gif",
    "travel\2023_perth\day3\caversham_gif_01.gif",
    "travel\2023_perth\day3\caversham_gif_02.gif",
    "travel\2023_perth\day3\caversham_gif_03.gif",
    "travel\2023_perth\day3\caversham_gif_04.gif",
    "travel\2023_usa_canada\day10\arcade_gif1.gif",
    "travel\2023_usa_canada\day10\arcade_gif2.gif",
    "travel\2023_usa_canada\day10\arcade_gif4.gif",
    "travel\2023_usa_canada\day11\aquarium_gif1.gif",
    "travel\2023_usa_canada\day11\aquarium_gif2.gif",
    "travel\2023_usa_canada\day11\aquarium_gif3.gif",
    "travel\2023_usa_canada\day11\aquarium_gif4.gif",
    "travel\2023_usa_canada\day11\aquarium_gif5.gif",
    "travel\2023_usa_canada\day11\aquarium_gif6.gif",
    "travel\2023_usa_canada\day12\zoo_gif1.gif",
    "travel\2023_usa_canada\day12\zoo_gif2.gif",
    "travel\2023_usa_canada\day12\zoo_gif3.gif",
    "travel\2023_usa_canada\day12\zoo_gif4.gif",
    "travel\2023_usa_canada\day13\train_gif1.gif",
    "travel\2023_usa_canada\day14\zoo_gif1.gif",
    "travel\2023_usa_canada\day14\zoo_gif2.gif",
    "travel\2023_usa_canada\day14\zoo_gif3.gif",
    "travel\2023_usa_canada\day14\zoo_gif4.gif",
    "travel\2023_usa_canada\day14\zoo_gif5.gif",
    "travel\2023_usa_canada\day14\zoo_gif6.gif",
    "travel\2023_usa_canada\day14\zoo_gif7.gif",
    "travel\2023_usa_canada\day16\mnm_gif1.gif",
    "travel\2023_usa_canada\day3\cruise_gif1.gif",
    "travel\2023_usa_canada\day3\madame_gif1.gif",
    "travel\2023_usa_canada\day3\madame_gif2.gif",
    "travel\2023_usa_canada\day3\museum_sex_gif1.gif",
    "travel\2023_usa_canada\day4\little_island_gif1.gif",
    "travel\2023_usa_canada\day4\okiboru_gif1.gif",
    "travel\2023_usa_canada\day4\okiboru_gif2.gif",
    "travel\2023_usa_canada\day5\moma_gif1.gif",
    "travel\2023_usa_canada\day5\moma_gif2.gif",
    "travel\2023_usa_canada\day6\amtrak_gif1.gif",
    "travel\2023_usa_canada\day6\aquarium_gif1.gif",
    "travel\2023_usa_canada\day6\aquarium_gif2.gif",
    "travel\2023_usa_canada\day6\viewboston_gif1.gif",
    "travel\2023_usa_canada\day7\science_museum_gif1.gif",
    "travel\2023_usa_canada\day7\zoo_gif1.gif",
    "travel\2024_australia\sydney_wollongong\kiamagif.gif",
    "travel\2024_germany\cologne\cologne_gif2.gif",
    "travel\2024_germany\cologne\cologne_gif6.gif",
    "travel\2024_germany\cologne\cologne_gif7.gif",
    "travel\2024_germany\cologne\cologne_gif8.gif",
    "travel\2024_germany\duisburg\duisburg_gif1.gif",
    "travel\2024_germany\dusseldorf\dusseldorf_gif1.gif",
    "travel\2024_germany\kalkar\kalkar_amusement.gif",
    "travel\2024_germany\kalkar\kalkar_pantry.gif",
    "travel\2024_germany\xanten\xanten_gif1.gif",
    "travel\2025_japan\day3_osaka\kobegif1.gif",
    "travel\2025_japan\day8_amanohashidate\kyotogif1.gif"
)
if (Test-Path -LiteralPath $webpSource) {
    Get-ChildItem -LiteralPath $webpSource -Recurse -File -Filter *.webp | ForEach-Object {
        $relativeWebp = $_.FullName.Substring($webpSource.Length + 1).Replace('\', '/')
        $animatedRelative = [IO.Path]::ChangeExtension($relativeWebp, '.gif').Replace('/', '\')
        if ($optimizedAnimatedImages -notcontains $animatedRelative) {
            $base = [IO.Path]::ChangeExtension($relativeWebp, '.jpg')
            $jpegBase = [IO.Path]::ChangeExtension($relativeWebp, '.jpeg')
            # Keep both legacy extensions mapped so converted originals can be removed.
            $webpMap["images/$base"] = "images/$relativeWebp"
            $webpMap["images/$jpegBase"] = "images/$relativeWebp"
        }
    }
}

$eventPages = @('house', 'prewed')
$modularJournalSlugs = @($journalManifest | Where-Object { $_.contentOnly } | ForEach-Object { $_.slug })
$pages = @(
    Get-ChildItem -LiteralPath $root -Filter *.html |
        Where-Object { $modularJournalSlugs -notcontains $_.BaseName } |
        ForEach-Object {
            [pscustomobject]@{ Name = $_.Name; FullName = $_.FullName; IsJournalFragment = $false; Journal = $null }
        }
)
foreach ($journal in $journalManifest) {
    $journalSource = Join-Path $root $journal.source
    if (-not (Test-Path -LiteralPath $journalSource)) { throw "Missing journal source for $($journal.slug): $journalSource" }
    if ($journal.contentOnly) {
        $pages += [pscustomobject]@{
            Name = "$($journal.slug).html"
            FullName = $journalSource
            IsJournalFragment = $true
            Journal = $journal
        }
    }
}

foreach ($page in $pages) {
    $html = Get-Content -LiteralPath $page.FullName -Raw -Encoding UTF8
    $slug = if ($page.IsJournalFragment) { $page.Journal.slug } else { [IO.Path]::GetFileNameWithoutExtension($page.Name) }
    if ($page.IsJournalFragment) {
        $title = $page.Journal.title
        $description = $page.Journal.description
        # Modular journals default to the complete compact journal contract.
        # Manifest classes may extend it, but cannot accidentally omit the
        # hero, masonry, mobile caption, or horizontal-gallery scopes.
        $requiredJournalClasses = @('homepage', 'travel-journal', 'travel-journal--compact', 'guangzhou-journal')
        $manifestJournalClasses = if ($page.Journal.mainClass) { @($page.Journal.mainClass -split '\s+' | Where-Object { $_ }) } else { @() }
        $journalClasses = @($requiredJournalClasses + $manifestJournalClasses | Select-Object -Unique)
        $mainClass = ' class="' + ($journalClasses -join ' ') + '"'
        $main = '<div id="main"' + $mainClass + '>' + $html.Trim() + '</div>'
    } else {
        $titleMatch = [regex]::Match($html, '(?is)<title>(.*?)</title>')
        $descriptionMatch = [regex]::Match($html, '(?is)<meta\s+name="description"\s+content="(.*?)"')
        $title = if ($titleMatch.Success) { [System.Net.WebUtility]::HtmlDecode($titleMatch.Groups[1].Value.Trim()) } else { "Nicholas Wan" }
        $description = if ($descriptionMatch.Success) { $descriptionMatch.Groups[1].Value.Trim() } else { "Nicholas Wan's personal website." }

        $mainStart = $html.IndexOf('<div id="main"')
        $footerStart = $html.IndexOf('<footer id="footer">')
        if ($mainStart -lt 0 -or $footerStart -lt 0) {
            Write-Warning "Skipping $($page.Name): could not find main/footer boundaries."
            continue
        }
        $main = $html.Substring($mainStart, $footerStart - $mainStart).Trim()
    }
    if ($journalBySlug.ContainsKey($slug)) {
        $title = $journalBySlug[$slug].title
        $description = $journalBySlug[$slug].description
    }

    $intro = ""
    if ($slug -eq "index") {
        $introStart = $html.IndexOf('<div id="intro">')
        $introEnd = $html.IndexOf('<a href="javascript:" id="return-to-top">')
        if ($introStart -ge 0 -and $introEnd -gt $introStart) {
            $intro = $html.Substring($introStart, $introEnd - $introStart).Trim()
        }
    }

    $main = Add-TravelNavigation $main $slug
    $main = Add-SectionIntro $main $slug
    $main = Add-GalleryPageHeading $main $slug
    $main = Add-PageNavigation $main $slug
    $main = Normalize-MissingJpegReferences $main (Join-Path $root "images")
    $intro = Normalize-MissingJpegReferences $intro (Join-Path $root "images")
    # Resolve the controlled WebP overlay before image inspection so responsive
    # variants follow the asset that the browser will actually receive.
    foreach ($mapping in $webpMap.GetEnumerator()) {
        $main = $main.Replace($mapping.Key, $mapping.Value)
        $intro = $intro.Replace($mapping.Key, $mapping.Value)
    }
    $main = Add-ImagePerformanceAttributes $main (Join-Path $root "images") $sourceImageIndex
    $main = Add-GalleryAltText $main $slug
    $intro = Add-ImagePerformanceAttributes $intro (Join-Path $root "images") $sourceImageIndex

    $main = Convert-MainLandmark $main

    $navigation = $navigationTemplate
    $activePage = if ($eventPages -contains $slug) { 'personal' } elseif ($tripOrder -contains $slug) { 'travel' } else { $slug }
    $activeMarker = 'data-page="' + $activePage + '"'
    if ($navigation.Contains($activeMarker)) {
        $navigation = $navigation.Replace($activeMarker, $activeMarker + ' class="active"')
    }
    $navigation = [regex]::Replace($navigation, '\sdata-page="[^"]+"', '')
    if ($eventPages -contains $slug) {
        $navigation = [regex]::Replace($navigation, '(?s)^\s*<header id="header">.*?</header>\s*', '')
        $navigation = '<div class="mobile-context-bar" aria-label="Event navigation"><a class="mobile-context-bar__back" href="personal">&#8592; Personal timeline</a></div>' + "`n" + $navigation
    }
    if ($slug -eq 'index') {
        $navigation = [regex]::Replace($navigation, '(?s)^\s*<header id="header">.*?</header>\s*', '')
    }

    $galleryPages = @("house", "prewed") + $tripOrder
    $galleryScript = if ($galleryPages -contains $slug) { '<script src="assets/js/gallery.js?v=14"></script>' } else { "" }
    $travelNavScript = if ($tripOrder -contains $slug) { '<script src="assets/js/travel-nav.js?v=18"></script>' } else { "" }
    $travelMapScript = if ($slug -eq 'travel') { '<script src="assets/js/travel-map.js?v=13"></script>' } else { "" }
    $personalTimelineScript = if ($slug -eq 'personal') { '<script src="assets/js/personal-timeline.js?v=20"></script>' } else { "" }
    $scrambleRevealScript = if ($slug -in @('index', 'experience')) { '<script src="assets/js/scramble-reveal.js?v=12"></script>' } else { "" }
    $gameScript = if ($slug -eq 'index') { '<script src="assets/js/game.js?v=17"></script>' } else { "" }
    $listingEffectsScript = if ($slug -in @('skills', 'travel')) { '<script src="assets/js/listing-effects.js?v=1"></script>' } else { "" }
    $journalProgressScript = if ($tripOrder -contains $slug) { '<script src="assets/js/journal-progress.js?v=1"></script>' } else { "" }
    $canvasScript = if ($slug -eq 'index') { '<script src="assets/js/canvas-background.js?v=1"></script>' } else { "" }
    $optionalScripts = (@($gameScript, $listingEffectsScript, $journalProgressScript, $canvasScript, $galleryScript, $travelNavScript, $travelMapScript, $personalTimelineScript, $scrambleRevealScript) | Where-Object { $_ }) -join "`n    "
    $bodyClass = if ($slug -eq 'index') { 'is-preload page-home' } elseif ($eventPages -contains $slug) { 'is-preload page-personal page-event' } elseif ($tripOrder -contains $slug) { 'is-preload page-travel-journal' } elseif ($activePage -in @('experience', 'skills', 'personal')) { "is-preload page-$activePage" } else { 'is-preload' }
    # FontAwesome 6 only draws the tech-stack icons, well below the fold, but as a
    # plain stylesheet it blocked first paint on a third-party round trip. Load it
    # async (rel=preload promoted on load) with a noscript fallback. Self-hosting is
    # not a drop-in: the local font-awesome.min.css is v4 and this page uses v6
    # fab/fas names.
    $fontAwesomeUrl = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css'
    $fontAwesomeIntegrity = 'sha512-Avb2QiuDEEvB4bZJYdft2mNjVShBftLdPG8FJ0V7irTLQ8Uo0qcPxh4Plq7G5tGm0rU+1SPhVotteLpBERwTkw=='
    $fontAwesomeStylesheet = if ($slug -eq 'skills') { "    <link rel=`"preload`" as=`"style`" href=`"$fontAwesomeUrl`" integrity=`"$fontAwesomeIntegrity`" crossorigin=`"anonymous`" onload=`"this.onload=null;this.rel='stylesheet'`" />`n    <noscript><link rel=`"stylesheet`" href=`"$fontAwesomeUrl`" integrity=`"$fontAwesomeIntegrity`" crossorigin=`"anonymous`" /></noscript>" } else { '' }
    $travelMapStylesheet = if ($slug -eq 'travel') { '    <link rel="stylesheet" href="assets/css/travel-map-page.css?v=1" />' } else { '' }
    # The professional pages opt out of a share-preview image (owner decision,
    # Jul 2026): scrapers show a text-only card rather than the travel default.
    $shareImageMeta = if ($slug -in @('experience', 'skills')) { '' } else { "    <meta property=`"og:image`" content=`"__OGIMAGE__`" />`n    <meta name=`"twitter:card`" content=`"summary_large_image`" />" }
    $introLine = if ($intro) { "    $intro" } else { "" }
    $canvasMarkup = if ($slug -eq 'index') { '    <canvas id="nokey" width="800" height="800" aria-hidden="true"></canvas>' } else { '' }
    $template = @"
<!DOCTYPE HTML>
<html lang="en">
<head>
    <title>$title</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="$description" />
    <meta name="theme-color" content="#11807d" />
    <link rel="canonical" href="__CANONICAL__" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="$title" />
    <meta property="og:description" content="$description" />
    <meta property="og:url" content="__CANONICAL__" />
$shareImageMeta
    <link rel="stylesheet" href="assets/css/main.css?v=2" />
$fontAwesomeStylesheet
    <link rel="stylesheet" href="assets/css/custom.css?v=168" />
$travelMapStylesheet
    <noscript><link rel="stylesheet" href="assets/css/noscript.css" /></noscript>
    <link rel="shortcut icon" type="image/png" href="images/favicon.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="images/apple-touch-icon.png" />
    <link rel="manifest" href="site.webmanifest" />
</head>
<body class="$bodyClass">
$canvasMarkup
$introLine
    <a href="#" id="return-to-top" aria-label="Return to top"><i class="icon fa-chevron-up"></i></a>
    <div id="wrapper" class="fade-in">
$navigation
        $main
        <footer id="footer">
            <section class="split contact">
                <section>
                    <h2>Contact</h2>
                    <ul class="icons alt">
                        <li><a href="mailto:nicholaswan@live.com.sg" class="icon fa fa-envelope"><span class="label">Email</span></a></li>
                        <li><a href="https://github.com/nicholas-wan" target="_blank" rel="noopener noreferrer" class="icon fa-github"><span class="label">GitHub</span></a></li>
                        <li><a href="https://www.linkedin.com/in/nicholas-wan/" target="_blank" rel="noopener noreferrer" class="icon fa-linkedin"><span class="label">LinkedIn</span></a></li>
                    </ul>
                </section>
            </section>
        </footer>
    </div>
    <script src="assets/js/jquery.min.js"></script>
    <script src="assets/js/jquery.scrollex.min.js"></script>
    <script src="assets/js/jquery.scrolly.min.js"></script>
    <script src="assets/js/browser.min.js"></script>
    <script src="assets/js/breakpoints.min.js"></script>
    <script src="assets/js/util.js?v=1"></script>
    <script src="assets/js/main.js?v=19"></script>
    <script src="assets/js/arrow.js?v=1"></script>
$optionalScripts
</body>
</html>
"@

    $canonical = if ($slug -eq "index") { "https://nicholaswan.me/" } else { "https://nicholaswan.me/$slug" }
    $template = $template.Replace('__CANONICAL__', $canonical)
    $ogImage = if ($ogImages.ContainsKey($slug)) { $ogImages[$slug] } else { $defaultOgImage }
    $template = $template.Replace('__OGIMAGE__', "https://nicholaswan.me/$ogImage")
    Write-Utf8 (Join-Path $out $page.Name) $template
}

if ($imageDimensionCacheDirty) {
    New-Item -ItemType Directory -Path (Split-Path $imageDimensionCachePath -Parent) -Force | Out-Null
    $cacheJson = @($imageDimensionCache.Values | Sort-Object Path) | ConvertTo-Json -Depth 3
    Write-Utf8 $imageDimensionCachePath $cacheJson
}

# Publish only runtime assets used by the generated Pages site.
$runtimeCss = @("main.css", "font-awesome.min.css", "noscript.css")
$runtimeJs = @("jquery.min.js", "jquery.scrollex.min.js", "jquery.scrolly.min.js", "browser.min.js", "breakpoints.min.js", "util.js", "arrow.js", "game.js", "listing-effects.js", "journal-progress.js", "gallery.js", "travel-nav.js", "travel-map.js", "personal-timeline.js", "scramble-reveal.js")
New-Item -ItemType Directory -Path (Join-Path $out "assets\css") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $out "assets\js") -Force | Out-Null
foreach ($file in $runtimeCss) {
    Copy-Item -LiteralPath (Join-Path $root "assets\css\$file") -Destination (Join-Path $out "assets\css\$file") -Force
}
$customCssSource = Get-Content -LiteralPath (Join-Path $root 'assets\css\custom.css') -Raw -Encoding UTF8
$travelMapStartMarker = '/* Travel destination atlas */'
$travelMapEndMarker = '/* Compact travel journal archive */'
$travelMapStart = $customCssSource.IndexOf($travelMapStartMarker)
$travelMapEnd = $customCssSource.IndexOf($travelMapEndMarker)
if ($travelMapStart -lt 0 -or $travelMapEnd -le $travelMapStart) { throw 'Could not locate the travel-map CSS boundaries.' }
$travelMapCss = $customCssSource.Substring($travelMapStart, $travelMapEnd - $travelMapStart).Trim() + "`n"
$sharedCustomCss = ($customCssSource.Substring(0, $travelMapStart).TrimEnd() + "`n`n" + $customCssSource.Substring($travelMapEnd).TrimStart())
Write-Utf8 (Join-Path $out 'assets\css\custom.css') $sharedCustomCss
Write-Utf8 (Join-Path $out 'assets\css\travel-map-page.css') $travelMapCss
$mainJsSource = Get-Content -LiteralPath (Join-Path $root 'assets\js\main.js') -Raw -Encoding UTF8
$canvasStartMarker = '/*Canvas*/'
$canvasEndMarker = '// Shared progressive enhancement'
$canvasStart = $mainJsSource.IndexOf($canvasStartMarker)
$canvasEnd = $mainJsSource.IndexOf($canvasEndMarker)
if ($canvasStart -lt 0 -or $canvasEnd -le $canvasStart) { throw 'Could not locate the homepage canvas JavaScript boundaries.' }
$canvasJs = $mainJsSource.Substring($canvasStart, $canvasEnd - $canvasStart).Trim() + "`n"
$sharedMainJs = ($mainJsSource.Substring(0, $canvasStart).TrimEnd() + "`n`n" + $mainJsSource.Substring($canvasEnd).TrimStart())
Write-Utf8 (Join-Path $out 'assets\js\main.js') $sharedMainJs
Write-Utf8 (Join-Path $out 'assets\js\canvas-background.js') $canvasJs
foreach ($file in $runtimeJs) {
    Copy-Item -LiteralPath (Join-Path $root "assets\js\$file") -Destination (Join-Path $out "assets\js\$file") -Force
}
Sync-Directory (Join-Path $root "assets\fonts") (Join-Path $out "assets\fonts")
# Copied before the image scan so the manifest's icon references get published.
Copy-Item -LiteralPath (Join-Path $root "site.webmanifest") -Destination (Join-Path $out "site.webmanifest")
Copy-ReferencedImages $out (Join-Path $root "images") $(if (Test-Path -LiteralPath $webpSource) { $webpSource } else { $null }) $sourceImageIndex
Copy-Item -LiteralPath (Join-Path $root "CNAME") -Destination (Join-Path $out "CNAME")
Copy-Item -LiteralPath (Join-Path $root "robots.txt") -Destination (Join-Path $out "robots.txt")
Copy-Item -LiteralPath (Join-Path $root "sitemap.xml") -Destination (Join-Path $out "sitemap.xml")

Write-Output "Built $($pages.Count) pages into $out"
