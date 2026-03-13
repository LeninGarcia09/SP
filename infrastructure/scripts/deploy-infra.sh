#!/bin/bash
# ─────────────────────────────────────────────────────────────
# BizOps Platform — Azure Infrastructure Deployment Script
# ─────────────────────────────────────────────────────────────
set -euo pipefail

# ── Configuration ──────────────────────────────────────────────
RESOURCE_GROUP="${RESOURCE_GROUP:-rg-bizops-dev}"
LOCATION="${LOCATION:-eastus2}"
ENVIRONMENT="${ENVIRONMENT:-dev}"
PARAM_FILE="infrastructure/bicep/parameters/${ENVIRONMENT}.bicepparam"

echo "==========================================="
echo "BizOps Platform — Infrastructure Deployment"
echo "==========================================="
echo "Resource Group: ${RESOURCE_GROUP}"
echo "Location:       ${LOCATION}"
echo "Environment:    ${ENVIRONMENT}"
echo "Parameter File: ${PARAM_FILE}"
echo "==========================================="

# ── Create Resource Group ──────────────────────────────────────
echo "Creating resource group..."
az group create \
  --name "${RESOURCE_GROUP}" \
  --location "${LOCATION}" \
  --output none

# ── Deploy Bicep Template ─────────────────────────────────────
echo "Deploying infrastructure..."
az deployment group create \
  --resource-group "${RESOURCE_GROUP}" \
  --template-file infrastructure/bicep/main.bicep \
  --parameters "${PARAM_FILE}" \
  --parameters \
    dbAdminPassword="${DB_ADMIN_PASSWORD}" \
    jwtSecret="${JWT_SECRET}" \
  --name "bizops-${ENVIRONMENT}-$(date +%Y%m%d%H%M)" \
  --output json

echo ""
echo "Deployment complete!"
echo "Run the following to see outputs:"
echo "  az deployment group show -g ${RESOURCE_GROUP} -n <deployment-name> --query properties.outputs"
