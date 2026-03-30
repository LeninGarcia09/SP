import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptionsWithoutRequest } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as jwksRsa from 'jwks-rsa';
import { UserEntity } from '../modules/users/user.entity';

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

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {
    const clientId = configService.get<string>('AZURE_AD_CLIENT_ID');
    const useAzureAd = Boolean(clientId);

    const options: StrategyOptionsWithoutRequest = useAzureAd
      ? {
          jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
          // Accept both api://{clientId} and raw {clientId} as audience
          // (cross-tenant tokens may use raw GUID instead of identifier URI)
          audience: [`api://${clientId}`, clientId!],
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

  async validate(payload: JwtPayload) {
    if (this.isAzureAd) {
      const tid = payload.tid ?? this.extractTidFromIssuer(payload.iss);

      // Enforce tenant allow-list
      if (this.allowedTenantIds.length > 0 && tid) {
        if (!this.allowedTenantIds.includes(tid.toLowerCase())) {
          this.logger.warn(`Rejected login from unauthorized tenant: ${tid}`);
          return null; // Passport treats null as unauthorized
        }
      }

      // Look up the user's DB UUID and role (set during /auth/me provisioning)
      const oid = payload.oid ?? payload.sub;
      let role: string | undefined;
      let dbUserId: string | undefined;
      const dbUser = await this.userRepo.findOne({
        where: { azureAdOid: oid },
        select: ['id', 'role'],
      });
      if (dbUser) {
        role = dbUser.role;
        dbUserId = dbUser.id;
      }

      // Use the database UUID as sub/id so controllers can write to UUID columns.
      // Falls back to OID if user hasn't been provisioned yet (first /auth/me call).
      const userId = dbUserId ?? oid;

      return {
        sub: userId,
        id: userId,
        oid,
        email: payload.preferred_username ?? payload.email ?? '',
        displayName: payload.name ?? payload.preferred_username ?? '',
        role,
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
