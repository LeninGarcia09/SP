import { Controller, Post, Logger, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as jwt from 'jsonwebtoken';
import { UserEntity } from '../modules/users/user.entity';
import { UserRole } from '@bizops/shared';

/**
 * Dev-only controller that issues a JWT token for local testing.
 * Returns 403 if NODE_ENV is not 'development'.
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
  async devLogin() {
    const env = this.config.get<string>('NODE_ENV');
    if (env !== 'development' && env !== 'test') {
      throw new ForbiddenException('Dev login is only available in development');
    }
    // Find or create the dev user
    let user = await this.userRepo.findOne({ where: { email: 'dev@bizops.local' } });
    if (!user) {
      user = this.userRepo.create({
        email: 'dev@bizops.local',
        displayName: 'Dev Admin',
        azureAdOid: 'dev-local-oid-00000',
        role: UserRole.GLOBAL_LEAD,
        isActive: true,
      });
      user = await this.userRepo.save(user);
      this.logger.log(`Created dev user: ${user.id}`);
    }

    const secret = this.config.get<string>('JWT_SECRET')!;
    const expiresIn = this.config.get<string>('JWT_EXPIRES_IN') || '8h';

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn } as jwt.SignOptions,
    );

    return {
      data: {
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
        },
      },
    };
  }
}
