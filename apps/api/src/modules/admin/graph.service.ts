import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { Client } from '@microsoft/microsoft-graph-client';
import type {
  TenantUser,
  AppRoleAssignment,
  AppRoleDefinition,
} from '@telnub/shared';

/**
 * Microsoft Graph service using the On-Behalf-Of (OBO) flow with certificate credentials.
 *
 * Flow:
 * 1. Frontend acquires a user token via MSAL (delegated)
 * 2. Backend exchanges that token for a Graph token using OBO
 * 3. Graph calls run with the user's delegated permissions
 *
 * Certificate-based credential — no shared secrets to rotate.
 *
 * Required env vars:
 *   AZURE_AD_TENANT_ID, AZURE_AD_CLIENT_ID,
 *   AZURE_AD_CLIENT_CERTIFICATE_BASE64 (PFX/PEM base64-encoded)
 *   AZURE_AD_CLIENT_CERTIFICATE_THUMBPRINT
 *
 * Falls back to client secret if certificate is not configured:
 *   AZURE_AD_CLIENT_SECRET
 */
@Injectable()
export class GraphService implements OnModuleInit {
  private readonly logger = new Logger(GraphService.name);
  private cca!: ConfidentialClientApplication;
  private readonly tenantId: string;
  private readonly clientId: string;
  private readonly servicePrincipalId: string;
  private enabled = false;

  constructor(private readonly config: ConfigService) {
    this.tenantId = this.config.get<string>('AZURE_AD_TENANT_ID') ?? '';
    this.clientId = this.config.get<string>('AZURE_AD_CLIENT_ID') ?? '';
    this.servicePrincipalId =
      this.config.get<string>('AZURE_AD_SERVICE_PRINCIPAL_ID') ?? '';
  }

