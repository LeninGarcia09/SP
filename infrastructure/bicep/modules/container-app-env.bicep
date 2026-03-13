@description('Name for the Container Apps Environment')
param name string

@description('Azure region')
param location string

@description('Log Analytics workspace resource ID')
param logAnalyticsWorkspaceId string

resource environment 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: name
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: reference(logAnalyticsWorkspaceId, '2023-09-01').customerId
        sharedKey: listKeys(logAnalyticsWorkspaceId, '2023-09-01').primarySharedKey
      }
    }
  }
}

output environmentId string = environment.id
output defaultDomain string = environment.properties.defaultDomain
