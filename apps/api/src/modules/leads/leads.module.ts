import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadEntity } from './lead.entity';
import { AccountEntity } from '../accounts/account.entity';
import { ContactEntity } from '../contacts/contact.entity';
import { OpportunityEntity } from '../opportunities/opportunity.entity';
import { PipelineStageEntity } from '../pipelines/pipeline-stage.entity';
import { ActivityEntity } from '../activities/activity.entity';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LeadEntity,
      AccountEntity,
      ContactEntity,
      OpportunityEntity,
      PipelineStageEntity,
      ActivityEntity,
    ]),
  ],
  providers: [LeadsService],
  controllers: [LeadsController],
  exports: [LeadsService],
})
export class LeadsModule {}
