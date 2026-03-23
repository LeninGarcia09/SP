import { Controller, Post, Get, Body, Logger, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IsEnum, IsOptional } from 'class-validator';
import * as jwt from 'jsonwebtoken';
import { UserEntity } from '../modules/users/user.entity';
import { UserRole } from '@bizops/shared';

/** One test user per role, seeded on first use. */
const DEV_USERS: { email: string; displayName: string; oid: string; role: UserRole }[] = [
  { email: 'dev@bizops.local', displayName: 'Dev Admin (Global Lead)', oid: 'dev-local-oid-00000', role: UserRole.GLOBAL_LEAD },
  { email: 'dev-bizops@bizops.local', displayName: 'Dev BizOps Manager', oid: 'dev-local-oid-00001', role: UserRole.BIZ_OPS_MANAGER },
  { email: 'dev-resource@bizops.local', displayName: 'Dev Resource Manager', oid: 'dev-local-oid-00002', role: UserRole.RESOURCE_MANAGER },
  { email: 'dev-program@bizops.local', displayName: 'Dev Program Manager', oid: 'dev-local-oid-00003', role: UserRole.PROGRAM_MANAGER },
  { email: 'dev-projlead@bizops.local', displayName: 'Dev Project Lead', oid: 'dev-local-oid-00004', role: UserRole.PROJECT_LEAD },
  { email: 'dev-personnel@bizops.local', displayName: 'Dev Personnel', oid: 'dev-local-oid-00005', role: UserRole.PROJECT_PERSONNEL },
  { email: 'dev-inventory@bizops.local', displayName: 'Dev Inventory Manager', oid: 'dev-local-oid-00006', role: UserRole.INVENTORY_MANAGER },
  { email: 'dev-hr@bizops.local', displayName: 'Dev HR Admin', oid: 'dev-local-oid-00007', role: UserRole.HR_ADMIN },
];

class DevLoginDto {
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}

/**
 * Dev-only controller that issues JWT tokens for local testing.
 * Returns 403 if NODE_ENV is not 'development'.
 * Supports role selection via body { role: "PROJECT_LEAD" }.
 */
@Controller('auth')
export class DevAuthController {
  private readonly logger = new Logger('DevAuth');

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  @Post('dev-login')
  async devLogin(@Body() dto?: DevLoginDto) {
    this.assertDev();

    const targetRole = dto?.role ?? UserRole.GLOBAL_LEAD;
    const template = DEV_USERS.find((u) => u.role === targetRole) ?? DEV_USERS[0]!;

    let user = await this.userRepo.findOne({ where: { email: template.email } });
    if (!user) {
      user = this.userRepo.create({
        email: template.email,
        displayName: template.displayName,
        azureAdOid: template.oid,
        role: template.role,
        isActive: true,
      });
      user = await this.userRepo.save(user);
      this.logger.log(`Created dev user: ${user.email} (${user.role})`);
    }

    return { data: this.issueToken(user) };
  }

  @Get('dev-roles')
  getRoles() {
    this.assertDev();
    return {
      data: Object.values(UserRole).map((role) => ({
        role,
        email: DEV_USERS.find((u) => u.role === role)?.email,
        displayName: DEV_USERS.find((u) => u.role === role)?.displayName,
      })),
    };
  }

  @Post('dev-seed')
  async seedAllDevUsers() {
    this.assertDev();
    const results: { email: string; role: UserRole; created: boolean }[] = [];
    for (const template of DEV_USERS) {
      let existing = await this.userRepo.findOne({ where: { email: template.email } });
      if (!existing) {
        existing = this.userRepo.create({
          email: template.email,
          displayName: template.displayName,
          azureAdOid: template.oid,
          role: template.role,
          isActive: true,
        });
        existing = await this.userRepo.save(existing);
        results.push({ email: existing.email, role: existing.role, created: true });
      } else {
        results.push({ email: existing.email, role: existing.role, created: false });
      }
    }
    return { data: results };
  }

  private assertDev() {
    const env = this.config.get<string>('NODE_ENV');
    if (env !== 'development' && env !== 'test') {
      throw new ForbiddenException('Dev login is only available in development');
    }
  }

  private issueToken(user: UserEntity) {
    const secret = this.config.get<string>('JWT_SECRET')!;
    const expiresIn = this.config.get<string>('JWT_EXPIRES_IN') || '8h';

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn } as jwt.SignOptions,
    );

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    };
  }
}
