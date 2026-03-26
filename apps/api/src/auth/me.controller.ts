import { Controller, Get, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../modules/users/user.entity';
import { UserRole } from '@telnub/shared';

interface AzureAdUser {
  sub: string;
  id: string;
  oid: string;
  email: string;
  displayName: string;
  roles: string[];
  tenantId: string | null;
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
  private readonly tenantDefaultRoles: Map<string, UserRole>;

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

    // Parse TENANT_DEFAULT_ROLES: "tenantId:ROLE,tenantId:ROLE"
    const roleValues = new Set(Object.values(UserRole) as string[]);
    this.tenantDefaultRoles = new Map();
    const tenantRolesRaw = this.config.get<string>('TENANT_DEFAULT_ROLES') ?? '';
    for (const entry of tenantRolesRaw.split(',').map((e) => e.trim()).filter(Boolean)) {
      const [tid, role] = entry.split(':').map((s) => s.trim());
      if (tid && role && roleValues.has(role)) {
        this.tenantDefaultRoles.set(tid.toLowerCase(), role as UserRole);
      }
    }
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
          role: devPayload.role ?? UserRole.TEAM_MEMBER,
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

    const role = this.mapAzureAdRoles(payload.roles)
      ?? this.tenantDefaultRole(payload.tenantId)
      ?? UserRole.TEAM_MEMBER;

    if (!user) {
      // Also check by email in case user was manually pre-created
      user = await this.userRepo.findOne({ where: { email: payload.email } });

      if (user) {
        // Link OID + tenant to existing email-matched user
        user.azureAdOid = payload.oid;
        if (payload.displayName) user.displayName = payload.displayName;
        if (payload.tenantId) user.tenantId = payload.tenantId;
        user = await this.userRepo.save(user);
      } else {
        // First-time login — provision new user with tenant info
        user = this.userRepo.create({
          azureAdOid: payload.oid,
          email: payload.email,
          displayName: payload.displayName || payload.email,
          role,
          tenantId: payload.tenantId,
          isActive: true,
        });
        user = await this.userRepo.save(user);
      }
    } else {
      // Update display name + tenant on every login (keeps in sync with AD)
      let needsSave = false;
      if (payload.displayName && user.displayName !== payload.displayName) {
        user.displayName = payload.displayName;
        needsSave = true;
      }
      if (payload.tenantId && user.tenantId !== payload.tenantId) {
        user.tenantId = payload.tenantId;
        needsSave = true;
      }
      if (needsSave) {
        user = await this.userRepo.save(user);
      }
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      tenantId: user.tenantId,
    };
  }

  /**
   * Maps Azure AD app roles to internal UserRole.
   * If no recognized role is assigned, defaults to TEAM_MEMBER.
   *
   * To configure: In Azure AD > Enterprise Application > App Roles,
   * create roles matching the UserRole enum values:
   * ADMIN, OPERATIONS_DIRECTOR, DEPARTMENT_MANAGER, etc.
   */
  private mapAzureAdRoles(roles: string[]): UserRole | null {
    const roleValues = Object.values(UserRole) as string[];
    for (const r of roles) {
      if (roleValues.includes(r)) {
        return r as UserRole;
      }
    }
    return null;
  }

  /**
   * Returns the default role for a tenant, or null if not configured.
   */
  private tenantDefaultRole(tenantId: string | null): UserRole | null {
    if (!tenantId) return null;
    return this.tenantDefaultRoles.get(tenantId.toLowerCase()) ?? null;
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
