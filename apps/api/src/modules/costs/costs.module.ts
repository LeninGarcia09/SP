import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CostEntryEntity } from './cost-entry.entity';
import { ProjectEntity } from '../projects/project.entity';
import { TaskEntity } from '../tasks/task.entity';
import { CostsService } from './costs.service';
import { CostsController } from './costs.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CostEntryEntity, ProjectEntity, TaskEntity]),
    NotificationsModule,
  ],
  providers: [CostsService],
  controllers: [CostsController],
  exports: [CostsService],
})
export class CostsModule {}
