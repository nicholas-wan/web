param(
    [string]$OutputPath = (Join-Path (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)) 'images\travel\world-map.svg'),
    # Vertex simplification tolerance in canvas pixels (see Simplify-Ring). 0 disables it.
    [double]$Tolerance = 0.25
)

$ErrorActionPreference = 'Stop'
$culture = [Globalization.CultureInfo]::InvariantCulture
$admin0Url = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson'
$admin1Url = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces.geojson'
$admin0Path = Join-Path ([IO.Path]::GetTempPath()) 'natural-earth-admin0-110m.geojson'
$admin1Path = Join-Path ([IO.Path]::GetTempPath()) 'natural-earth-admin1-50m.geojson'

Invoke-WebRequest -UseBasicParsing -Uri $admin0Url -OutFile $admin0Path
Invoke-WebRequest -UseBasicParsing -Uri $admin1Url -OutFile $admin1Path

$admin0 = Get-Content -LiteralPath $admin0Path -Raw -Encoding UTF8 | ConvertFrom-Json
$admin1 = Get-Content -LiteralPath $admin1Path -Raw -Encoding UTF8 | ConvertFrom-Json

$width = 1200
$pi = [Math]::PI
$xMax = $pi * 0.8707
$pole = $pi / 2
$pole2 = $pole * $pole
$pole4 = $pole2 * $pole2
$yMax = $pole * (1.007226 + $pole2 * (0.015085 + $pole4 * (-0.044475 + 0.028874 * $pole2 - 0.005916 * $pole4)))
$height = [Math]::Round($width * $yMax / $xMax)

function Convert-Coordinate {
    param([double]$Longitude, [double]$Latitude)

    $lambda = $Longitude * [Math]::PI / 180
    $phi = $Latitude * [Math]::PI / 180
    $phi2 = $phi * $phi
    $phi4 = $phi2 * $phi2
    $rawX = $lambda * (0.8707 - 0.131979 * $phi2 + $phi4 * (-0.013791 + $phi4 * (0.003971 * $phi2 - 0.001529 * $phi4)))
    $rawY = $phi * (1.007226 + $phi2 * (0.015085 + $phi4 * (-0.044475 + 0.028874 * $phi2 - 0.005916 * $phi4)))
    $projectedX = ($rawX + $script:xMax) / (2 * $script:xMax) * $script:width
    $projectedY = ($script:yMax - $rawY) / (2 * $script:yMax) * $script:height
    return [pscustomobject]@{ X = $projectedX; Y = $projectedY }
}

# Natural Earth 50m state boundaries carry far more vertices than a 1200px
# canvas can show: the raw export had 45,965 points (627 KB, 218 KB gzipped) and
# was 88% of the travel page's transfer. Douglas-Peucker at 0.25px removes the
# vertices whose deviation is below a quarter of a CSS pixel at 1x (2.5px at the
# atlas's 10x maximum zoom), keeping ~17,000 points at ~87 KB gzipped (Sep 2026).
function Simplify-Ring {
    param([object[]]$Points, [double]$Tolerance)

    $count = $Points.Count
    if ($Tolerance -le 0 -or $count -lt 3) { return $Points }
    $keep = New-Object bool[] $count
    $keep[0] = $true
    $keep[$count - 1] = $true
    $stack = [System.Collections.Generic.Stack[int[]]]::new()
    $stack.Push([int[]]@(0, ($count - 1)))
    while ($stack.Count -gt 0) {
        $range = $stack.Pop()
        $first = $range[0]
        $last = $range[1]
        if ($last - $first -lt 2) { continue }
        $x0 = $Points[$first].X
        $y0 = $Points[$first].Y
        $dx = $Points[$last].X - $x0
        $dy = $Points[$last].Y - $y0
        $length = [Math]::Sqrt($dx * $dx + $dy * $dy)
        $best = 0.0
        $bestIndex = -1
        for ($i = $first + 1; $i -lt $last; $i++) {
            $px = $Points[$i].X - $x0
            $py = $Points[$i].Y - $y0
            $distance = if ($length -gt 0) { [Math]::Abs($dx * $py - $dy * $px) / $length } else { [Math]::Sqrt($px * $px + $py * $py) }
            if ($distance -gt $best) { $best = $distance; $bestIndex = $i }
        }
        if ($best -gt $Tolerance) {
            $keep[$bestIndex] = $true
            $stack.Push([int[]]@($first, $bestIndex))
            $stack.Push([int[]]@($bestIndex, $last))
        }
    }
    $result = [System.Collections.Generic.List[object]]::new()
    for ($i = 0; $i -lt $count; $i++) { if ($keep[$i]) { $result.Add($Points[$i]) } }
    return $result.ToArray()
}

