# Start Next.js server on port 3001
$logFile = "D:\Anitgravity\Application_cloned\hgv-workforce-app\scripts\server_schedule.log"
$timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
$appDir = "D:\Anitgravity\Application_cloned\hgv-workforce-app"

Add-Content -Path $logFile -Value "[$timestamp] [START] Scheduled task triggered to start server on port 3001."

try {
    $existing = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
    if ($existing) {
        Add-Content -Path $logFile -Value "[$timestamp] [START] Server is already running on port 3001 (PID $($existing[0].OwningProcess)). No action needed."
    } else {
        Add-Content -Path $logFile -Value "[$timestamp] [START] Launching 'npm run start' in $appDir..."
        
        $processInfo = New-Object System.Diagnostics.ProcessStartInfo
        $processInfo.FileName = "cmd.exe"
        $processInfo.Arguments = "/c npm run start"
        $processInfo.WorkingDirectory = $appDir
        $processInfo.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
        $processInfo.CreateNoWindow = $true
        $processInfo.UseShellExecute = $false
        
        $proc = [System.Diagnostics.Process]::Start($processInfo)
        Add-Content -Path $logFile -Value "[$timestamp] [START] Process spawned with PID $($proc.Id). Waiting for readiness..."
        
        Start-Sleep -Seconds 5
        $check = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
        if ($check) {
            Add-Content -Path $logFile -Value "[$timestamp] [START SUCCESS] Server is now listening on http://localhost:3001."
        } else {
            Add-Content -Path $logFile -Value "[$timestamp] [START NOTICE] Process started; server will become active shortly."
        }
    }
} catch {
    Add-Content -Path $logFile -Value "[$timestamp] [START ERROR] $_"
}
