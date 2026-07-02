# ============================================================
# VaultMindOS Backup Manager v2.0
# Projeto: VaultMindOS | Empresa: ConnectionCyber
# Documento 002 — Repository & Backup Foundation (ConnectionCyberOS)
#
# Fluxo oficial:
# 1. Validar ambiente local
# 2. Sincronizar OneDrive
# 3. Sincronizar HD externo
# 4. Gerar snapshot ZIP versionado
# 5. Commit + Push GitHub
# 6. Registrar log operacional + auditoria
#
# Uso manual:        .\scripts\backup-vaultmindos.ps1
# Uso silencioso:     .\scripts\backup-vaultmindos.ps1 -Silencioso
# Apenas validar:     .\scripts\backup-vaultmindos.ps1 -DryRun
# ============================================================

param(
    [switch]$Silencioso,
    [switch]$DryRun,
    [string]$CommitMessage
)

$ErrorActionPreference = "Stop"
# Evita que PowerShell 7.3+ converta saida em stderr de comandos nativos (git, robocopy)
# com codigo de saida != 0 em excecao terminante. O script ja checa $LASTEXITCODE manualmente.
$PSNativeCommandUseErrorActionPreference = $false
$StartTime = Get-Date

$ProjectName = "vaultmindos"
$ProjectDisplayName = "VaultMindOS"
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptRoot
$ConfigPath = Join-Path $ProjectRoot "config\paths.json"

if (!(Test-Path $ConfigPath)) {
    throw "config/paths.json nao encontrado em $ConfigPath. Rode init-vaultmindos-folders.ps1 primeiro."
}
$Config = Get-Content $ConfigPath -Raw | ConvertFrom-Json

$Origem = Join-Path $Config.workspace $ProjectName
$OneDriveDestino = Join-Path $Config.onedrive $ProjectName
$ExternoDestino = Join-Path $Config.external $ProjectName
$SnapshotDir = Join-Path $Config.snapshots $ProjectName
$GitRemote = "https://github.com/$($Config.github.organization)/$ProjectName.git"
$BranchPadrao = $Config.github.defaultBranch
$ExcluidosDir = $Config.excludedDirectories
$ExcluidosFiles = $Config.excludedFiles

$DataHumana = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$DataArquivo = Get-Date -Format "yyyy-MM-dd_HHmmss"
$Ano = Get-Date -Format "yyyy"
$Mes = Get-Date -Format "MM"
$Usuario = $env:USERNAME

$LogRoot = Join-Path $Origem "logs\$Ano\$Mes"

function Write-Log {
    param(
        [string]$Message,
        [string]$Color = "White",
        [string]$LogType = "backup"
    )

    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] [user:$Usuario] [$ProjectName] $Message"

    if (!(Test-Path $LogRoot)) {
        New-Item -ItemType Directory -Path $LogRoot -Force | Out-Null
    }

    Add-Content -Path (Join-Path $LogRoot "$LogType.log") -Value $line -Encoding UTF8

    if (-not $Silencioso) {
        Write-Host $Message -ForegroundColor $Color
    }
}

