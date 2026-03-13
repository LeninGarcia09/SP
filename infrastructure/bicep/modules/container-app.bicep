@description('Name for the Container App')
param name string

@description('Azure region')
param location string

@description('Container Apps Environment resource ID')
param containerAppEnvironmentId string

@description('Container registry server (e.g. myacr.azurecr.io)')
param containerRegistryServer string

@description('Full container image reference (e.g. myacr.azurecr.io/bizops-api:latest)')
param containerImage string

@description('Target port for the container')
param targetPort int = 3000

@description('Environment variables for the container')
param envVars array = []

@description('Secrets for the container app')
param secrets array = []

@description('Min replicas')
param minReplicas int = 0

@description('Max replicas')
param maxReplicas int = 2

@description('CPU allocation (cores)')
param cpu string = '0.5'

@description('Memory allocation')
param memory string = '1Gi'

resource containerApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: name
  location: location
  properties: {
    managedEnvironmentId: containerAppEnvironmentId
    configuration: {
      ingress: {
        external: true
        targetPort: targetPort
        transport: 'auto'
        allowInsecure: false
      }
      registries: [
        {
          server: containerRegistryServer
          username: split(containerRegistryServer, '.')[0]
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: concat(secrets, [
        {
          name: 'acr-password'
          value: '' // Set via deployment script or managed identity
        }
      ])
    }
    template: {
      containers: [
        {
          name: 'api'
          image: containerImage
          resources: {
            cpu: json(cpu)
            memory: memory
          }
          env: envVars
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
        rules: [
          {
            name: 'http-scaling'
            http: {
              metadata: {
                concurrentRequests: '50'
              }
            }
          }
        ]
      }
    }
  }
}

output fqdn string = containerApp.properties.configuration.ingress.fqdn
output name string = containerApp.name
