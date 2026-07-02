# ============================================================
# VaultMindOS Environment Verifier v2.0
# Le config/paths.json. Valida pastas, Git, Node, npm,
# remote, integridade (espaco em disco) e sincronizacao.
# ============================================================

$ProjectName = "vaultmindos"
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptRoot
$ConfigPath = Join-Path $ProjectRoot "config\paths.json"

function Check($Label, $Condition) {
    if ($Condition) {
        Write-Host "[OK] $Label" -ForegroundColor Green
    } else {
        Write-Host "[FALHA] $Label" -ForegroundColor Red
    }
}

function Get-FreeSpaceGB {
    param([string]$Path)
    try {
        $qualifier = (Split-Path -Qualifier $Path).TrimEnd(':')
        $drive = Get-PSDrive -Name $qualifier -ErrorAction Stop
        return [math]::Round($drive.Free / 1GB, 2)
    } catch {
        return $null
    }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  VaultMindOS | Environment Verifier v2" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

Check "config/paths.json existe" (Test-Path $ConfigPath)
if (!(Test-Path $ConfigPath)) {
    Write-Host "[FALHA] Sem config/paths.json nao e possivel continuar a verificacao." -ForegroundColor Red
    exit 1
}

try {
    $Config = Get-Content $ConfigPath -Raw | ConvertFrom-Json
    Check "config/paths.json e um JSON valido" $true
} catch {
    Check "config/paths.json e um JSON valido" $false
    exit 1
}

$Origem = Join-Path $Config.workspace $ProjectName
$OneDriveDestino = Join-Path $Config.onedrive $ProjectName
$ExternoDestino = Join-Path $Config.external $ProjectName
$SnapshotDir = Join-Path $Config.snapshots $ProjectName
$GitRemote = "https://github.com/$($Config.github.organization)/$ProjectName.git"

Check "Pasta principal existe: $Origem" (Test-Path $Origem)
Check "Pasta OneDrive existe: $OneDriveDestino" (Test-Path $OneDriveDestino)
Check "Disco externo E: acessivel" (Test-Path "E:\")
Check "Pasta HD externo existe: $ExternoDestino" (Test-Path $ExternoDestino)
Check "Pasta de snapshots existe: $SnapshotDir" (Test-Path $SnapshotDir)
Check "Git instalado" ([bool](Get-Command git -ErrorAction SilentlyContinue))
Check "Node instalado" ([bool](Get-Command node -ErrorAction SilentlyContinue))
Check "npm instalado" ([bool](Get-Command npm -ErrorAction SilentlyContinue))

Write-Host ""
Write-Host "[INTEGRIDADE] Espaco em disco" -ForegroundColor Yellow
foreach ($p in @($Origem, $OneDriveDestino, $ExternoDestino)) {
    if (Test-Path $p) {
        $free = Get-FreeSpaceGB -Path $p
        if ($null -ne $free) {
            $cor = if ($free -lt 2) { "Red" } else { "DarkGray" }
            Write-Host "  $p -> $free GB livres" -ForegroundColor $cor
        }
    }
}

if (Test-Path $Origem) {
    Set-Location $Origem
    Check "Repositorio Git inicializado" (Test-Path (Join-Path $Origem ".git"))

    if (Test-Path (Join-Path $Origem ".git")) {
        $remoteAtual = git remote get-url origin 2>$null
        Check "Remote GitHub correto" ($remoteAtual -eq $GitRemote)
        Write-Host "Remote atual: $remoteAtual" -ForegroundColor DarkGray
        Write-Host "Branch atual: $(git rev-parse --abbrev-ref HEAD 2>$null)" -ForegroundColor DarkGray
        Write-Host "Status:" -ForegroundColor Yellow
        git status --short
    }
}

Write-Host ""
Write-Host "Verificacao concluida." -ForegroundColor Cyan
