# Auto-reconnecting tunnel keeper for TataDana
$ErrorActionPreference = "Continue"

while ($true) {
    Write-Host "[Tunnel] Menghubungkan ke localhost.run..."
    try {
        & ssh.exe -T -o StrictHostKeyChecking=no -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -R 80:127.0.0.1:3000 nokey@localhost.run
    } catch {
        Write-Host "[Tunnel] Koneksi terputus: $_"
    }
    Write-Host "[Tunnel] Koneksi terputus. Mencoba menghubungkan kembali dalam 2 detik..."
    Start-Sleep -Seconds 2
}