function Add-RingPath {
    param([Text.StringBuilder]$Builder, $Ring)

    $points = [System.Collections.Generic.List[object]]::new()
    foreach ($coordinate in $Ring) {
        $points.Add((Convert-Coordinate -Longitude ([double]$coordinate[0]) -Latitude ([double]$coordinate[1])))
    }
    # GeoJSON rings repeat their first vertex; the path's Z closes it instead.
    if ($points.Count -gt 1 -and $points[0].X -eq $points[$points.Count - 1].X -and $points[0].Y -eq $points[$points.Count - 1].Y) {
        $points.RemoveAt($points.Count - 1)
    }
    if ($points.Count -lt 3) { return }
    $simplified = Simplify-Ring -Points $points.ToArray() -Tolerance $Tolerance
    # A ring that collapses below a triangle is a sub-pixel islet; keep its
    # original vertices rather than dropping the feature from the atlas.
    if ($simplified.Count -lt 3) { $simplified = $points.ToArray() }
    for ($index = 0; $index -lt $simplified.Count; $index++) {
        $point = $simplified[$index]
        $command = if ($index -eq 0) { 'M' } else { 'L' }
        [void]$Builder.Append($command)
        [void]$Builder.Append($point.X.ToString('0.##', $script:culture))
        [void]$Builder.Append(' ')
        [void]$Builder.Append($point.Y.ToString('0.##', $script:culture))
    }
    [void]$Builder.Append('Z')
}

function Convert-FeatureToPath {
    param($Feature)

    $builder = [Text.StringBuilder]::new()
    $geometry = $Feature.geometry
    if ($geometry.type -eq 'Polygon') {
        foreach ($ring in $geometry.coordinates) { Add-RingPath -Builder $builder -Ring $ring }
    }
    elseif ($geometry.type -eq 'MultiPolygon') {
        foreach ($polygon in $geometry.coordinates) {
            foreach ($ring in $polygon) { Add-RingPath -Builder $builder -Ring $ring }
        }
    }
    return $builder.ToString()
}

$svg = [Text.StringBuilder]::new()
[void]$svg.AppendLine('<?xml version="1.0" encoding="UTF-8"?>')
[void]$svg.AppendLine(('<svg xmlns="http://www.w3.org/2000/svg" width="{0}" height="{1}" viewBox="0 0 {0} {1}" role="img" aria-labelledby="map-title map-desc">' -f $width, $height))
[void]$svg.AppendLine('  <title id="map-title">World map</title>')
[void]$svg.AppendLine('  <desc id="map-desc">Vector world map with country borders and state or province boundaries for journal destinations.</desc>')
[void]$svg.AppendLine('  <metadata>Generated from public-domain Natural Earth admin-0 110m and admin-1 50m vector data.</metadata>')
[void]$svg.AppendLine('  <g fill="#17383c" fill-opacity="0.58" stroke="#8fc4c0" stroke-opacity="0.68" stroke-width="0.72" stroke-linejoin="round" vector-effect="non-scaling-stroke" fill-rule="evenodd">')
foreach ($feature in $admin0.features) {
    $path = Convert-FeatureToPath -Feature $feature
    if ($path) { [void]$svg.AppendLine(('    <path d="{0}" />' -f $path)) }
}
[void]$svg.AppendLine('  </g>')

$relevantCountries = @('USA', 'CAN', 'AUS', 'CHN', 'JPN', 'DEU', 'FRA', 'BEL', 'NLD', 'CHE')
[void]$svg.AppendLine('  <g fill="none" stroke="#9cc7c4" stroke-opacity="0.34" stroke-width="0.46" stroke-linejoin="round" vector-effect="non-scaling-stroke">')
foreach ($feature in $admin1.features) {
    $countryCode = [string]$feature.properties.adm0_a3
    if ($countryCode -notin $relevantCountries) { continue }
    $path = Convert-FeatureToPath -Feature $feature
    if ($path) { [void]$svg.AppendLine(('    <path d="{0}" />' -f $path)) }
}
[void]$svg.AppendLine('  </g>')
[void]$svg.AppendLine('</svg>')

$outputDirectory = Split-Path -Parent $OutputPath
if (-not (Test-Path -LiteralPath $outputDirectory)) { New-Item -ItemType Directory -Path $outputDirectory | Out-Null }
[IO.File]::WriteAllText($OutputPath, $svg.ToString(), [Text.UTF8Encoding]::new($false))
Write-Output "Generated $OutputPath at ${width}x${height}."
