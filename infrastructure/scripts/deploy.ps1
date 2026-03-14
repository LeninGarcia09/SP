# ─────────────────────────────────────────────────────────────
# BizOps Platform — Azure Deployment Script (PowerShell)
# Run from the repository root directory
# ─────────────────────────────────────────────────────────────
param(
    [ValidateSet('dev', 'staging', 'prod')]
    [string]$Environment = 'dev',
    [string]$Location = 'eastus2',
    [string]$BaseName = 'bizops',
    [string]$ResourceGroup = '',
    [string]$DbAdminPassword = '',
    [string]$JwtSecret = '',
    [switch]$SkipInfra,
    [switch]$SkipApi,
    [switch]$SkipWeb
)

$ErrorActionPreference = 'Stop'

# ── Defaults ───────────────────────────────────────────────────
if (-not $ResourceGroup) { $ResourceGroup = "rg-${BaseName}-${Environment}" }

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host " BizOps Platform — Azure Deployment" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Environment:    $Environment"
Write-Host "  Location:       $Location"
Write-Host "  Resource Group: $ResourceGroup"
Write-Host "  Skip Infra:     $SkipInfra"
Write-Host "  Skip API:       $SkipApi"
Write-Host "  Skip Web:       $SkipWeb"
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# ── Verify az CLI ──────────────────────────────────────────────
Write-Host "[1/7] Checking Azure CLI..." -ForegroundColor Yellow
try {
    $account = az account show --output json | ConvertFrom-Json
    Write-Host "  Logged in as: $($account.user.name)" -ForegroundColor Green
    Write-Host "  Subscription: $($account.name) ($($account.id))" -ForegroundColor Green
}
catch {
    Write-Host "  Not logged in. Running 'az login'..." -ForegroundColor Red
    az login
    $account = az account show --output json | ConvertFrom-Json
    Write-Host "  Logged in as: $($account.user.name)" -ForegroundColor Green
}

# ── Prompt for secrets if not provided ─────────────────────────
if (-not $DbAdminPassword) {
    $SecurePass = Read-Host "Enter PostgreSQL admin password (min 8 chars, mixed case + number)" -AsSecureString
    $DbAdminPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePass)
    )
}
if (-not $JwtSecret) {
    $JwtSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | ForEach-Object { [char]$_ })
    Write-Host "  Generated JWT secret (48 chars)" -ForegroundColor Green
}

# ── Step 2: Create Resource Group ──────────────────────────────
if (-not $SkipInfra) {
    Write-Host ""
    Write-Host "[2/7] Creating resource group '$ResourceGroup'..." -ForegroundColor Yellow
    az group create --name $ResourceGroup --location $Location --output none
    Write-Host "  Done" -ForegroundColor Green

    # ── Step 3: Deploy Bicep Infrastructure ─────────────────────
    Write-Host ""
    Write-Host "[3/7] Deploying Azure infrastructure (this takes 5-15 min)..." -ForegroundColor Yellow
    $deploymentName = "bizops-${Environment}-$(Get-Date -Format 'yyyyMMddHHmm')"

    $deployResult = az deployment group create `
        --resource-group $ResourceGroup `
        --template-file infrastructure/bicep/main.bicep `
        --parameters infrastructure/bicep/parameters/${Environment}.bicepparam `
        --parameters dbAdminPassword=$DbAdminPassword jwtSecret=$JwtSecret `
        --name $deploymentName `
        --output json | ConvertFrom-Json

    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Infrastructure deployment FAILED" -ForegroundColor Red
        exit 1
    }

    # Extract outputs
    $outputs = $deployResult.properties.outputs
    $acrLoginServer = $outputs.acrLoginServer.value
    $acrName = $outputs.acrName.value
    $apiUrl = $outputs.apiUrl.value
    $swaHostname = $outputs.staticWebAppHostname.value
    $swaId = $outputs.staticWebAppId.value
    $pgHost = $outputs.postgresHost.value
    $redisHost = $outputs.redisHostname.value

    Write-Host "  Infrastructure deployed successfully!" -ForegroundColor Green
    Write-Host "  ACR:        $acrLoginServer" -ForegroundColor Gray
    Write-Host "  API URL:    https://$apiUrl" -ForegroundColor Gray
    Write-Host "  SWA:        https://$swaHostname" -ForegroundColor Gray
    Write-Host "  PostgreSQL: $pgHost" -ForegroundColor Gray
    Write-Host "  Redis:      $redisHost" -ForegroundColor Gray
}
else {
    Write-Host ""
    Write-Host "[2/7] Skipping infrastructure (reading existing outputs)..." -ForegroundColor Yellow

    # Get the latest deployment outputs
    $deployments = az deployment group list --resource-group $ResourceGroup --output json | ConvertFrom-Json
    $latest = $deployments | Where-Object { $_.name -like "bizops-*" } | Sort-Object -Property { $_.properties.timestamp } -Descending | Select-Object -First 1

    if (-not $latest) {
        Write-Host "  No existing deployment found. Run without -SkipInfra first." -ForegroundColor Red
        exit 1
    }

    $outputs = (az deployment group show --resource-group $ResourceGroup --name $latest.name --output json | ConvertFrom-Json).properties.outputs
    $acrLoginServer = $outputs.acrLoginServer.value
    $acrName = $outputs.acrName.value
    $apiUrl = $outputs.apiUrl.value
    $swaHostname = $outputs.staticWebAppHostname.value
    $swaId = $outputs.staticWebAppId.value

    Write-Host "  ACR: $acrLoginServer | API: $apiUrl" -ForegroundColor Gray
    Write-Host "[3/7] Skipped" -ForegroundColor Yellow
}

