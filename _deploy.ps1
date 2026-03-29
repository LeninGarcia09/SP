$ErrorActionPreference = "Stop"
$log = "c:\Users\lesalgad\Github\Personal\SIC\_deploy_log.txt"
$root = "c:\Users\lesalgad\Github\Personal\SIC"

function Log($msg) {
    $ts = Get-Date -Format "HH:mm:ss"
    $line = "[$ts] $msg"
    Write-Host $line
    Add-Content -Path $log -Value $line
}

# Clear log
Set-Content -Path $log -Value "=== DEPLOY STARTED $(Get-Date) ==="

# Step 1: Check Azure
Log "Step 1: Checking Azure subscription..."
$sub = az account show --query "id" -o tsv 2>&1
Log "Subscription: $sub"

if ($sub -ne "c885843e-7631-4f4e-9f1a-5d1a49d3d2a1") {
    Log "Setting subscription..."
    az account set --subscription c885843e-7631-4f4e-9f1a-5d1a49d3d2a1 2>&1
    $sub = az account show --query "id" -o tsv 2>&1
    Log "Now on: $sub"
}

# Step 2: Build API image
$tag = Get-Date -Format "yyyyMMdd-HHmm"
Log "Step 2: Building API image with tag: $tag"
Set-Location $root
$buildOut = az acr build --registry acrbizops5zqydpn5lftdy --image "bizops-api:$tag" --image "bizops-api:latest" --file apps/api/Dockerfile --platform linux/amd64 . 2>&1
$buildResult = $LASTEXITCODE
Log "ACR build exit code: $buildResult"
if ($buildResult -ne 0) {
    Log "ACR BUILD FAILED!"
    Log ($buildOut | Select-Object -Last 20 | Out-String)
    exit 1
}
Log "ACR build succeeded"

# Step 3: Deploy API
Log "Step 3: Deploying API container..."
$deployOut = az containerapp update --name api-bizops-dev --resource-group rg-bizops-dev2 --image "acrbizops5zqydpn5lftdy.azurecr.io/bizops-api:$tag" 2>&1
$deployResult = $LASTEXITCODE
Log "Container App update exit code: $deployResult"
if ($deployResult -ne 0) {
    Log "DEPLOY FAILED!"
    Log ($deployOut | Select-Object -Last 20 | Out-String)
    exit 1
}
Log "API deployed successfully"

# Step 4: Wait for API to be ready
Log "Step 4: Waiting 30s for API to start..."
Start-Sleep -Seconds 30

# Step 5: Check API health
Log "Step 5: Checking API health..."
try {
    $health = Invoke-RestMethod -Uri "https://api-bizops-dev.graysand-3ab24a81.eastus.azurecontainerapps.io/api/v1/system/health" -TimeoutSec 15
    Log "API health: $($health | ConvertTo-Json -Compress)"
} catch {
    Log "API health check failed: $($_.Exception.Message)"
}

# Step 6: Build frontend
Log "Step 6: Building frontend..."
Set-Location "$root\apps\web"
$npmBuild = npm run build 2>&1
$npmResult = $LASTEXITCODE
Log "Frontend build exit code: $npmResult"
if ($npmResult -ne 0) {
    Log "FRONTEND BUILD FAILED!"
    Log ($npmBuild | Select-Object -Last 20 | Out-String)
    exit 1
}
$distFiles = Get-ChildItem "$root\apps\web\dist\assets\*.js","$root\apps\web\dist\assets\*.css" | Select-Object Name, Length
Log "Dist files: $($distFiles | Format-Table -AutoSize | Out-String)"

# Step 7: Deploy frontend
Log "Step 7: Deploying frontend to SWA..."
$swaToken = az staticwebapp secrets list --name swa-bizops-dev --resource-group rg-bizops-dev2 --query "properties.apiKey" -o tsv 2>&1
Log "SWA token length: $($swaToken.Length)"
$swaOut = npx @azure/static-web-apps-cli deploy dist --deployment-token $swaToken --env production 2>&1
$swaResult = $LASTEXITCODE
Log "SWA deploy exit code: $swaResult"
Log ($swaOut | Select-Object -Last 10 | Out-String)

# Step 8: Verify SWA
Log "Step 8: Waiting 20s then verifying SWA..."
Start-Sleep -Seconds 20
try {
    $swa = Invoke-WebRequest -Uri "https://yellow-moss-027665410.1.azurestaticapps.net" -TimeoutSec 15 -UseBasicParsing
    Log "SWA status: $($swa.StatusCode)"
    $jsMatch = [regex]::Match($swa.Content, 'src="(/assets/index-[^"]+\.js)"')
    if ($jsMatch.Success) {
        Log "JS bundle found: $($jsMatch.Groups[1].Value)"
    }
} catch {
    Log "SWA check failed: $($_.Exception.Message)"
}

Log "=== DEPLOY COMPLETE ==="
Set-Location $root
