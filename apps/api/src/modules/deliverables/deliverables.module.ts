import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliverableEntity } from './deliverable.entity';
import { TaskEntity } from '../tasks/task.entity';
import { CostEntryEntity } from '../costs/cost-entry.entity';
import { ProjectEntity } from '../projects/project.entity';
import { DeliverablesService } from './deliverables.service';
import { DeliverablesController } from './deliverables.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([DeliverableEntity, TaskEntity, CostEntryEntity, ProjectEntity]),
  ],
  providers: [DeliverablesService],
  controllers: [DeliverablesController],
  exports: [DeliverablesService],
})
export class DeliverablesModule {}
