$cloudflaredPath = "C:\Users\Thinkpad\.gemini\antigravity\scratch\cloudflared.exe"
$urlFile = "C:\Users\Thinkpad\.gemini\antigravity\scratch\tatadana\cloudflared-url.txt"

Write-Host "[Cloudflare] Starting tunnel to http://127.0.0.1:3000..."

& $cloudflaredPath tunnel --url http://127.0.0.1:3000 2>&1 | ForEach-Object {
    $line = $_.ToString()
    Write-Host $line
    if ($line -match "https://[a-zA-Z0-9-]+\.trycloudflare\.com") {
        $url = $matches[0]
        Set-Content -Path $urlFile -Value $url -Force
        Write-Host ">>> CLOUDFLARE_TUNNEL_URL: $url <<<"
    }
}
