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
 * Microsoft Graph service using the Client Credentials flow with certificate credentials.
 *
 * Flow:
 * 1. Backend acquires an app-only token using client credentials (certificate or secret)
 * 2. Graph calls run with Application permissions (no user context needed)
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
  private defaultCca!: ConfidentialClientApplication;
  private readonly defaultTenantId: string;
  private readonly clientId: string;
  private readonly servicePrincipalId: string;
  private enabled = false;

  // Credential material — kept for building per-tenant CCAs
  private certBase64?: string;
  private certThumbprint?: string;
  private clientSecret?: string;

  constructor(private readonly config: ConfigService) {
    this.defaultTenantId = this.config.get<string>('AZURE_AD_TENANT_ID') ?? '';
    this.clientId = this.config.get<string>('AZURE_AD_CLIENT_ID') ?? '';
    this.servicePrincipalId =
      this.config.get<string>('AZURE_AD_SERVICE_PRINCIPAL_ID') ?? '';
  }

  onModuleInit() {
    if (!this.defaultTenantId || !this.clientId) {
      this.logger.warn(
        'Graph service disabled — AZURE_AD_TENANT_ID or AZURE_AD_CLIENT_ID not set',
      );
      return;
    }

    this.certBase64 = this.config.get<string>(
      'AZURE_AD_CLIENT_CERTIFICATE_BASE64',
    );
    this.certThumbprint = this.config.get<string>(
      'AZURE_AD_CLIENT_CERTIFICATE_THUMBPRINT',
    );
    this.clientSecret = this.config.get<string>('AZURE_AD_CLIENT_SECRET');

    const cca = this.buildCca(this.defaultTenantId);
    if (cca) {
      this.defaultCca = cca;
      this.enabled = true;
    }
  }

  /**
   * Build a ConfidentialClientApplication for a specific tenant.
   */
  private buildCca(tenantId: string): ConfidentialClientApplication | null {
    const authority = `https://login.microsoftonline.com/${tenantId}`;

    if (this.certBase64 && this.certThumbprint) {
      const certBuffer = Buffer.from(this.certBase64, 'base64');
      const cca = new ConfidentialClientApplication({
        auth: {
          clientId: this.clientId,
          authority,
          clientCertificate: {
            thumbprint: this.certThumbprint,
            privateKey: certBuffer.toString('utf-8'),
          },
        },
      });
      this.logger.log(`Graph CCA built for tenant ${tenantId} (certificate)`);
      return cca;
    } else if (this.clientSecret) {
      const cca = new ConfidentialClientApplication({
        auth: {
          clientId: this.clientId,
          authority,
          clientSecret: this.clientSecret,
        },
      });
      this.logger.log(`Graph CCA built for tenant ${tenantId} (secret)`);
      return cca;
    }

    this.logger.warn(
      'Graph service disabled — no certificate or client secret configured',
    );
    return null;
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  /** Returns the allowed tenant IDs from ALLOWED_TENANT_IDS env var. */
  get allowedTenantIds(): string[] {
    const raw = this.config.get<string>('ALLOWED_TENANT_IDS') ?? '';
    return raw.split(',').map((t) => t.trim()).filter(Boolean);
  }

  /**
   * Fetch display info for each allowed tenant by querying /organization.
   * Falls back to just the tenant ID if the query fails.
   */
  async listAllowedTenants(): Promise<{ id: string; displayName: string }[]> {
    const results: { id: string; displayName: string }[] = [];

    for (const tid of this.allowedTenantIds) {
      try {
        const client = await this.getGraphClient(tid);
        const org = await client.api('/organization').select('id,displayName').get();
        const info = org.value?.[0];
        results.push({
          id: tid,
          displayName: info?.displayName ?? tid,
        });
      } catch (err) {
        this.logger.warn(`Could not fetch org info for tenant ${tid}: ${err}`);
        results.push({ id: tid, displayName: tid });
      }
    }

    return results;
  }

  /**
   * Acquire an app-only token via client credentials and return a Graph client.
   * When tenantId is provided and differs from the default, a new CCA is built on-the-fly.
   */
  private async getGraphClient(tenantId?: string): Promise<Client> {
    let cca = this.defaultCca;

    if (tenantId && tenantId !== this.defaultTenantId) {
      const tenantCca = this.buildCca(tenantId);
      if (!tenantCca) {
        throw new Error(`Cannot build Graph client for tenant ${tenantId}`);
      }
      cca = tenantCca;
    }

    const result = await cca.acquireTokenByClientCredential({
      scopes: ['https://graph.microsoft.com/.default'],
    });

    if (!result?.accessToken) {
      throw new Error(
        'Client credentials token acquisition failed — no access token returned',
      );
    }

    return Client.init({
      authProvider: (done) => {
        done(null, result.accessToken);
      },
    });
  }

  // ─── Tenant Users ───

  async listTenantUsers(tenantId?: string): Promise<TenantUser[]> {
    const client = await this.getGraphClient(tenantId);

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

  async getTenantUser(userId: string, tenantId?: string): Promise<TenantUser> {
    const client = await this.getGraphClient(tenantId);

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

  async listAppRoles(): Promise<AppRoleDefinition[]> {
    const client = await this.getGraphClient();

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

  async listRoleAssignments(): Promise<AppRoleAssignment[]> {
    const client = await this.getGraphClient();

    const response = await client
      .api(`/servicePrincipals/${this.servicePrincipalId}/appRoleAssignedTo`)
      .top(999)
      .get();

    // Fetch role definitions to map appRoleId → value
    const roles = await this.listAppRoles();
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
    userId: string,
    appRoleId: string,
  ): Promise<AppRoleAssignment> {
    const client = await this.getGraphClient();

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

  async removeRoleAssignment(assignmentId: string): Promise<void> {
    const client = await this.getGraphClient();

    await client
      .api(
        `/servicePrincipals/${this.servicePrincipalId}/appRoleAssignedTo/${assignmentId}`,
      )
      .delete();
  }
}
