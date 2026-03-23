import { Controller, Get, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../modules/users/user.entity';
import { UserRole } from '@bizops/shared';

interface AzureAdUser {
  sub: string;
  id: string;
  oid: string;
  email: string;
  displayName: string;
  roles: string[];
  isAzureAd: true;
}

interface DevUser {
  sub: string;
  id: string;
  email: string;
  role: string;
  azureAdOid: string | null;
}

type AuthenticatedUser = AzureAdUser | DevUser;

/**
 * Returns the current authenticated user's profile.
 * For Azure AD users, auto-provisions on first login.
 */
@Controller('auth')
export class MeController {
  private readonly allowedDomains: string[];

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly config: ConfigService,
  ) {
    const raw = this.config.get<string>('ALLOWED_EMAIL_DOMAINS') ?? '';
    this.allowedDomains = raw
      .split(',')
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async me(@Req() req: { user: AuthenticatedUser }) {
    const payload = req.user;

    if ('isAzureAd' in payload && payload.isAzureAd) {
      this.assertAllowedDomain(payload.email);
      return { data: await this.resolveAzureAdUser(payload) };
    }

    // Dev-mode: user is already in DB from dev-login
    const devPayload = payload as DevUser;
    const user = await this.userRepo.findOne({ where: { id: devPayload.id } });
    if (!user) {
      return {
        data: {
          id: devPayload.id,
          email: devPayload.email,
          displayName: devPayload.email,
          role: devPayload.role ?? UserRole.PROJECT_PERSONNEL,
        },
      };
    }
    return {
      data: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    };
  }

  /**
   * Finds existing user by Azure AD OID, or creates a new one.
   * Maps Azure AD app roles to internal UserRole if configured.
   */
  private async resolveAzureAdUser(payload: AzureAdUser) {
    let user = await this.userRepo.findOne({
      where: { azureAdOid: payload.oid },
    });

    const role = this.mapAzureAdRoles(payload.roles);

    if (!user) {
      // Also check by email in case user was manually pre-created
      user = await this.userRepo.findOne({ where: { email: payload.email } });

      if (user) {
        // Link OID to existing email-matched user
        user.azureAdOid = payload.oid;
        if (payload.displayName) user.displayName = payload.displayName;
        user = await this.userRepo.save(user);
      } else {
        // First-time login — provision new user
        user = this.userRepo.create({
          azureAdOid: payload.oid,
          email: payload.email,
          displayName: payload.displayName || payload.email,
          role,
          isActive: true,
        });
        user = await this.userRepo.save(user);
      }
    } else {
      // Update display name on every login (keeps in sync with AD)
      if (payload.displayName && user.displayName !== payload.displayName) {
        user.displayName = payload.displayName;
        user = await this.userRepo.save(user);
      }
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    };
  }

  /**
   * Maps Azure AD app roles to internal UserRole.
   * If no recognized role is assigned, defaults to PROJECT_PERSONNEL.
   *
   * To configure: In Azure AD > Enterprise Application > App Roles,
   * create roles matching the UserRole enum values:
   * GLOBAL_LEAD, BIZ_OPS_MANAGER, RESOURCE_MANAGER, etc.
   */
  private mapAzureAdRoles(roles: string[]): UserRole {
    const roleValues = Object.values(UserRole) as string[];
    for (const r of roles) {
      if (roleValues.includes(r)) {
        return r as UserRole;
      }
    }
    return UserRole.PROJECT_PERSONNEL;
  }

  /**
   * Rejects login if the user's email domain is not in the allowed list.
   * When ALLOWED_EMAIL_DOMAINS is empty, all domains are allowed.
   */
  private assertAllowedDomain(email: string) {
    if (this.allowedDomains.length === 0) return;
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain || !this.allowedDomains.includes(domain)) {
      throw new ForbiddenException(
        `Access denied. Email domain "${domain ?? ''}" is not authorized. Contact your administrator.`,
      );
    }
  }
}
