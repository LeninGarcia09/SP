import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { HealthModule } from './modules/health/health.module';
import { PersonnelModule } from './modules/personnel/personnel.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { envValidationSchema } from './config/env.validation';

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
        logging: config.get<string>('NODE_ENV') === 'development' ? ['query', 'error'] : ['error'],
      }),
    }),
    AuthModule,
    UsersModule,
    ProjectsModule,
    TasksModule,
    HealthModule,
    PersonnelModule,
    InventoryModule,
  ],
})
export class AppModule {}
