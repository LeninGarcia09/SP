import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OpportunityEntity } from './opportunity.entity';
import { OpportunityStakeholderEntity } from './opportunity-stakeholder.entity';
import { OpportunityTeamMemberEntity } from './opportunity-team-member.entity';
import { OpportunityLineItemEntity } from './opportunity-line-item.entity';
import { OpportunityCompetitorEntity } from './opportunity-competitor.entity';
import { ProjectEntity } from '../projects/project.entity';
import { PipelineStageEntity } from '../pipelines/pipeline-stage.entity';
import { OpportunitiesService } from './opportunities.service';
import { OpportunitiesController } from './opportunities.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OpportunityEntity,
      OpportunityStakeholderEntity,
      OpportunityTeamMemberEntity,
      OpportunityLineItemEntity,
      OpportunityCompetitorEntity,
      ProjectEntity,
      PipelineStageEntity,
    ]),
  ],
  providers: [OpportunitiesService],
  controllers: [OpportunitiesController],
  exports: [OpportunitiesService],
})
export class OpportunitiesModule {}
