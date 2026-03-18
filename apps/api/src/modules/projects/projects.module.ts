import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectEntity } from './project.entity';
import { ProjectMemberEntity } from './project-member.entity';
import { ProjectNoteEntity } from './project-note.entity';
import { TaskEntity } from '../tasks/task.entity';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectEntity, ProjectMemberEntity, ProjectNoteEntity, TaskEntity]),
  ],
  providers: [ProjectsService],
  controllers: [ProjectsController],
  exports: [ProjectsService],
})
export class ProjectsModule {}
