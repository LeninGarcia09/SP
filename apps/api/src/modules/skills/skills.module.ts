import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SkillEntity } from './skill.entity';
import { PersonSkillEntity } from './person-skill.entity';
import { SkillsService } from './skills.service';
import { SkillsController, PersonnelSkillsController } from './skills.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SkillEntity, PersonSkillEntity])],
  providers: [SkillsService],
  controllers: [SkillsController, PersonnelSkillsController],
  exports: [SkillsService],
})
export class SkillsModule {}