function Test-CommandExists {
    param([string]$Command)
    return [bool](Get-Command $Command -ErrorAction SilentlyContinue)
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

function Sync-Robocopy {
    param(
        [string]$Destino,
        [string]$NomeDestino
    )

    Write-Log "" White
    Write-Log "[COPIA] $NomeDestino -> $Destino" Yellow
    Write-Log "------------------------------------------------------------" Cyan

    $Disco = Split-Path -Qualifier $Destino
    if (!(Test-Path $Disco)) {
        Write-Log "[AVISO] Disco $Disco nao acessivel. Etapa ignorada." DarkYellow
        return
    }

    if ($DryRun) {
        Write-Log "[DRY-RUN] Copia simulada para $Destino" DarkYellow
        return
    }

    if (!(Test-Path $Destino)) {
        New-Item -ItemType Directory -Path $Destino -Force | Out-Null
        Write-Log "[OK] Pasta criada: $Destino" Green
    }

    $XD = @()
    foreach ($dir in $ExcluidosDir) { $XD += @("/XD", $dir) }

    $XF = @()
    foreach ($file in $ExcluidosFiles) { $XF += @("/XF", $file) }

    $roboArgs = @(
        $Origem,
        $Destino,
        "/MIR",
        "/R:2",
        "/W:2",
        "/NFL",
        "/NDL",
        "/NJH"
    ) + $XD + $XF

    $output = & robocopy @roboArgs
    $code = $LASTEXITCODE

    $filesLine = ($output | Where-Object { $_ -match '^\s*Files\s*:' } | Select-Object -First 1)
    if ($filesLine) {
        Write-Log "[INTEGRIDADE] $($filesLine.Trim())" DarkCyan
    }

    $freeGB = Get-FreeSpaceGB -Path $Destino
    if ($null -ne $freeGB) {
        Write-Log "[INTEGRIDADE] Espaco livre em $Disco : $freeGB GB" DarkCyan
        if ($freeGB -lt 2) {
            Write-Log "[AVISO] Espaco livre abaixo de 2 GB em $Disco" DarkYellow
        }
    }

    if ($code -le 7) {
        Write-Log "[OK] Copia concluida com robocopy codigo $code." Green
    } else {
        Write-Log "[ERRO] Robocopy retornou codigo $code." Red
        throw "Falha no robocopy para $Destino"
    }
}

function Create-ZipSnapshot {
    Write-Log "" White
    Write-Log "[ZIP] Gerando snapshot versionado" Yellow
    Write-Log "------------------------------------------------------------" Cyan

    $ZipDir = Join-Path $SnapshotDir "$Ano\$Mes"
    $ZipFile = Join-Path $ZipDir "$($ProjectName)_$DataArquivo.zip"

    $Disco = Split-Path -Qualifier $SnapshotDir
    if (!(Test-Path $Disco)) {
        Write-Log "[AVISO] Disco $Disco nao acessivel. Snapshot ZIP ignorado." DarkYellow
        return
    }

    if ($DryRun) {
        Write-Log "[DRY-RUN] ZIP simulado: $ZipFile" DarkYellow
        return
    }

    if (!(Test-Path $ZipDir)) {
        New-Item -ItemType Directory -Path $ZipDir -Force | Out-Null
    }

    $TempDir = Join-Path $env:TEMP "$($ProjectName)_zip_$DataArquivo"
    if (Test-Path $TempDir) { Remove-Item $TempDir -Recurse -Force }
    New-Item -ItemType Directory -Path $TempDir -Force | Out-Null

    $XD = @()
    foreach ($dir in $ExcluidosDir) { $XD += @("/XD", $dir) }
    $XF = @()
    foreach ($file in $ExcluidosFiles) { $XF += @("/XF", $file) }

    robocopy $Origem $TempDir /MIR /R:2 /W:2 /NFL /NDL /NJH /NJS @XD @XF | Out-Null

    Compress-Archive -Path (Join-Path $TempDir "*") -DestinationPath $ZipFile -Force
    Remove-Item $TempDir -Recurse -Force

    Write-Log "[OK] Snapshot criado: $ZipFile" Green
}

function Sync-GitHub {
    Write-Log "" White
    Write-Log "[GIT] Sincronizando GitHub" Yellow
    Write-Log "------------------------------------------------------------" Cyan

    if (!(Test-Path $Origem)) {
        throw "Origem nao encontrada: $Origem"
    }

    Set-Location $Origem

    if (!(Test-CommandExists "git")) {
        throw "Git nao encontrado no PATH. Instale ou configure o Git."
    }

    if ($DryRun) {
        Write-Log "[DRY-RUN] Git sync simulado." DarkYellow
        return
    }

    # Comandos Git podem escrever em stderr mesmo em cenarios normais (hints,
    # HEAD ainda nao resolvido antes do primeiro commit). Isso NAO deve abortar
    # o script — quem decide sucesso/falha aqui e $LASTEXITCODE, verificado
    # explicitamente em cada etapa. Por isso a preferencia de erro e relaxada
    # apenas dentro deste bloco e restaurada no final, aconteca o que acontecer.
    $EAPAnterior = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        $repoRecemCriado = $false

        if (!(Test-Path (Join-Path $Origem ".git"))) {
            Write-Log "[GIT] Inicializando repositorio local." DarkYellow -LogType git
            git init -b $BranchPadrao 2>$null | Out-Null
            git remote add origin $GitRemote 2>$null | Out-Null
            $repoRecemCriado = $true
            Write-Log "[OK] Repositorio local inicializado na branch $BranchPadrao." Green -LogType git
        } else {
            $remoteAtual = git remote get-url origin 2>$null
            if ($remoteAtual -ne $GitRemote) {
                git remote set-url origin $GitRemote 2>$null | Out-Null
                Write-Log "[GIT] Remote atualizado para $GitRemote" DarkYellow -LogType git
            }

            $branchAtual = git rev-parse --abbrev-ref HEAD 2>$null
            if ($branchAtual -and $branchAtual -ne $BranchPadrao -and $branchAtual -ne "HEAD") {
                Write-Log "[GIT] Branch atual: $branchAtual. Usando push para HEAD." DarkYellow -LogType git
            }
        }

        $status = git status --porcelain 2>$null
        if ($status) {
            Write-Log "[GIT] Alteracoes detectadas. Preparando commit..." Cyan -LogType git
            git add -A 2>$null | Out-Null

            if ([string]::IsNullOrWhiteSpace($CommitMessage)) {
                $CommitMessage = "backup: $ProjectDisplayName $DataHumana"
            }

            git commit -m $CommitMessage 2>$null | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Log "[OK] Commit criado: $CommitMessage" Green -LogType git
            } else {
                Write-Log "[AVISO] Commit nao criado. Verifique saida do Git." DarkYellow -LogType git
            }
        } elseif ($repoRecemCriado) {
            Write-Log "[AVISO] Repositorio recem-criado sem nenhum arquivo para commitar." DarkYellow -LogType git
        } else {
            Write-Log "[GIT] Sem alteracoes pendentes." DarkYellow -LogType git
        }

        Write-Log "[GIT] Enviando para GitHub..." Cyan -LogType git
        git push -u origin HEAD 2>$null | Out-Null

        if ($LASTEXITCODE -eq 0) {
            $hash = git rev-parse --short HEAD 2>$null
            Write-Log "[OK] Push realizado com sucesso. HEAD: $hash" Green -LogType git
            Write-Log "[AUDITORIA] commit=$hash" DarkCyan
        } else {
            Write-Log "[ERRO] Push falhou. Verifique credenciais, token ou conexao." Red -LogType git
            throw "Falha no git push"
        }
    } finally {
        $ErrorActionPreference = $EAPAnterior
    }
}

