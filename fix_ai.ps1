$path = "c:\AI\Jatak\frontend\src\pages\AIJatakPage.tsx"
$lines = [System.IO.File]::ReadAllLines($path)
Write-Host "Total lines: $($lines.Length)"
# Keep only first 529 lines (0-indexed: 0..528)
$kept = $lines[0..528]
[System.IO.File]::WriteAllLines($path, $kept, [System.Text.UTF8Encoding]::new($false))
Write-Host "Done. Kept $($kept.Length) lines."
