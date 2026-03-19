import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonEntity } from './person.entity';
import { ProjectAssignmentEntity } from './project-assignment.entity';
import { PersonSkillEntity } from '../skills/person-skill.entity';
import { PersonnelService } from './personnel.service';
import { PersonnelController } from './personnel.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PersonEntity, ProjectAssignmentEntity, PersonSkillEntity])],
  providers: [PersonnelService],
  controllers: [PersonnelController],
  exports: [PersonnelService],
})
export class PersonnelModule {}
