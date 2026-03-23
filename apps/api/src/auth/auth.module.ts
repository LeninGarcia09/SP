import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtStrategy } from './jwt.strategy';
import { DevAuthController } from './dev-auth.controller';
import { MeController } from './me.controller';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserEntity } from '../modules/users/user.entity';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([UserEntity]),
  ],
  controllers: [DevAuthController, MeController],
  providers: [JwtStrategy, RolesGuard],
  exports: [PassportModule, RolesGuard],
})
export class AuthModule {}
