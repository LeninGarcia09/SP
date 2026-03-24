// ─────────────────────────────────────────────────────────────
// BizOps Platform — Main Bicep Template
// Deploys: Resource Group resources for the BizOps platform
// ─────────────────────────────────────────────────────────────

targetScope = 'resourceGroup'

// ── Parameters ────────────────────────────────────────────────
@description('Environment name (dev, staging, prod)')
@allowed(['dev', 'staging', 'prod'])
param environment string

@description('Azure region for all resources')
param location string = resourceGroup().location

@description('Azure region for Static Web App (must be westus2, centralus, eastus2, westeurope, or eastasia)')
param swaLocation string = 'centralus'

@description('Base name for resources (e.g. bizops)')
@minLength(3)
@maxLength(15)
param baseName string = 'bizops'

@description('PostgreSQL administrator login')
param dbAdminLogin string = 'bizopsadmin'

@secure()
@description('PostgreSQL administrator password')
param dbAdminPassword string

@description('Container image tag to deploy')
param apiImageTag string = 'latest'

@description('JWT secret for API authentication')
@secure()
param jwtSecret string

// ── Variables ─────────────────────────────────────────────────
var suffix = '${baseName}-${environment}'
var uniqueSuffix = '${baseName}${uniqueString(resourceGroup().id)}'
var kvUniqueName = 'kv-${take(uniqueSuffix, 18)}'

// ── Container Registry ────────────────────────────────────────
module acr 'modules/container-registry.bicep' = {
  name: 'acr-${suffix}'
  params: {
    name: replace('acr${uniqueSuffix}', '-', '')
    location: location
  }
}

// ── Key Vault ─────────────────────────────────────────────────
module keyVault 'modules/key-vault.bicep' = {
  name: 'kv-${suffix}'
  params: {
    name: kvUniqueName
    location: location
    secrets: {
      'db-password': dbAdminPassword
      'jwt-secret': jwtSecret
    }
  }
}

// ── PostgreSQL Flexible Server ────────────────────────────────
module postgres 'modules/postgres.bicep' = {
  name: 'pg-${suffix}'
  params: {
    name: 'pg-flex-${suffix}'
    location: location
    administratorLogin: dbAdminLogin
    administratorPassword: dbAdminPassword
    databaseName: '${baseName}_${environment}'
  }
}

// ── Log Analytics (shared by Container App + App Insights) ───
module logAnalytics 'modules/log-analytics.bicep' = {
  name: 'log-${suffix}'
  params: {
    name: 'log-${suffix}'
    location: location
  }
}

// ── Application Insights ──────────────────────────────────────
module appInsights 'modules/app-insights.bicep' = {
  name: 'ai-${suffix}'
  params: {
    name: 'ai-${suffix}'
    location: location
    workspaceId: logAnalytics.outputs.workspaceId
  }
}

// ── Container Apps Environment ────────────────────────────────
module containerEnv 'modules/container-app-env.bicep' = {
  name: 'cae-${suffix}'
  params: {
    name: 'cae-${suffix}'
    location: location
    logAnalyticsWorkspaceId: logAnalytics.outputs.workspaceId
  }
}

// ── Redis Cache ───────────────────────────────────────────────
module redis 'modules/redis.bicep' = {
  name: 'redis-${suffix}'
  params: {
    name: 'redis-${suffix}'
    location: location
  }
}

// ── Static Web App (Frontend) ─────────────────────────────────
module staticWebApp 'modules/static-web-app.bicep' = {
  name: 'swa-${suffix}'
  params: {
    name: 'swa-${suffix}'
    location: swaLocation
  }
}

// ── API Container App ─────────────────────────────────────────
module apiApp 'modules/container-app.bicep' = {
  name: 'api-${suffix}'
  params: {
    name: 'api-${suffix}'
    location: location
    containerAppEnvironmentId: containerEnv.outputs.environmentId
    containerRegistryServer: acr.outputs.loginServer
    containerRegistryUsername: acr.outputs.adminUsername
    containerRegistryPassword: acr.outputs.adminPassword
    containerImage: '${acr.outputs.loginServer}/bizops-api:${apiImageTag}'
    targetPort: 3000
    healthProbePath: '/api/v1/system/health'
    envVars: [
      { name: 'NODE_ENV', value: 'production' }
      { name: 'PORT', value: '3000' }
      { name: 'API_PREFIX', value: 'api/v1' }
      { name: 'DATABASE_URL', value: 'postgresql://${dbAdminLogin}:${dbAdminPassword}@${postgres.outputs.fqdn}:5432/${baseName}_${environment}?sslmode=require' }
      { name: 'DATABASE_SSL', value: 'true' }
      { name: 'JWT_SECRET', secretRef: 'jwt-secret' }
      { name: 'REDIS_URL', value: 'rediss://:${redis.outputs.primaryKey}@${redis.outputs.hostname}:${redis.outputs.port}' }
      { name: 'CORS_ORIGIN', value: 'https://${staticWebApp.outputs.hostname}' }
      { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appInsights.outputs.connectionString }
    ]
    secrets: [
      { name: 'jwt-secret', value: jwtSecret }
      { name: 'db-password', value: dbAdminPassword }
    ]
  }
}

// ── Outputs ───────────────────────────────────────────────────
output acrLoginServer string = acr.outputs.loginServer
output acrName string = acr.outputs.name
output apiUrl string = apiApp.outputs.fqdn
output staticWebAppHostname string = staticWebApp.outputs.hostname
output staticWebAppId string = staticWebApp.outputs.id
output postgresHost string = postgres.outputs.fqdn
output postgresName string = postgres.outputs.name
output redisHostname string = redis.outputs.hostname
output appInsightsKey string = appInsights.outputs.instrumentationKey
