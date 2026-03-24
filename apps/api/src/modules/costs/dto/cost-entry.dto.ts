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
import { CostCategory, CostEntryStatus } from '@telnub/shared';

export class CreateCostEntryDto {
  @ApiProperty({ enum: CostCategory })
  @IsEnum(CostCategory)
  category: string;

  @ApiProperty({ maxLength: 500 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  vendor?: string | null;

  @ApiProperty({ minimum: 0 })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: '2026-03-15' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID()
  @IsOptional()
  taskId?: string | null;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  invoiceRef?: string | null;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string | null;

  @ApiPropertyOptional({ default: {} })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class UpdateCostEntryDto {
  @ApiPropertyOptional({ enum: CostCategory })
  @IsEnum(CostCategory)
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  vendor?: string | null;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({ example: '2026-03-15' })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID()
  @IsOptional()
  taskId?: string | null;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  invoiceRef?: string | null;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string | null;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class TransferCostEntryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  targetProjectId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reason?: string;
}

export class RejectCostEntryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reason?: string;
}
