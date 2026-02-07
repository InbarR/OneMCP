Add-Type -AssemblyName System.Drawing

$inputPath = Join-Path $PSScriptRoot "..\logo.png"
$outputPath = Join-Path $PSScriptRoot "..\resources\icon.ico"

$img = [System.Drawing.Image]::FromFile($inputPath)
$bitmap = New-Object System.Drawing.Bitmap($img)
$ico = [System.Drawing.Icon]::FromHandle($bitmap.GetHicon())

$stream = [System.IO.File]::Create($outputPath)
$ico.Save($stream)
$stream.Close()

$ico.Dispose()
$bitmap.Dispose()
$img.Dispose()

Write-Host "Icon created at: $outputPath"