  onModuleInit() {
    if (!this.tenantId || !this.clientId) {
      this.logger.warn(
        'Graph service disabled — AZURE_AD_TENANT_ID or AZURE_AD_CLIENT_ID not set',
      );
      return;
    }

    const certBase64 = this.config.get<string>(
      'AZURE_AD_CLIENT_CERTIFICATE_BASE64',
    );
    const certThumbprint = this.config.get<string>(
      'AZURE_AD_CLIENT_CERTIFICATE_THUMBPRINT',
    );
    const clientSecret = this.config.get<string>('AZURE_AD_CLIENT_SECRET');

    const authority = `https://login.microsoftonline.com/${this.tenantId}`;

    if (certBase64 && certThumbprint) {
      // Certificate-based credential (preferred)
      const certBuffer = Buffer.from(certBase64, 'base64');
      this.cca = new ConfidentialClientApplication({
        auth: {
          clientId: this.clientId,
          authority,
          clientCertificate: {
            thumbprint: certThumbprint,
            privateKey: certBuffer.toString('utf-8'),
          },
        },
      });
      this.enabled = true;
      this.logger.log('Graph service initialized with certificate credential');
    } else if (clientSecret) {
      // Fallback to client secret
      this.cca = new ConfidentialClientApplication({
        auth: {
          clientId: this.clientId,
          authority,
          clientSecret,
        },
      });
      this.enabled = true;
      this.logger.log('Graph service initialized with client secret credential');
    } else {
      this.logger.warn(
        'Graph service disabled — no certificate or client secret configured',
      );
    }
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Exchange a user's access token for a Graph-scoped token via OBO.
   */
  private async getGraphClient(userAccessToken: string): Promise<Client> {
    const oboRequest = {
      oboAssertion: userAccessToken,
      scopes: ['https://graph.microsoft.com/.default'],
    };

    const result = await this.cca.acquireTokenOnBehalfOf(oboRequest);
    if (!result?.accessToken) {
      throw new Error('OBO token exchange failed — no access token returned');
    }

    return Client.init({
      authProvider: (done) => {
        done(null, result.accessToken);
      },
    });
  }

  // ─── Tenant Users ───

  async listTenantUsers(userAccessToken: string): Promise<TenantUser[]> {
    const client = await this.getGraphClient(userAccessToken);

    const response = await client
      .api('/users')
      .select(
        'id,displayName,mail,userPrincipalName,jobTitle,department,mobilePhone,accountEnabled',
      )
      .top(999)
      .get();

    return (response.value ?? []).map((u: Record<string, unknown>) => ({
      id: u.id as string,
      displayName: u.displayName as string,
      mail: (u.mail as string) ?? null,
      userPrincipalName: u.userPrincipalName as string,
      jobTitle: (u.jobTitle as string) ?? null,
      department: (u.department as string) ?? null,
      mobilePhone: (u.mobilePhone as string) ?? null,
      accountEnabled: u.accountEnabled as boolean,
    }));
  }

  async getTenantUser(
    userAccessToken: string,
    userId: string,
  ): Promise<TenantUser> {
    const client = await this.getGraphClient(userAccessToken);

    const u = await client
      .api(`/users/${userId}`)
      .select(
        'id,displayName,mail,userPrincipalName,jobTitle,department,mobilePhone,accountEnabled',
      )
      .get();

    return {
      id: u.id,
      displayName: u.displayName,
      mail: u.mail ?? null,
      userPrincipalName: u.userPrincipalName,
      jobTitle: u.jobTitle ?? null,
      department: u.department ?? null,
      mobilePhone: u.mobilePhone ?? null,
      accountEnabled: u.accountEnabled,
    };
  }

  // ─── App Role Definitions ───

  async listAppRoles(userAccessToken: string): Promise<AppRoleDefinition[]> {
    const client = await this.getGraphClient(userAccessToken);

    const sp = await client
      .api(`/servicePrincipals/${this.servicePrincipalId}`)
      .select('appRoles')
      .get();

    return (sp.appRoles ?? [])
      .filter((r: Record<string, unknown>) => r.isEnabled)
      .map((r: Record<string, unknown>) => ({
        id: r.id as string,
        displayName: r.displayName as string,
        value: r.value as string,
        description: r.description as string,
      }));
  }

  // ─── App Role Assignments ───

  async listRoleAssignments(
    userAccessToken: string,
  ): Promise<AppRoleAssignment[]> {
    const client = await this.getGraphClient(userAccessToken);

    const response = await client
      .api(`/servicePrincipals/${this.servicePrincipalId}/appRoleAssignedTo`)
      .top(999)
      .get();

    // Fetch role definitions to map appRoleId → value
    const roles = await this.listAppRoles(userAccessToken);
    const roleMap = new Map(roles.map((r) => [r.id, r.value]));

    return (response.value ?? []).map((a: Record<string, unknown>) => ({
      id: a.id as string,
      principalId: a.principalId as string,
      principalDisplayName: a.principalDisplayName as string,
      appRoleId: a.appRoleId as string,
      appRoleName: roleMap.get(a.appRoleId as string) ?? null,
      createdDateTime: (a.createdDateTime as string) ?? null,
    }));
  }

  async assignRole(
    userAccessToken: string,
    userId: string,
    appRoleId: string,
  ): Promise<AppRoleAssignment> {
    const client = await this.getGraphClient(userAccessToken);

    const result = await client
      .api(`/servicePrincipals/${this.servicePrincipalId}/appRoleAssignedTo`)
      .post({
        principalId: userId,
        resourceId: this.servicePrincipalId,
        appRoleId,
      });

    return {
      id: result.id,
      principalId: result.principalId,
      principalDisplayName: result.principalDisplayName,
      appRoleId: result.appRoleId,
      appRoleName: null,
      createdDateTime: result.createdDateTime ?? null,
    };
  }

  async removeRoleAssignment(
    userAccessToken: string,
    assignmentId: string,
  ): Promise<void> {
    const client = await this.getGraphClient(userAccessToken);

    await client
      .api(
        `/servicePrincipals/${this.servicePrincipalId}/appRoleAssignedTo/${assignmentId}`,
      )
      .delete();
  }
}
