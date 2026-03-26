import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptionsWithoutRequest } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import * as jwksRsa from 'jwks-rsa';

interface JwtPayload {
  sub: string;
  oid?: string;        // Azure AD Object ID
  tid?: string;        // Tenant ID (multi-tenant)
  preferred_username?: string;
  email?: string;
  name?: string;
  roles?: string[];    // App roles assigned in Azure AD
  iss?: string;        // Issuer — contains tenant ID
  // Dev-mode fields (local JWT)
  role?: string;
}

/**
 * JWT Strategy — dual-mode:
 *
 * 1. **Azure AD mode** (when AZURE_AD_CLIENT_ID is set):
 *    Multi-tenant: validates tokens from ANY Azure AD org tenant using the
 *    `common` JWKS endpoint. Tenant allow-list enforced in validate().
 *
 * 2. **Dev mode** (fallback):
 *    Validates JWTs signed with the local JWT_SECRET for local testing.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly isAzureAd: boolean;
  private readonly allowedTenantIds: string[];
  private readonly logger = new Logger('JwtStrategy');

  constructor(private readonly configService: ConfigService) {
    const clientId = configService.get<string>('AZURE_AD_CLIENT_ID');
    const useAzureAd = Boolean(clientId);

    const options: StrategyOptionsWithoutRequest = useAzureAd
      ? {
          jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
          // Accept raw clientId as audience (personal account tokens use raw GUID)
          audience: clientId!,
          // Multi-tenant: don't validate issuer statically — we check tid in validate()
          issuer: undefined,
          algorithms: ['RS256'],
          secretOrKeyProvider: jwksRsa.passportJwtSecret({
            cache: true,
            rateLimit: true,
            jwksRequestsPerMinute: 10,
            // Use 'common' endpoint to accept tokens from any org tenant
            jwksUri: 'https://login.microsoftonline.com/common/discovery/v2.0/keys',
          }),
        }
      : {
          jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
          ignoreExpiration: false,
          secretOrKey: configService.get<string>('JWT_SECRET') ?? 'fallback-dev-secret',
        };

    super(options);
    this.isAzureAd = useAzureAd;

    // Parse tenant allow-list from env
    const raw = configService.get<string>('ALLOWED_TENANT_IDS') ?? '';
    this.allowedTenantIds = raw
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    if (useAzureAd && this.allowedTenantIds.length > 0) {
      this.logger.log(`Multi-tenant mode: ${this.allowedTenantIds.length} tenant(s) allowed`);
    } else if (useAzureAd) {
      this.logger.warn('Azure AD mode active but ALLOWED_TENANT_IDS is empty — all tenants allowed');
    }
  }

  validate(payload: JwtPayload) {
    if (this.isAzureAd) {
      const tid = payload.tid ?? this.extractTidFromIssuer(payload.iss);

      // Enforce tenant allow-list
      if (this.allowedTenantIds.length > 0 && tid) {
        if (!this.allowedTenantIds.includes(tid.toLowerCase())) {
          this.logger.warn(`Rejected login from unauthorized tenant: ${tid}`);
          return null; // Passport treats null as unauthorized
        }
      }

      return {
        sub: payload.sub,
        id: payload.oid ?? payload.sub,
        oid: payload.oid ?? payload.sub,
        email: payload.preferred_username ?? payload.email ?? '',
        displayName: payload.name ?? payload.preferred_username ?? '',
        roles: payload.roles ?? [],
        tenantId: tid ?? null,
        isAzureAd: true,
      };
    }

    // Dev-mode token
    return {
      sub: payload.sub,
      id: payload.sub,
      email: payload.email ?? '',
      role: payload.role,
      azureAdOid: payload.oid ?? null,
    };
  }

  /** Extract tenant ID from issuer URL: https://login.microsoftonline.com/{tid}/v2.0 */
  private extractTidFromIssuer(iss?: string): string | undefined {
    if (!iss) return undefined;
    const match = iss.match(/login\.microsoftonline\.com\/([^/]+)/);
    return match?.[1];
  }
}
