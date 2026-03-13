@description('Name for the Key Vault')
param name string

@description('Azure region')
param location string

@description('Secrets to store as key-value pairs')
param secrets object = {}

resource vault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: name
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 30
  }
}

resource secretEntries 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = [
  for secret in items(secrets): {
    parent: vault
    name: secret.key
    properties: {
      value: secret.value
    }
  }
]

output vaultUri string = vault.properties.vaultUri
output name string = vault.name
