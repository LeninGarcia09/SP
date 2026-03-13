using '../main.bicep'

param environment = 'dev'
param baseName = 'bizops'
param dbAdminLogin = 'bizopsadmin'
// dbAdminPassword and jwtSecret must be provided at deployment time:
// az deployment group create ... --parameters dev.bicepparam dbAdminPassword='<value>' jwtSecret='<value>'
param dbAdminPassword = ''
param jwtSecret = ''
param apiImageTag = 'latest'
