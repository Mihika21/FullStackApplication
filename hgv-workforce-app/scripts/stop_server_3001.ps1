# Stop Next.js server on port 3001
$logFile = "D:\Anitgravity\Application_cloned\hgv-workforce-app\scripts\server_schedule.log"
$timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")

Add-Content -Path $logFile -Value "[$timestamp] [STOP] Scheduled task triggered to stop server on port 3001."

try {
    $connections = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
    if ($connections) {
        $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($procId in $pids) {
            $p = Get-Process -Id $procId -ErrorAction SilentlyContinue
            if ($p) {
                Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
                Add-Content -Path $logFile -Value "[$timestamp] [STOP] Terminated process $procId ($($p.ProcessName)) on port 3001."
            }
        }
        Add-Content -Path $logFile -Value "[$timestamp] [STOP] Successfully stopped server on port 3001."
    } else {
        Add-Content -Path $logFile -Value "[$timestamp] [STOP] No active process found listening on port 3001."
    }
} catch {
    Add-Content -Path $logFile -Value "[$timestamp] [STOP ERROR] $_"
}
