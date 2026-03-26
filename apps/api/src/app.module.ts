import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_INTERCEPTOR } from '@nestjs/core';
import KeyvRedis from '@keyv/redis';
import Keyv from 'keyv';
import * as path from 'path';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { HealthModule } from './modules/health/health.module';
import { PersonnelModule } from './modules/personnel/personnel.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SkillsModule } from './modules/skills/skills.module';
import { ProgramsModule } from './modules/programs/programs.module';
import { OpportunitiesModule } from './modules/opportunities/opportunities.module';
import { CostsModule } from './modules/costs/costs.module';
import { DeliverablesModule } from './modules/deliverables/deliverables.module';
import { AdminModule } from './modules/admin/admin.module';
import { envValidationSchema } from './config/env.validation';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { TenantInterceptor } from './common/tenant/tenant.interceptor';
import { SystemController } from './common/system.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        ssl: config.get<string>('DATABASE_SSL') === 'true' ? { rejectUnauthorized: false } : false,
        autoLoadEntities: true,
        synchronize: false, // NEVER true in production — use migrations
        migrationsRun: true, // Auto-run pending migrations on app startup
        migrations: [path.join(__dirname, 'database', 'migrations', '*{.ts,.js}')],
        migrationsTableName: 'migrations',
        logging: config.get<string>('NODE_ENV') === 'development' ? ['query', 'error'] : ['error'],
      }),
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        if (redisUrl) {
          return {
            stores: [new Keyv({ store: new KeyvRedis(redisUrl) })],
            ttl: 300_000, // 5 min default
          };
        }
        return { stores: [new Keyv()], ttl: 300_000 }; // In-memory fallback
      },
    }),
    AuthModule,
    UsersModule,
    ProjectsModule,
    TasksModule,
    HealthModule,
    PersonnelModule,
    InventoryModule,
    NotificationsModule,
    SkillsModule,
    ProgramsModule,
    OpportunitiesModule,
    CostsModule,
    DeliverablesModule,
    AdminModule,
  ],
  controllers: [SystemController],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: TenantInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*path');
  }
}
