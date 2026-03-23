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
import { ProgramStatus } from '@bizops/shared';

export class CreateProgramDto {
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

  @ApiPropertyOptional({ enum: ProgramStatus, default: ProgramStatus.PLANNING })
  @IsEnum(ProgramStatus)
  @IsOptional()
  status?: ProgramStatus;

  @ApiProperty({ example: '2025-01-01' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ default: 0, minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  budget?: number;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID()
  @IsOptional()
  managerId?: string;

  @ApiPropertyOptional({ default: {} })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class UpdateProgramDto {
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

  @ApiPropertyOptional({ enum: ProgramStatus })
  @IsEnum(ProgramStatus)
  @IsOptional()
  status?: ProgramStatus;

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

  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID()
  @IsOptional()
  managerId?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
