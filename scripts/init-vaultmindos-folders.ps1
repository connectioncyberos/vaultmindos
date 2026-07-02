# ============================================================
# VaultMindOS Folder Initializer v2.0
# Le config/paths.json (Documento 002 da ConnectionCyberOS) e
# cria estrutura local, OneDrive, HD externo, config e logs
# (AAAA/MM) por tipo. Migrado para o padrao CDP.
# ============================================================

$ProjectName = "vaultmindos"
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptRoot
$ConfigPath = Join-Path $ProjectRoot "config\paths.json"

$DefaultConfig = [PSCustomObject]@{
    workspace = "C:\Projetos"
    onedrive  = "C:\Users\joaqu\OneDrive\Projetos"
    external  = "E:\Projetos"
    snapshots = "E:\Projetos\Snapshots"
}

if (Test-Path $ConfigPath) {
    $Config = Get-Content $ConfigPath -Raw | ConvertFrom-Json
} else {
    Write-Host "[AVISO] config/paths.json nao encontrado. Usando valores padrao." -ForegroundColor DarkYellow
    $Config = $DefaultConfig
}

$Ano = Get-Date -Format "yyyy"
$Mes = Get-Date -Format "MM"
$LogTypes = @("backup", "restore", "git", "deploy", "health")

$Paths = @(
    (Join-Path $Config.workspace $ProjectName),
    (Join-Path $ProjectRoot "docs\blueprint"),
    (Join-Path $ProjectRoot "docs\devops"),
    (Join-Path $ProjectRoot "docs\github"),
    (Join-Path $ProjectRoot "docs\backup"),
    (Join-Path $ProjectRoot "docs\security"),
    (Join-Path $ProjectRoot "docs\database"),
    (Join-Path $ProjectRoot "docs\seo"),
    (Join-Path $ProjectRoot "docs\software"),
    (Join-Path $ProjectRoot "docs\roadmap"),
    (Join-Path $ProjectRoot "docs\infrastructure"),
    (Join-Path $ProjectRoot "docs\projects"),
    (Join-Path $ProjectRoot "docs\architecture-decisions"),
    (Join-Path $ProjectRoot "scripts"),
    (Join-Path $ProjectRoot "config"),
    (Join-Path $Config.onedrive $ProjectName),
    (Join-Path $Config.external $ProjectName),
    (Join-Path $Config.snapshots $ProjectName)
)

foreach ($LogType in $LogTypes) {
    $Paths += (Join-Path $ProjectRoot "logs\$Ano\$Mes")
}

foreach ($Path in ($Paths | Select-Object -Unique)) {
    if (!(Test-Path $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
        Write-Host "[OK] Criado: $Path" -ForegroundColor Green
    } else {
        Write-Host "[OK] Ja existe: $Path" -ForegroundColor DarkGreen
    }
}

Write-Host ""
Write-Host "Estrutura inicial validada (Documento 002 / config-driven)." -ForegroundColor Cyan
