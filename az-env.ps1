# Project-local Azure CLI configuration
# This isolates az login sessions to this project directory.
# Source this in your terminal: . .\az-env.ps1
# Or add to your VS Code terminal profile.

$env:AZURE_CONFIG_DIR = Join-Path $PSScriptRoot ".azure"
Write-Host "Azure CLI config isolated to: $env:AZURE_CONFIG_DIR" -ForegroundColor Cyan

# Quick reference:
#   az login --tenant bad76ac5-fba7-4ac7-8776-dda48c50e003   # Personal (garcia.lenin@outlook.com) — infra
#   az login --tenant bd208e59-3f29-47af-8dd8-311a5e1414dd --allow-no-subscriptions  # M365 (sitec.solutions) — Entra ID
