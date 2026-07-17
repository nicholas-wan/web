param(
    [string]$OutputPath = (Join-Path (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)) 'images\travel\world-map.svg')
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

function Convert-FeatureToPath {
    param($Feature)

    $builder = [Text.StringBuilder]::new()
    $geometry = $Feature.geometry
    if ($geometry.type -eq 'Polygon') {
        for ($ringIndex = 0; $ringIndex -lt $geometry.coordinates.Count; $ringIndex++) {
            $ring = $geometry.coordinates[$ringIndex]
            for ($index = 0; $index -lt $ring.Count; $index++) {
                $coordinate = $ring[$index]
                $point = Convert-Coordinate -Longitude ([double]$coordinate[0]) -Latitude ([double]$coordinate[1])
                $command = if ($index -eq 0) { 'M' } else { 'L' }
                [void]$builder.Append($command)
                [void]$builder.Append($point.X.ToString('0.##', $script:culture))
                [void]$builder.Append(' ')
                [void]$builder.Append($point.Y.ToString('0.##', $script:culture))
            }
            [void]$builder.Append('Z')
        }
    }
    elseif ($geometry.type -eq 'MultiPolygon') {
        for ($polygonIndex = 0; $polygonIndex -lt $geometry.coordinates.Count; $polygonIndex++) {
            $polygon = $geometry.coordinates[$polygonIndex]
            for ($ringIndex = 0; $ringIndex -lt $polygon.Count; $ringIndex++) {
                $ring = $polygon[$ringIndex]
                for ($index = 0; $index -lt $ring.Count; $index++) {
                    $coordinate = $ring[$index]
                    $point = Convert-Coordinate -Longitude ([double]$coordinate[0]) -Latitude ([double]$coordinate[1])
                    $command = if ($index -eq 0) { 'M' } else { 'L' }
                    [void]$builder.Append($command)
                    [void]$builder.Append($point.X.ToString('0.##', $script:culture))
                    [void]$builder.Append(' ')
                    [void]$builder.Append($point.Y.ToString('0.##', $script:culture))
                }
                [void]$builder.Append('Z')
            }
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
