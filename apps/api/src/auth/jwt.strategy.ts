import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  oid?: string; // Azure AD Object ID — populated when AD auth is active
}

/**
 * JWT Strategy — stub implementation for local development.
 *
 * In production this will validate tokens issued by Azure AD.
 * For now it validates JWTs signed with the local JWT_SECRET so
 * we can test auth flows without an Azure AD tenant.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  validate(payload: JwtPayload) {
    return {
      sub: payload.sub,
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      azureAdOid: payload.oid ?? null,
    };
  }
}
