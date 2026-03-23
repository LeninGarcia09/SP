import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptionsWithoutRequest } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import * as jwksRsa from 'jwks-rsa';

interface JwtPayload {
  sub: string;
  oid?: string;        // Azure AD Object ID
  preferred_username?: string;
  email?: string;
  name?: string;
  roles?: string[];    // App roles assigned in Azure AD
  // Dev-mode fields (local JWT)
  role?: string;
}

/**
 * JWT Strategy — dual-mode:
 *
 * 1. **Azure AD mode** (when AZURE_AD_TENANT_ID + AZURE_AD_CLIENT_ID are set):
 *    Validates tokens issued by Microsoft identity platform using JWKS discovery.
 *
 * 2. **Dev mode** (fallback):
 *    Validates JWTs signed with the local JWT_SECRET for local testing.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly isAzureAd: boolean;

  constructor(private readonly configService: ConfigService) {
    const tenantId = configService.get<string>('AZURE_AD_TENANT_ID');
    const clientId = configService.get<string>('AZURE_AD_CLIENT_ID');
    const useAzureAd = Boolean(tenantId && clientId);

    const options: StrategyOptionsWithoutRequest = useAzureAd
      ? {
          jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
          audience: clientId!,
          issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
          algorithms: ['RS256'],
          secretOrKeyProvider: jwksRsa.passportJwtSecret({
            cache: true,
            rateLimit: true,
            jwksRequestsPerMinute: 10,
            jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`,
          }),
        }
      : {
          jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
          ignoreExpiration: false,
          secretOrKey: configService.get<string>('JWT_SECRET') ?? 'fallback-dev-secret',
        };

    super(options);
    this.isAzureAd = useAzureAd;
  }

  validate(payload: JwtPayload) {
    if (this.isAzureAd) {
      // Azure AD token — extract identity fields
      return {
        sub: payload.sub,
        id: payload.oid ?? payload.sub,
        oid: payload.oid ?? payload.sub,
        email: payload.preferred_username ?? payload.email ?? '',
        displayName: payload.name ?? payload.preferred_username ?? '',
        // App roles come from Azure AD Enterprise Application role assignments
        roles: payload.roles ?? [],
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
}
