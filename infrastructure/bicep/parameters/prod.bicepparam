using '../main.bicep'

param environment = 'prod'
param baseName = 'bizops'
param dbAdminLogin = 'bizopsadmin'
// dbAdminPassword and jwtSecret must be provided at deployment time:
// az deployment group create ... --parameters prod.bicepparam dbAdminPassword='<value>' jwtSecret='<value>'
param dbAdminPassword = ''
param jwtSecret = ''
param apiImageTag = 'latest'
