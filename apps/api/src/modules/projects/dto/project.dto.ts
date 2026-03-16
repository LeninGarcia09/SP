import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsEnum,
  IsOptional,
  IsNumber,
  IsUUID,
  IsDateString,
  IsObject,
  Min,
} from 'class-validator';
import { ProjectStatus } from '@bizops/shared';

export class CreateProjectDto {
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ maxLength: 5000, default: '' })
  @IsString()
  @MaxLength(5000)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: ProjectStatus, default: ProjectStatus.PLANNING })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @ApiProperty({ example: '2025-01-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2025-12-31' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ default: 0, minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  budget?: number;

  @ApiPropertyOptional({ default: 0, minimum: 0, description: 'Actual cost spent on the project' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  actualCost?: number;

  @ApiPropertyOptional({ default: 0, minimum: 0, description: 'Hourly cost rate for converting task hours to dollars' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  costRate?: number;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  projectLeadId: string;

  @ApiPropertyOptional({ default: {} })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ format: 'uuid', description: 'Program this project belongs to' })
  @IsUUID()
  @IsOptional()
  programId?: string;
}

export class UpdateProjectDto {
  @ApiPropertyOptional({ maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ maxLength: 5000 })
  @IsString()
  @MaxLength(5000)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  budget?: number;

  @ApiPropertyOptional({ minimum: 0, description: 'Actual cost spent on the project' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  actualCost?: number;

  @ApiPropertyOptional({ minimum: 0, description: 'Hourly cost rate for converting task hours to dollars' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  costRate?: number;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID()
  @IsOptional()
  projectLeadId?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ format: 'uuid', description: 'Program this project belongs to' })
  @IsUUID()
  @IsOptional()
  programId?: string;
}
