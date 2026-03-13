# ─────────────────────────────────────────────────────────────
# BizOps Platform — Deployment Guide
# ─────────────────────────────────────────────────────────────

## Prerequisites

1. Azure subscription with Contributor access
2. Azure CLI installed and authenticated (`az login`)
3. GitHub repository with Actions enabled

## GitHub Actions Secrets Required

Configure these in **Settings → Secrets and variables → Actions**:

### Azure Credentials
| Secret | Description |
|---|---|
| `AZURE_CREDENTIALS` | Service principal JSON (`az ad sp create-for-rbac --sdk-auth`) |
| `AZURE_RESOURCE_GROUP` | Resource group name (e.g. `rg-bizops-prod`) |

### Container Registry (ACR)
| Secret | Description |
|---|---|
| `ACR_LOGIN_SERVER` | ACR hostname (e.g. `acrbizopsXXX.azurecr.io`) |
| `ACR_USERNAME` | ACR admin username |
| `ACR_PASSWORD` | ACR admin password |

### Container App
| Secret | Description |
|---|---|
| `CONTAINER_APP_NAME` | Container App name (e.g. `api-bizops-prod`) |

### Database & Auth
| Secret | Description |
|---|---|
| `DB_ADMIN_PASSWORD` | PostgreSQL administrator password |
| `JWT_SECRET` | JWT signing secret (min 32 chars) |

### Static Web App
| Secret | Description |
|---|---|
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | SWA deployment token |
| `API_BASE_URL` | Full API URL (e.g. `https://api-bizops-prod.azurecontainerapps.io/api/v1`) |

## Deployment Steps

### 1. Create Azure Service Principal

```bash
az ad sp create-for-rbac \
  --name "bizops-github-actions" \
  --role contributor \
  --scopes /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/<RESOURCE_GROUP> \
  --sdk-auth
```

Copy the JSON output to the `AZURE_CREDENTIALS` GitHub secret.

### 2. Deploy Infrastructure

Run the "Deploy Infrastructure" workflow manually (or push to `infrastructure/bicep/`):
- Deploys: ACR, PostgreSQL, Key Vault, Container Apps Env, Static Web App, App Insights

### 3. Get ACR Credentials

```bash
az acr credential show --name <acr-name>
```

Set `ACR_LOGIN_SERVER`, `ACR_USERNAME`, `ACR_PASSWORD` in GitHub secrets.

### 4. Get SWA Deployment Token

```bash
az staticwebapp secrets list --name <swa-name> --query "properties.apiKey" -o tsv
```

Set `AZURE_STATIC_WEB_APPS_API_TOKEN` in GitHub secrets.

### 5. Deploy API

Push changes to `apps/api/` on main, or run "Deploy API" workflow manually.

### 6. Deploy Frontend

Push changes to `apps/web/` on main, or run "Deploy Web" workflow manually.

## Local Docker Testing

```bash
# Build API image
docker build -f apps/api/Dockerfile -t bizops-api:local .

# Run with local Postgres (from docker-compose)
docker-compose up -d
docker run --rm \
  --network host \
  -e DATABASE_URL=postgresql://bizops:bizops_dev_password@localhost:5432/bizops_dev \
  -e JWT_SECRET=local-test-secret \
  -e CORS_ORIGIN=http://localhost:5173 \
  -p 3000:3000 \
  bizops-api:local
```

## Architecture

```
┌─────────────────┐     ┌──────────────────┐
│  Static Web App │────▶│  Container App   │
│  (React/Vite)   │     │  (NestJS API)    │
└─────────────────┘     └──────┬───────────┘
                               │
                    ┌──────────┼──────────┐
                    │          │          │
              ┌─────▼─────┐ ┌─▼────┐ ┌───▼───────┐
              │ PostgreSQL │ │Redis │ │ Key Vault │
              │ Flex Server│ │      │ │           │
              └───────────┘ └──────┘ └───────────┘
```
