import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsInt,
  IsArray,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import { ForecastCategory } from '@telnub/shared';

// ── Pipeline DTOs ──

export class CreatePipelineDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}

export class UpdatePipelineDto {
  @ApiPropertyOptional({ maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}

// ── Pipeline Stage DTOs ──

export class CreatePipelineStageDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  sortOrder: number;

  @ApiPropertyOptional({ default: 0, minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  defaultProbability?: number;

  @ApiPropertyOptional({ enum: ForecastCategory, default: ForecastCategory.PIPELINE })
  @IsEnum(ForecastCategory)
  @IsOptional()
  forecastCategory?: ForecastCategory;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isClosed?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isWon?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  requiredFields?: string[];

  @ApiPropertyOptional({ default: [] })
  @IsArray()
  @IsOptional()
  checklist?: Record<string, unknown>[];

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  daysExpected?: number;

  @ApiPropertyOptional({ default: [] })
  @IsArray()
  @IsOptional()
  autoActions?: Record<string, unknown>[];

  @ApiPropertyOptional({ maxLength: 7, example: '#3B82F6' })
  @IsString()
  @MaxLength(7)
  @IsOptional()
  color?: string;
}

export class UpdatePipelineStageDto {
  @ApiPropertyOptional({ maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  defaultProbability?: number;

  @ApiPropertyOptional({ enum: ForecastCategory })
  @IsEnum(ForecastCategory)
  @IsOptional()
  forecastCategory?: ForecastCategory;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isClosed?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isWon?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  requiredFields?: string[];

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  checklist?: Record<string, unknown>[];

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  daysExpected?: number;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  autoActions?: Record<string, unknown>[];

  @ApiPropertyOptional({ maxLength: 7 })
  @IsString()
  @MaxLength(7)
  @IsOptional()
  color?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
