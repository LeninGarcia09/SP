import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesPipelineEntity } from './sales-pipeline.entity';
import { PipelineStageEntity } from './pipeline-stage.entity';
import { PipelinesService } from './pipelines.service';
import { PipelinesController } from './pipelines.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SalesPipelineEntity, PipelineStageEntity])],
  providers: [PipelinesService],
  controllers: [PipelinesController],
  exports: [PipelinesService],
})
export class PipelinesModule {}
