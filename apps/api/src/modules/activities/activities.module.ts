import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityEntity } from './activity.entity';
import { ActivityTemplateEntity } from './activity-template.entity';
import { ActivitiesService } from './activities.service';
import { ActivityTemplatesService } from './activity-templates.service';
import { ActivitiesController, ActivityTimelineController } from './activities.controller';
import { ActivityTemplatesController } from './activity-templates.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ActivityEntity, ActivityTemplateEntity])],
  controllers: [ActivitiesController, ActivityTimelineController, ActivityTemplatesController],
  providers: [ActivitiesService, ActivityTemplatesService],
  exports: [ActivitiesService, ActivityTemplatesService],
})
export class ActivitiesModule {}