# ── Step 4: Build & Push API Docker Image ──────────────────────
if (-not $SkipApi) {
    Write-Host ""
    Write-Host "[4/7] Logging into ACR '$acrName'..." -ForegroundColor Yellow
    az acr login --name $acrName

    Write-Host "[5/7] Building & pushing API Docker image..." -ForegroundColor Yellow
    $imageTag = (git rev-parse --short HEAD)
    $fullImage = "${acrLoginServer}/bizops-api"

    docker build -f apps/api/Dockerfile -t "${fullImage}:${imageTag}" -t "${fullImage}:latest" .
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Docker build FAILED" -ForegroundColor Red
        exit 1
    }

    docker push "${fullImage}:${imageTag}"
    docker push "${fullImage}:latest"
    Write-Host "  Pushed: ${fullImage}:${imageTag}" -ForegroundColor Green

    # Update Container App with new image
    Write-Host ""
    Write-Host "[6/7] Deploying API to Container App..." -ForegroundColor Yellow
    $containerAppName = "api-${BaseName}-${Environment}"
    az containerapp update `
        --name $containerAppName `
        --resource-group $ResourceGroup `
        --image "${fullImage}:${imageTag}" `
        --output none

    Write-Host "  API deployed: https://$apiUrl" -ForegroundColor Green
}
else {
    Write-Host ""
    Write-Host "[4/7] Skipping API build" -ForegroundColor Yellow
    Write-Host "[5/7] Skipping API push" -ForegroundColor Yellow
    Write-Host "[6/7] Skipping API deploy" -ForegroundColor Yellow
}

# ── Step 7: Build & Deploy Frontend ───────────────────────────
if (-not $SkipWeb) {
    Write-Host ""
    Write-Host "[7/7] Building & deploying frontend..." -ForegroundColor Yellow

    # Build
    $env:VITE_API_BASE_URL = "https://${apiUrl}/api/v1"
    npm ci
    npm run build --workspace=packages/shared
    npm run build --workspace=apps/web

    # Get SWA deployment token
    $swaToken = az staticwebapp secrets list --name "swa-${BaseName}-${Environment}" --query "properties.apiKey" --output tsv

    # Deploy using SWA CLI
    npx @azure/static-web-apps-cli deploy ./apps/web/dist `
        --deployment-token $swaToken `
        --env production

    Write-Host "  Frontend deployed: https://$swaHostname" -ForegroundColor Green
}
else {
    Write-Host "[7/7] Skipping frontend deploy" -ForegroundColor Yellow
}

# ── Summary ────────────────────────────────────────────────────
Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host " Deployment Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host "  API:      https://$apiUrl/api/v1" -ForegroundColor Cyan
Write-Host "  Frontend: https://$swaHostname" -ForegroundColor Cyan
Write-Host "  Swagger:  https://$apiUrl/api/docs" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