function Validate-Environment {
    Write-Log "" White
    Write-Log "[VALIDACAO] Ambiente" Yellow
    Write-Log "------------------------------------------------------------" Cyan

    if (!(Test-Path $Origem)) {
        throw "Pasta principal nao encontrada: $Origem"
    }
    Write-Log "[OK] Origem encontrada: $Origem" Green

    if (!(Test-CommandExists "git")) {
        throw "Git nao encontrado."
    }
    Write-Log "[OK] Git encontrado." Green

    if (!(Test-CommandExists "robocopy")) {
        throw "Robocopy nao encontrado."
    }
    Write-Log "[OK] Robocopy encontrado." Green
}

try {
    Write-Log "" White
    Write-Log "============================================================" Cyan
    Write-Log "  $ProjectDisplayName | BACKUP MANAGER v2 | $DataHumana | user:$Usuario" White
    Write-Log "============================================================" Cyan

    Validate-Environment
    Sync-Robocopy -Destino $OneDriveDestino -NomeDestino "OneDrive"
    Sync-Robocopy -Destino $ExternoDestino -NomeDestino "HD Externo"
    Create-ZipSnapshot
    Sync-GitHub

    $Duration = (Get-Date) - $StartTime

    Write-Log "" White
    Write-Log "============================================================" Green
    Write-Log "  BACKUP CONCLUIDO COM SUCESSO | $DataHumana | duracao: $($Duration.ToString('mm\:ss'))" Green
    Write-Log "============================================================" Green

    exit 0
} catch {
    $Duration = (Get-Date) - $StartTime
    Write-Log "" White
    Write-Log "============================================================" Red
    Write-Log "  BACKUP FALHOU | $($_.Exception.Message) | duracao: $($Duration.ToString('mm\:ss'))" Red
    Write-Log "============================================================" Red
    exit 1
}
