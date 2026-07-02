# ============================================================
# VaultMindOS Restore Helper v2.0
# Restaura C:\Projetos\vaultmindos a partir de 4 fontes,
# em ordem de prioridade: GitHub -> OneDrive -> HD Externo -> ZIP.
# Le config/paths.json. Use com cuidado.
# ============================================================

param(
    [ValidateSet("Auto", "GitHub", "OneDrive", "Externo", "Zip")]
    [string]$Fonte = "Auto",
    [switch]$DryRun
)

$ProjectName = "vaultmindos"
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptRoot
$ConfigPath = Join-Path $ProjectRoot "config\paths.json"

if (!(Test-Path $ConfigPath)) {
    Write-Host "[ERRO] config/paths.json nao encontrado em $ConfigPath" -ForegroundColor Red
    exit 1
}
$Config = Get-Content $ConfigPath -Raw | ConvertFrom-Json

$Destino = Join-Path $Config.workspace $ProjectName
$OneDriveFonte = Join-Path $Config.onedrive $ProjectName
$ExternoFonte = Join-Path $Config.external $ProjectName
$SnapshotDir = Join-Path $Config.snapshots $ProjectName
$GitRemote = "https://github.com/$($Config.github.organization)/$ProjectName.git"
$ExcluidosDir = $Config.excludedDirectories

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  VaultMindOS | Restore Helper v2" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Destino: $Destino" -ForegroundColor Yellow
Write-Host ""

function Confirm-Restore {
    if ($DryRun) { return $true }
    $confirm = Read-Host "Esta operacao pode sobrescrever arquivos em $Destino. Digite RESTAURAR para continuar"
    return ($confirm -eq "RESTAURAR")
}

function Restore-FromGitHub {
    Write-Host "[FONTE] GitHub -> $GitRemote" -ForegroundColor Yellow
    if (!(Get-Command git -ErrorAction SilentlyContinue)) {
        Write-Host "[ERRO] Git nao encontrado." -ForegroundColor Red
        return $false
    }
    if ($DryRun) {
        Write-Host "[DRY-RUN] Restauracao via GitHub simulada." -ForegroundColor DarkYellow
        return $true
    }
    if (!(Confirm-Restore)) { Write-Host "Operacao cancelada." -ForegroundColor DarkYellow; return $false }

    if (Test-Path (Join-Path $Destino ".git")) {
        Set-Location $Destino
        git fetch origin
        git reset --hard "origin/$($Config.github.defaultBranch)"
    } elseif (!(Test-Path $Destino) -or (Get-ChildItem $Destino -Force | Measure-Object).Count -eq 0) {
        git clone $GitRemote $Destino
    } else {
        Write-Host "[ERRO] $Destino existe, tem arquivos e nao e um repositorio Git. Escolha outra fonte ou limpe a pasta." -ForegroundColor Red
        return $false
    }
    return ($LASTEXITCODE -eq 0 -or $LASTEXITCODE -eq $null)
}

function Restore-FromMirror {
    param([string]$Origem, [string]$NomeFonte)

    Write-Host "[FONTE] $NomeFonte -> $Origem" -ForegroundColor Yellow
    if (!(Test-Path $Origem)) {
        Write-Host "[ERRO] Fonte nao encontrada: $Origem" -ForegroundColor Red
        return $false
    }
    if ($DryRun) {
        Write-Host "[DRY-RUN] Restauracao via $NomeFonte simulada." -ForegroundColor DarkYellow
        return $true
    }
    if (!(Confirm-Restore)) { Write-Host "Operacao cancelada." -ForegroundColor DarkYellow; return $false }

    if (!(Test-Path $Destino)) {
        New-Item -ItemType Directory -Path $Destino -Force | Out-Null
    }

    $XD = @()
    foreach ($dir in $ExcluidosDir) { $XD += @("/XD", $dir) }

    robocopy $Origem $Destino /MIR /R:2 /W:2 @XD
    return ($LASTEXITCODE -le 7)
}

function Restore-FromZip {
    Write-Host "[FONTE] Snapshot ZIP -> $SnapshotDir" -ForegroundColor Yellow
    if (!(Test-Path $SnapshotDir)) {
        Write-Host "[ERRO] Pasta de snapshots nao encontrada: $SnapshotDir" -ForegroundColor Red
        return $false
    }

    $LatestZip = Get-ChildItem -Path $SnapshotDir -Filter "$($ProjectName)_*.zip" -Recurse -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending | Select-Object -First 1

    if (!$LatestZip) {
        Write-Host "[ERRO] Nenhum snapshot ZIP encontrado em $SnapshotDir" -ForegroundColor Red
        return $false
    }

    Write-Host "Snapshot mais recente: $($LatestZip.FullName)" -ForegroundColor DarkGray

    if ($DryRun) {
        Write-Host "[DRY-RUN] Restauracao via ZIP simulada." -ForegroundColor DarkYellow
        return $true
    }
    if (!(Confirm-Restore)) { Write-Host "Operacao cancelada." -ForegroundColor DarkYellow; return $false }

    if (!(Test-Path $Destino)) {
        New-Item -ItemType Directory -Path $Destino -Force | Out-Null
    }

    Expand-Archive -Path $LatestZip.FullName -DestinationPath $Destino -Force
    return $true
}

$Sucesso = $false

switch ($Fonte) {
    "GitHub"   { $Sucesso = Restore-FromGitHub }
    "OneDrive" { $Sucesso = Restore-FromMirror -Origem $OneDriveFonte -NomeFonte "OneDrive" }
    "Externo"  { $Sucesso = Restore-FromMirror -Origem $ExternoFonte -NomeFonte "HD Externo" }
    "Zip"      { $Sucesso = Restore-FromZip }
    "Auto" {
        Write-Host "[AUTO] Tentando na ordem: GitHub -> OneDrive -> HD Externo -> ZIP" -ForegroundColor Cyan
        if (-not $Sucesso) { $Sucesso = Restore-FromGitHub }
        if (-not $Sucesso) { $Sucesso = Restore-FromMirror -Origem $OneDriveFonte -NomeFonte "OneDrive" }
        if (-not $Sucesso) { $Sucesso = Restore-FromMirror -Origem $ExternoFonte -NomeFonte "HD Externo" }
        if (-not $Sucesso) { $Sucesso = Restore-FromZip }
    }
}

Write-Host ""
if ($Sucesso) {
    Write-Host "[OK] Restauracao concluida." -ForegroundColor Green
    exit 0
} else {
    Write-Host "[ERRO] Restauracao falhou em todas as fontes tentadas." -ForegroundColor Red
    exit 1
}
