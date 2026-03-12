import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectHealthSnapshotEntity } from './health-snapshot.entity';
import { ProjectEntity } from '../projects/project.entity';
import { TaskEntity } from '../tasks/task.entity';
import { RagEngine } from './rag.engine';
import { HealthService } from './health.service';
import { HealthController } from './health.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectHealthSnapshotEntity, ProjectEntity, TaskEntity]),
  ],
  providers: [RagEngine, HealthService],
  controllers: [HealthController],
  exports: [HealthService, RagEngine],
})
export class HealthModule {}
